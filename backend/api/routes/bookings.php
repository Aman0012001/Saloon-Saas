<?php
// Booking routes

// GET /api/bookings - Get bookings (filtered by user or salon)
if ($method === 'GET' && count($uriParts) === 1) {
    $userData = Auth::getUserFromToken();
    if (!$userData) {
        sendResponse(['error' => 'Unauthorized'], 401);
    }

    $salonId = $_GET['salon_id'] ?? null;
    $userId = $_GET['user_id'] ?? $userData['user_id'];

    if ($salonId) {
        // Check if user has access to salon
        $stmt = $db->prepare("SELECT id FROM user_roles WHERE user_id = ? AND salon_id = ?");
        $stmt->execute([$userData['user_id'], $salonId]);
        if (!$stmt->fetch()) {
            sendResponse(['error' => 'Forbidden'], 403);
        }

        $stmt = $db->prepare("
            SELECT b.*, s.name as service_name, s.price, s.duration_minutes,
                   u.email, p.full_name, p.phone
            FROM bookings b
            INNER JOIN services s ON b.service_id = s.id
            INNER JOIN users u ON b.user_id = u.id
            LEFT JOIN profiles p ON u.id = p.user_id
            WHERE b.salon_id = ?
            ORDER BY b.booking_date DESC, b.booking_time DESC
        ");
        $stmt->execute([$salonId]);
    } else {
        // Get user's bookings
        $stmt = $db->prepare("
            SELECT b.*, s.name as service_name, s.price, s.duration_minutes,
                   sal.name as salon_name, sal.address, sal.city, sal.phone as salon_phone
            FROM bookings b
            INNER JOIN services s ON b.service_id = s.id
            INNER JOIN salons sal ON b.salon_id = sal.id
            WHERE b.user_id = ?
            ORDER BY b.booking_date DESC, b.booking_time DESC
        ");
        $stmt->execute([$userId]);
    }

    $bookings = $stmt->fetchAll();
    sendResponse(['bookings' => $bookings]);
}

// GET /api/bookings/:id - Get booking by ID
if ($method === 'GET' && count($uriParts) === 2) {
    $userData = Auth::getUserFromToken();
    if (!$userData) {
        sendResponse(['error' => 'Unauthorized'], 401);
    }

    $bookingId = $uriParts[1];
    $stmt = $db->prepare("
        SELECT b.*, s.name as service_name, s.price, s.duration_minutes,
               sal.name as salon_name, sal.address, sal.city, sal.phone as salon_phone,
               u.email, p.full_name, p.phone
        FROM bookings b
        INNER JOIN services s ON b.service_id = s.id
        INNER JOIN salons sal ON b.salon_id = sal.id
        INNER JOIN users u ON b.user_id = u.id
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE b.id = ?
    ");
    $stmt->execute([$bookingId]);
    $booking = $stmt->fetch();

    if (!$booking) {
        sendResponse(['error' => 'Booking not found'], 404);
    }

    // Check if user has access
    $hasAccess = ($booking['user_id'] === $userData['user_id']);
    if (!$hasAccess) {
        $stmt = $db->prepare("SELECT id FROM user_roles WHERE user_id = ? AND salon_id = ?");
        $stmt->execute([$userData['user_id'], $booking['salon_id']]);
        $hasAccess = (bool) $stmt->fetch();
    }

    if (!$hasAccess) {
        sendResponse(['error' => 'Forbidden'], 403);
    }

    sendResponse(['booking' => $booking]);
}

// POST /api/bookings - Create new booking
if ($method === 'POST' && count($uriParts) === 1) {
    $userData = Auth::getUserFromToken();
    if (!$userData) {
        sendResponse(['error' => 'Unauthorized'], 401);
    }

    $data = getRequestBody();
    $bookingId = bin2hex(random_bytes(16));

    // Check if slot is available
    $stmt = $db->prepare("
        SELECT id FROM bookings
        WHERE salon_id = ? AND booking_date = ? AND booking_time = ? AND status != 'cancelled'
    ");
    $stmt->execute([$data['salon_id'], $data['booking_date'], $data['booking_time']]);
    if ($stmt->fetch()) {
        sendResponse(['error' => 'Slot not available'], 409);
    }

    $stmt = $db->prepare("
        INSERT INTO bookings (id, user_id, salon_id, service_id, booking_date, booking_time, notes, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $bookingId,
        $userData['user_id'],
        $data['salon_id'],
        $data['service_id'],
        $data['booking_date'],
        $data['booking_time'],
        $data['notes'] ?? null,
        $data['status'] ?? 'confirmed'
    ]);

    $stmt = $db->prepare("SELECT * FROM bookings WHERE id = ?");
    $stmt->execute([$bookingId]);
    $booking = $stmt->fetch();

    sendResponse(['booking' => $booking], 201);
}

// PUT /api/bookings/:id - Update booking status
if ($method === 'PUT' && count($uriParts) === 2) {
    $userData = Auth::getUserFromToken();
    if (!$userData) {
        sendResponse(['error' => 'Unauthorized'], 401);
    }

    $bookingId = $uriParts[1];
    $data = getRequestBody();

    // Get booking
    $stmt = $db->prepare("SELECT * FROM bookings WHERE id = ?");
    $stmt->execute([$bookingId]);
    $booking = $stmt->fetch();

    if (!$booking) {
        sendResponse(['error' => 'Booking not found'], 404);
    }

    // Check permission
    $hasAccess = ($booking['user_id'] === $userData['user_id']);
    if (!$hasAccess) {
        $stmt = $db->prepare("SELECT id FROM user_roles WHERE user_id = ? AND salon_id = ?");
        $stmt->execute([$userData['user_id'], $booking['salon_id']]);
        $hasAccess = (bool) $stmt->fetch();
    }

    if (!$hasAccess) {
        sendResponse(['error' => 'Forbidden'], 403);
    }

    $stmt = $db->prepare("UPDATE bookings SET status = ? WHERE id = ?");
    $stmt->execute([$data['status'], $bookingId]);

    $stmt = $db->prepare("SELECT * FROM bookings WHERE id = ?");
    $stmt->execute([$bookingId]);
    $booking = $stmt->fetch();

    sendResponse(['booking' => $booking]);
}

sendResponse(['error' => 'Booking route not found'], 404);
