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
if (!$userData || !isSuperAdmin($db, $userData['user_id'])) {
    sendResponse(['error' => 'Forbidden - Admin access required'], 403);
}

// GET /api/admin/stats - Get platform statistics
if ($method === 'GET' && $uriParts[1] === 'stats') {
    $stats = [];

    // Total salons
    $stmt = $db->query("SELECT COUNT(*) as count FROM salons");
    $stats['total_salons'] = $stmt->fetch()['count'];

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

    sendResponse(['stats' => $stats]);
}

// GET /api/admin/salons - Get all salons for admin
if ($method === 'GET' && $uriParts[1] === 'salons') {
    $status = $_GET['status'] ?? 'all';

    $query = "SELECT * FROM salons";
    if ($status !== 'all') {
        $query .= " WHERE approval_status = ?";
    }
    $query .= " ORDER BY created_at DESC";

    $stmt = $db->prepare($query);
    if ($status !== 'all') {
        $stmt->execute([$status]);
    } else {
        $stmt->execute();
    }
    $salons = $stmt->fetchAll();

    sendResponse(['salons' => $salons]);
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

// GET /api/admin/bookings - Get all bookings
if ($method === 'GET' && $uriParts[1] === 'bookings') {
    $stmt = $db->prepare("
        SELECT b.*, s.name as service_name, sal.name as salon_name,
               u.email, p.full_name
        FROM bookings b
        INNER JOIN services s ON b.service_id = s.id
        INNER JOIN salons sal ON b.salon_id = sal.id
        INNER JOIN users u ON b.user_id = u.id
        LEFT JOIN profiles p ON u.id = p.user_id
        ORDER BY b.created_at DESC
        LIMIT 100
    ");
    $stmt->execute();
    $bookings = $stmt->fetchAll();

    sendResponse(['bookings' => $bookings]);
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

    sendResponse(['users' => $users]);
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

    sendResponse(['payments' => $payments]);
}

sendResponse(['error' => 'Admin route not found'], 404);
