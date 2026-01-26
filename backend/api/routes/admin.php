<?php
// Admin routes

// Helper function to check if user is super admin
function isSuperAdmin($db, $userId)
{
    $stmt = $db->prepare("SELECT id FROM platform_admins WHERE user_id = ? AND is_active = 1");
    $stmt->execute([$userId]);
    return (bool) $stmt->fetch();
}

// Verify admin access
$userData = Auth::getUserFromToken();
if (!$userData) {
    sendResponse(['error' => 'Unauthorized - No valid session found in registry.'], 401);
}

if (!isSuperAdmin($db, $userData['user_id'])) {
    sendResponse([
        'error' => 'Access Denied - This digital identity does not have governance clearance.',
        'user_id' => $userData['user_id']
    ], 403);
}

// GET /api/admin/stats - Get platform statistics
if ($method === 'GET' && $uriParts[1] === 'stats') {
    $stats = [];

    // Total salons
    $stmt = $db->query("SELECT COUNT(*) as count FROM salons");
    $stats['total_salons'] = $stmt->fetch()['count'];

    // Active salons
    $stmt = $db->query("SELECT COUNT(*) as count FROM salons WHERE is_active = 1");
    $stats['active_salons'] = $stmt->fetch()['count'];

    // Pending salons
    $stmt = $db->query("SELECT COUNT(*) as count FROM salons WHERE approval_status = 'pending'");
    $stats['pending_salons'] = $stmt->fetch()['count'];

    // Total bookings
    $stmt = $db->query("SELECT COUNT(*) as count FROM bookings");
    $stats['total_bookings'] = $stmt->fetch()['count'];

    // Total users
    $stmt = $db->query("SELECT COUNT(*) as count FROM users");
    $stats['total_users'] = $stmt->fetch()['count'];

    // Total revenue
    $stmt = $db->query("SELECT SUM(amount) as total FROM platform_payments WHERE status = 'completed'");
    $stats['total_revenue'] = $stmt->fetch()['total'] ?? 0;

    sendResponse($stats);
}

// GET /api/admin/salons - Get all salons for admin
if ($method === 'GET' && $uriParts[1] === 'salons') {
    $status = $_GET['status'] ?? 'all';

    $query = "
        SELECT s.*, p.full_name as owner_name,
               (SELECT COUNT(*) FROM bookings b WHERE b.salon_id = s.id) as booking_count
        FROM salons s
        LEFT JOIN user_roles ur ON s.id = ur.salon_id AND ur.role = 'owner'
        LEFT JOIN profiles p ON ur.user_id = p.user_id
    ";
    if ($status !== 'all') {
        $query .= " WHERE s.approval_status = ?";
    }
    $query .= " ORDER BY s.created_at DESC";

    $stmt = $db->prepare($query);
    if ($status !== 'all') {
        $stmt->execute([$status]);
    } else {
        $stmt->execute();
    }
    $salons = $stmt->fetchAll();

    sendResponse($salons);
}

// PUT /api/admin/salons/:id/approve - Approve salon
if ($method === 'PUT' && $uriParts[1] === 'salons' && isset($uriParts[3]) && $uriParts[3] === 'approve') {
    $salonId = $uriParts[2];

    $stmt = $db->prepare("
        UPDATE salons SET
            approval_status = 'approved',
            approved_at = NOW(),
            approved_by = ?
        WHERE id = ?
    ");
    $stmt->execute([$userData['user_id'], $salonId]);

    sendResponse(['message' => 'Salon approved successfully']);
}

// PUT /api/admin/salons/:id/reject - Reject salon
if ($method === 'PUT' && $uriParts[1] === 'salons' && isset($uriParts[3]) && $uriParts[3] === 'reject') {
    $salonId = $uriParts[2];
    $data = getRequestBody();

    $stmt = $db->prepare("
        UPDATE salons SET
            approval_status = 'rejected',
            rejection_reason = ?
        WHERE id = ?
    ");
    $stmt->execute([$data['reason'] ?? 'Not specified', $salonId]);

    sendResponse(['message' => 'Salon rejected']);
}

// GET /api/admin/users - Get all users
if ($method === 'GET' && $uriParts[1] === 'users') {
    $stmt = $db->prepare("
        SELECT u.id, u.email, u.email_verified, u.created_at,
               p.full_name, p.phone, p.user_type
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        ORDER BY u.created_at DESC
    ");
    $stmt->execute();
    $users = $stmt->fetchAll();

    sendResponse($users);
}

// GET /api/admin/payments - Get all payments
if ($method === 'GET' && $uriParts[1] === 'payments') {
    $stmt = $db->prepare("
        SELECT p.*, s.name as salon_name
        FROM platform_payments p
        INNER JOIN salons s ON p.salon_id = s.id
        ORDER BY p.created_at DESC
        LIMIT 100
    ");
    $stmt->execute();
    $payments = $stmt->fetchAll();

    sendResponse($payments);
}

// GET /api/admin/reports - Get platform reports
if ($method === 'GET' && $uriParts[1] === 'reports') {
    $range = $_GET['range'] ?? '30';
    $range = intval($range);

    // 1. Core Totals
    $stmt = $db->prepare("SELECT IFNULL(SUM(amount), 0) as total FROM platform_payments WHERE status = 'completed' AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)");
    $stmt->execute([$range]);
    $totalRevenue = $stmt->fetch()['total'];

    $stmt = $db->prepare("SELECT COUNT(*) as total FROM bookings WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)");
    $stmt->execute([$range]);
    $totalBookings = $stmt->fetch()['total'];

    $stmt = $db->prepare("SELECT COUNT(*) as total FROM bookings WHERE status = 'cancelled' AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)");
    $stmt->execute([$range]);
    $cancelledBookings = $stmt->fetch()['total'];

    $stmt = $db->prepare("SELECT COUNT(*) as total FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)");
    $stmt->execute([$range]);
    $newUsers = $stmt->fetch()['total'];

    $cancellationRate = ($totalBookings > 0) ? round(($cancelledBookings / $totalBookings) * 100, 1) : 0;

    // 2. Revenue History
    $stmt = $db->prepare("
        SELECT DATE(created_at) as date, SUM(amount) as value
        FROM platform_payments
        WHERE status = 'completed' AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(created_at)
        ORDER BY date ASC
    ");
    $stmt->execute([$range]);
    $revenueHistory = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Top Salons (by activity)
    $stmt = $db->prepare("
        SELECT s.name, COUNT(b.id) as count
        FROM salons s
        JOIN bookings b ON s.id = b.salon_id
        WHERE b.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY s.id, s.name
        ORDER BY count DESC
        LIMIT 5
    ");
    $stmt->execute([$range]);
    $topSalons = $stmt->fetchAll(PDO::FETCH_ASSOC);

    sendResponse([
        'reports' => [
            'total_revenue' => $totalRevenue,
            'total_bookings' => $totalBookings,
            'cancellation_rate' => $cancellationRate,
            'new_users' => $newUsers,
            'revenue_history' => $revenueHistory,
            'top_salons' => $topSalons
        ]
    ]);
}

// GET /api/admin/settings - Get platform settings
if ($method === 'GET' && $uriParts[1] === 'settings') {
    $stmt = $db->query("SELECT setting_key, setting_value FROM platform_settings");
    $settingsRaw = $stmt->fetchAll();

    $settings = [];
    foreach ($settingsRaw as $row) {
        $settings[$row['setting_key']] = json_decode($row['setting_value'], true);
    }

    sendResponse($settings);
}

// PUT /api/admin/settings - Update platform settings
if ($method === 'PUT' && $uriParts[1] === 'settings') {
    $data = getRequestBody();

    $db->beginTransaction();
    try {
        foreach ($data as $key => $value) {
            $stmt = $db->prepare("
                INSERT INTO platform_settings (id, setting_key, setting_value, updated_by)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_by = VALUES(updated_by)
            ");
            $stmt->execute([Auth::generateUuid(), $key, json_encode($value), $userData['user_id']]);
        }
        $db->commit();
        sendResponse(['message' => 'Settings updated successfully']);
    } catch (Exception $e) {
        $db->rollBack();
        sendResponse(['error' => 'Failed to update settings: ' . $e->getMessage()], 500);
    }
}

sendResponse(['error' => 'Admin route not found'], 404);
