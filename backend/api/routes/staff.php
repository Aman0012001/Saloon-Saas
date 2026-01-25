<?php
// Staff routes

// GET /api/staff?salon_id=xxx - Get salon staff members
if ($method === 'GET' && empty($uriParts[1])) {
    $salonId = $_GET['salon_id'] ?? null;

    if (!$salonId) {
        sendResponse(['error' => 'salon_id is required'], 400);
    }

    $stmt = $db->prepare("
        SELECT s.*, ur.role 
        FROM staff_profiles s
        LEFT JOIN user_roles ur ON s.user_id = ur.user_id AND s.salon_id = ur.salon_id
        WHERE s.salon_id = ?
        ORDER BY s.created_at DESC
    ");
    $stmt->execute([$salonId]);
    $staff = $stmt->fetchAll();

    sendResponse(['staff' => $staff]);
}

// POST /api/staff - Create new staff member
if ($method === 'POST' && empty($uriParts[1])) {
    $userData = Auth::getUserFromToken();
    if (!$userData) {
        sendResponse(['error' => 'Unauthorized'], 401);
    }

    $data = getRequestBody();

    if (empty($data['salon_id']) || empty($data['display_name'])) {
        sendResponse(['error' => 'Missing required fields'], 400);
    }

    // Check if user is owner/manager of the salon
    $stmt = $db->prepare("SELECT role FROM user_roles WHERE user_id = ? AND salon_id = ?");
    $stmt->execute([$userData['user_id'], $data['salon_id']]);
    $userRole = $stmt->fetch();

    if (!$userRole || ($userRole['role'] !== 'owner' && $userRole['role'] !== 'manager')) {
        sendResponse(['error' => 'Forbidden'], 403);
    }

    $id = Auth::generateUuid();
    $stmt = $db->prepare("
        INSERT INTO staff_profiles 
        (id, user_id, salon_id, display_name, email, phone, specializations, commission_percentage, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $specializations = isset($data['specializations']) ? json_encode($data['specializations']) : '[]';

    $stmt->execute([
        $id,
        $data['user_id'] ?? null,
        $data['salon_id'],
        $data['display_name'],
        $data['email'] ?? null,
        $data['phone'] ?? null,
        $specializations,
        $data['commission_percentage'] ?? 0,
        isset($data['is_active']) ? (bool) $data['is_active'] : true
    ]);

    // If a user_id was provided and a role was provided, create/update user_role
    if (!empty($data['user_id']) && !empty($data['role'])) {
        $roleId = Auth::generateUuid();
        $stmt = $db->prepare("
            INSERT INTO user_roles (id, user_id, salon_id, role)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE role = VALUES(role)
        ");
        $stmt->execute([$roleId, $data['user_id'], $data['salon_id'], $data['role']]);
    }

    $stmt = $db->prepare("SELECT * FROM staff_profiles WHERE id = ?");
    $stmt->execute([$id]);
    $newStaff = $stmt->fetch();

    sendResponse(['staff' => $newStaff], 201);
}

// PUT /api/staff/:id - Update staff member
if ($method === 'PUT' && !empty($uriParts[1])) {
    $userData = Auth::getUserFromToken();
    if (!$userData) {
        throw new Exception('Unauthorized', 401);
    }

    $staffId = $uriParts[1];
    $data = getRequestBody();

    // Get staff record to find salon_id
    $stmt = $db->prepare("SELECT * FROM staff_profiles WHERE id = ?");
    $stmt->execute([$staffId]);
    $staff = $stmt->fetch();

    if (!$staff) {
        sendResponse(['error' => 'Staff member not found'], 404);
    }

    // Check permissions
    $stmt = $db->prepare("SELECT role FROM user_roles WHERE user_id = ? AND salon_id = ?");
    $stmt->execute([$userData['user_id'], $staff['salon_id']]);
    $userRole = $stmt->fetch();

    if (!$userRole || ($userRole['role'] !== 'owner' && $userRole['role'] !== 'manager')) {
        sendResponse(['error' => 'Forbidden'], 403);
    }

    $fields = [];
    $params = [];

    $allowedFields = ['display_name', 'email', 'phone', 'specializations', 'commission_percentage', 'is_active', 'avatar_url'];

    foreach ($allowedFields as $field) {
        if (isset($data[$field])) {
            $fields[] = "$field = ?";
            $params[] = ($field === 'specializations' && is_array($data[$field])) ? json_encode($data[$field]) : $data[$field];
        }
    }

    if (!empty($fields)) {
        $params[] = $staffId;
        $sql = "UPDATE staff_profiles SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
    }

    // Update role if provided
    if (isset($data['role']) && !empty($staff['user_id'])) {
        $stmt = $db->prepare("UPDATE user_roles SET role = ? WHERE user_id = ? AND salon_id = ?");
        $stmt->execute([$data['role'], $staff['user_id'], $staff['salon_id']]);
    }

    $stmt = $db->prepare("SELECT * FROM staff_profiles WHERE id = ?");
    $stmt->execute([$staffId]);
    $updatedStaff = $stmt->fetch();

    sendResponse(['staff' => $updatedStaff]);
}

// DELETE /api/staff/:id - Delete staff member
if ($method === 'DELETE' && !empty($uriParts[1])) {
    $userData = Auth::getUserFromToken();
    if (!$userData) {
        sendResponse(['error' => 'Unauthorized'], 401);
    }

    $staffId = $uriParts[1];

    // Get staff record to find salon_id
    $stmt = $db->prepare("SELECT * FROM staff_profiles WHERE id = ?");
    $stmt->execute([$staffId]);
    $staff = $stmt->fetch();

    if (!$staff) {
        sendResponse(['error' => 'Staff member not found'], 404);
    }

    // Check permissions
    $stmt = $db->prepare("SELECT role FROM user_roles WHERE user_id = ? AND salon_id = ?");
    $stmt->execute([$userData['user_id'], $staff['salon_id']]);
    $userRole = $stmt->fetch();

    if (!$userRole || ($userRole['role'] !== 'owner' && $userRole['role'] !== 'manager')) {
        sendResponse(['error' => 'Forbidden'], 403);
    }

    $stmt = $db->prepare("DELETE FROM staff_profiles WHERE id = ?");
    $stmt->execute([$staffId]);

    sendResponse(['message' => 'Staff member deleted']);
}

sendResponse(['error' => 'Staff route not found'], 404);
