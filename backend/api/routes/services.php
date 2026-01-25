<?php
// Service routes

// GET /api/services?salon_id=xxx - Get services by salon
if ($method === 'GET' && count($uriParts) === 1) {
    $salonId = $_GET['salon_id'] ?? null;

    if (!$salonId) {
        sendResponse(['error' => 'salon_id is required'], 400);
    }

    $stmt = $db->prepare("
        SELECT * FROM services
        WHERE salon_id = ? AND is_active = 1
        ORDER BY category, name
    ");
    $stmt->execute([$salonId]);
    $services = $stmt->fetchAll();

    sendResponse(['services' => $services]);
}

// GET /api/services/:id - Get service by ID
if ($method === 'GET' && count($uriParts) === 2) {
    $serviceId = $uriParts[1];
    $stmt = $db->prepare("SELECT * FROM services WHERE id = ?");
    $stmt->execute([$serviceId]);
    $service = $stmt->fetch();

    if (!$service) {
        sendResponse(['error' => 'Service not found'], 404);
    }

    sendResponse(['service' => $service]);
}

// POST /api/services - Create new service
if ($method === 'POST' && count($uriParts) === 1) {
    $userData = Auth::getUserFromToken();
    if (!$userData) {
        sendResponse(['error' => 'Unauthorized'], 401);
    }

    $data = getRequestBody();
    $salonId = $data['salon_id'];

    // Check if user has permission
    $stmt = $db->prepare("SELECT id FROM user_roles WHERE user_id = ? AND salon_id = ? AND role IN ('owner', 'manager')");
    $stmt->execute([$userData['user_id'], $salonId]);
    if (!$stmt->fetch()) {
        sendResponse(['error' => 'Forbidden'], 403);
    }

    $serviceId = bin2hex(random_bytes(16));
    $stmt = $db->prepare("
        INSERT INTO services (id, salon_id, name, description, price, duration_minutes, category, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $serviceId,
        $salonId,
        $data['name'],
        $data['description'] ?? null,
        $data['price'],
        $data['duration_minutes'],
        $data['category'] ?? null,
        $data['image_url'] ?? null
    ]);

    $stmt = $db->prepare("SELECT * FROM services WHERE id = ?");
    $stmt->execute([$serviceId]);
    $service = $stmt->fetch();

    sendResponse(['service' => $service], 201);
}

// PUT /api/services/:id - Update service
if ($method === 'PUT' && count($uriParts) === 2) {
    $userData = Auth::getUserFromToken();
    if (!$userData) {
        sendResponse(['error' => 'Unauthorized'], 401);
    }

    $serviceId = $uriParts[1];
    $data = getRequestBody();

    // Get service and check permission
    $stmt = $db->prepare("SELECT salon_id FROM services WHERE id = ?");
    $stmt->execute([$serviceId]);
    $service = $stmt->fetch();

    if (!$service) {
        sendResponse(['error' => 'Service not found'], 404);
    }

    $stmt = $db->prepare("SELECT id FROM user_roles WHERE user_id = ? AND salon_id = ? AND role IN ('owner', 'manager')");
    $stmt->execute([$userData['user_id'], $service['salon_id']]);
    if (!$stmt->fetch()) {
        sendResponse(['error' => 'Forbidden'], 403);
    }

    $stmt = $db->prepare("
        UPDATE services SET
            name = ?, description = ?, price = ?, duration_minutes = ?, category = ?, image_url = ?, is_active = ?
        WHERE id = ?
    ");
    $stmt->execute([
        $data['name'],
        $data['description'] ?? null,
        $data['price'],
        $data['duration_minutes'],
        $data['category'] ?? null,
        $data['image_url'] ?? null,
        $data['is_active'] ?? 1,
        $serviceId
    ]);

    $stmt = $db->prepare("SELECT * FROM services WHERE id = ?");
    $stmt->execute([$serviceId]);
    $service = $stmt->fetch();

    sendResponse(['service' => $service]);
}

// DELETE /api/services/:id - Delete service
if ($method === 'DELETE' && count($uriParts) === 2) {
    $userData = Auth::getUserFromToken();
    if (!$userData) {
        sendResponse(['error' => 'Unauthorized'], 401);
    }

    $serviceId = $uriParts[1];

    // Get service and check permission
    $stmt = $db->prepare("SELECT salon_id FROM services WHERE id = ?");
    $stmt->execute([$serviceId]);
    $service = $stmt->fetch();

    if (!$service) {
        sendResponse(['error' => 'Service not found'], 404);
    }

    $stmt = $db->prepare("SELECT id FROM user_roles WHERE user_id = ? AND salon_id = ? AND role IN ('owner', 'manager')");
    $stmt->execute([$userData['user_id'], $service['salon_id']]);
    if (!$stmt->fetch()) {
        sendResponse(['error' => 'Forbidden'], 403);
    }

    $stmt = $db->prepare("DELETE FROM services WHERE id = ?");
    $stmt->execute([$serviceId]);

    sendResponse(['message' => 'Service deleted successfully']);
}

sendResponse(['error' => 'Service route not found'], 404);
