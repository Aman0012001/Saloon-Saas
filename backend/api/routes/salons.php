<?php
// Salon routes

// GET /api/salons - List all active salons
if ($method === 'GET' && count($uriParts) === 1) {
    try {
        $stmt = $db->prepare("
            SELECT id, name, slug, description, address, city, state, pincode, 
                   phone, email, logo_url, cover_image_url, is_active
            FROM salons
            WHERE is_active = 1
            ORDER BY created_at DESC
        ");
        $stmt->execute();
        $salons = $stmt->fetchAll();
        sendResponse(['salons' => $salons]);
    } catch (PDOException $e) {
        sendResponse(['error' => 'Query failed: ' . $e->getMessage()], 500);
    }
}

// GET /api/salons/my - Get user's salons
if ($method === 'GET' && $uriParts[1] === 'my') {
    $userData = Auth::getUserFromToken();
    if (!$userData) {
        sendResponse(['error' => 'Unauthorized'], 401);
    }

    $stmt = $db->prepare("
        SELECT s.*, ur.role
        FROM salons s
        INNER JOIN user_roles ur ON s.id = ur.salon_id
        WHERE ur.user_id = ?
        ORDER BY s.created_at DESC
    ");
    $stmt->execute([$userData['user_id']]);
    $salons = $stmt->fetchAll();

    sendResponse(['salons' => $salons]);
}

// GET /api/salons/:id - Get salon by ID
if ($method === 'GET' && count($uriParts) === 2) {
    $salonId = $uriParts[1];
    $stmt = $db->prepare("
        SELECT * FROM salons WHERE id = ? AND is_active = 1
    ");
    $stmt->execute([$salonId]);
    $salon = $stmt->fetch();

    if (!$salon) {
        sendResponse(['error' => 'Salon not found'], 404);
    }

    sendResponse(['salon' => $salon]);
}

// POST /api/salons - Create new salon
if ($method === 'POST' && count($uriParts) === 1) {
    $userData = Auth::getUserFromToken();
    if (!$userData) {
        sendResponse(['error' => 'Unauthorized'], 401);
    }

    $data = getRequestBody();
    $salonId = Auth::generateUuid();

    $db->beginTransaction();
    try {
        $stmt = $db->prepare("
            INSERT INTO salons (id, name, slug, description, address, city, state, pincode, phone, email, logo_url, cover_image_url, approval_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')
        ");
        $stmt->execute([
            $salonId,
            $data['name'],
            $data['slug'],
            $data['description'] ?? null,
            $data['address'] ?? null,
            $data['city'] ?? null,
            $data['state'] ?? null,
            $data['pincode'] ?? null,
            $data['phone'] ?? null,
            $data['email'] ?? null,
            $data['logo_url'] ?? null,
            $data['cover_image_url'] ?? null
        ]);

        // Create owner role
        $roleId = Auth::generateUuid();
        $stmt = $db->prepare("INSERT INTO user_roles (id, user_id, salon_id, role) VALUES (?, ?, ?, 'owner')");
        $stmt->execute([$roleId, $userData['user_id'], $salonId]);

        $db->commit();

        $stmt = $db->prepare("SELECT * FROM salons WHERE id = ?");
        $stmt->execute([$salonId]);
        $salon = $stmt->fetch();

        sendResponse(['salon' => $salon], 201);
    } catch (Exception $e) {
        $db->rollBack();
        sendResponse(['error' => 'Failed to create salon: ' . $e->getMessage()], 500);
    }
}

// PUT /api/salons/:id - Update salon
if ($method === 'PUT' && count($uriParts) === 2) {
    $userData = Auth::getUserFromToken();
    if (!$userData) {
        sendResponse(['error' => 'Unauthorized'], 401);
    }

    $salonId = $uriParts[1];
    $data = getRequestBody();

    // Check if user is owner
    $stmt = $db->prepare("SELECT id FROM user_roles WHERE user_id = ? AND salon_id = ? AND role = 'owner'");
    $stmt->execute([$userData['user_id'], $salonId]);
    if (!$stmt->fetch()) {
        sendResponse(['error' => 'Forbidden'], 403);
    }

    $stmt = $db->prepare("
        UPDATE salons SET
            name = ?, description = ?, address = ?, city = ?, state = ?,
            pincode = ?, phone = ?, email = ?, logo_url = ?, cover_image_url = ?
        WHERE id = ?
    ");
    $stmt->execute([
        $data['name'],
        $data['description'] ?? null,
        $data['address'] ?? null,
        $data['city'] ?? null,
        $data['state'] ?? null,
        $data['pincode'] ?? null,
        $data['phone'] ?? null,
        $data['email'] ?? null,
        $data['logo_url'] ?? null,
        $data['cover_image_url'] ?? null,
        $salonId
    ]);

    $stmt = $db->prepare("SELECT * FROM salons WHERE id = ?");
    $stmt->execute([$salonId]);
    $salon = $stmt->fetch();

    sendResponse(['salon' => $salon]);
}



sendResponse(['error' => 'Salon route not found'], 404);
