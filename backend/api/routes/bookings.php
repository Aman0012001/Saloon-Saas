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
            SELECT b.*, s.name as service_name, s.price, s.duration_minutes, s.category,
                   sal.name as salon_name, sal.address as salon_address, sal.city as salon_city,
                   u.email, p.full_name, p.phone
            FROM bookings b
            INNER JOIN services s ON b.service_id = s.id
            INNER JOIN salons sal ON b.salon_id = sal.id
            INNER JOIN users u ON b.user_id = u.id
            LEFT JOIN profiles p ON u.id = p.user_id
            WHERE b.salon_id = ?
            ORDER BY b.booking_date DESC, b.booking_time DESC
        ");
        $stmt->execute([$salonId]);
    } else {
        // Get user's bookings
        $stmt = $db->prepare("
            SELECT b.*, s.name as service_name, s.price, s.duration_minutes, s.category,
                   sal.name as salon_name, sal.address as salon_address, sal.city as salon_city, sal.phone as salon_phone
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
        SELECT b.*, s.name as service_name, s.price, s.duration_minutes, s.category,
               sal.name as salon_name, sal.address as salon_address, sal.city as salon_city, sal.phone as salon_phone,
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
    $bookingId = Auth::generateUuid();

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

    // Get booking with service name
    $stmt = $db->prepare("
        SELECT b.*, s.name as service_name, sal.name as salon_name
        FROM bookings b
        INNER JOIN services s ON b.service_id = s.id
        INNER JOIN salons sal ON b.salon_id = sal.id
        WHERE b.id = ?
    ");
    $stmt->execute([$bookingId]);
    $booking = $stmt->fetch();

    // Create notification for salon owner
    $stmt = $db->prepare("SELECT user_id FROM user_roles WHERE salon_id = ? AND role = 'owner'");
    $stmt->execute([$data['salon_id']]);
    $owner = $stmt->fetch();

    if ($owner) {
        $notifId = Auth::generateUuid();
        $stmt = $db->prepare("
            INSERT INTO notifications (id, user_id, salon_id, title, message, type, link)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $notifId,
            $owner['user_id'],
            $data['salon_id'],
            'New Appointment',
            "New session booked for {$booking['service_name']} on " . date('M d', strtotime($booking['booking_date'])),
            'booking',
            '/dashboard/appointments'
        ]);
    }

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

// GET /api/bookings/:id/review - Get review for booking
if ($method === 'GET' && count($uriParts) === 3 && $uriParts[2] === 'review') {
    $bookingId = $uriParts[1];
    $stmt = $db->prepare("SELECT * FROM booking_reviews WHERE booking_id = ?");
    $stmt->execute([$bookingId]);
    $review = $stmt->fetch();
    sendResponse(['review' => $review]);
}

// POST /api/bookings/:id/review - Submit review
if ($method === 'POST' && count($uriParts) === 3 && $uriParts[2] === 'review') {
    try {
        $userData = Auth::getUserFromToken();
        if (!$userData)
            sendResponse(['error' => 'Unauthorized - No valid session found.'], 401);

        $bookingId = $uriParts[1];
        $data = getRequestBody();

        if (!$data)
            sendResponse(['error' => 'Empty or invalid request payload.'], 400);

        $rating = intval($data['rating'] ?? 5);
        $comment = $data['comment'] ?? '';

        // 1. Verify booking existence and ownership
        $stmt = $db->prepare("SELECT * FROM bookings WHERE id = ? AND user_id = ?");
        $stmt->execute([$bookingId, $userData['user_id']]);
        $booking = $stmt->fetch();

        if (!$booking)
            sendResponse(['error' => 'Booking not found or you do not have permission to review it.'], 404);
        if ($booking['status'] !== 'completed')
            sendResponse(['error' => 'You can only leave feedback for completed sessions.'], 400);

        // 3. Check for existing review
        $stmt = $db->prepare("SELECT id FROM booking_reviews WHERE booking_id = ?");
        $stmt->execute([$bookingId]);
        if ($stmt->fetch()) {
            sendResponse(['error' => 'Feedback has already been submitted for this appointment.'], 409);
        }

        // 4. Insert Review
        $reviewId = Auth::generateUuid();
        $stmt = $db->prepare("INSERT INTO booking_reviews (id, booking_id, user_id, salon_id, rating, comment) VALUES (?, ?, ?, ?, ?, ?)");
        $success = $stmt->execute([$reviewId, $bookingId, $userData['user_id'], $booking['salon_id'], $rating, $comment]);

        if (!$success) {
            $err = $stmt->errorInfo();
            throw new Exception("Database insertion failed: " . ($err[2] ?? 'Unknown registry error'));
        }

        sendResponse(['success' => true, 'message' => 'Thank you! Your feedback has been published.']);

    } catch (Exception $e) {
        sendResponse(['error' => 'Transmission Error: ' . $e->getMessage()], 500);
    }
}

// PUT /api/bookings/:id/review - Update review
if ($method === 'PUT' && count($uriParts) === 3 && $uriParts[2] === 'review') {
    try {
        $userData = Auth::getUserFromToken();
        if (!$userData)
            sendResponse(['error' => 'Unauthorized - No valid session found.'], 401);

        $bookingId = $uriParts[1];
        $data = getRequestBody();

        if (!$data)
            sendResponse(['error' => 'Empty or invalid request payload.'], 400);

        $rating = intval($data['rating'] ?? 5);
        $comment = $data['comment'] ?? '';

        // 1. Verify booking ownership
        $stmt = $db->prepare("SELECT * FROM bookings WHERE id = ? AND user_id = ?");
        $stmt->execute([$bookingId, $userData['user_id']]);
        $booking = $stmt->fetch();

        if (!$booking)
            sendResponse(['error' => 'Booking not found or you do not have permission to review it.'], 404);

        // 2. Check for existing review
        $stmt = $db->prepare("SELECT id FROM booking_reviews WHERE booking_id = ?");
        $stmt->execute([$bookingId]);
        $existingReview = $stmt->fetch();

        if (!$existingReview) {
            sendResponse(['error' => 'Review not found to update.'], 404);
        }

        // 3. Update Review
        $stmt = $db->prepare("UPDATE booking_reviews SET rating = ?, comment = ? WHERE booking_id = ?");
        $success = $stmt->execute([$rating, $comment, $bookingId]);

        if (!$success) {
            throw new Exception("Database update failed");
        }

        sendResponse(['success' => true, 'message' => 'Review updated successfully.']);

    } catch (Exception $e) {
        sendResponse(['error' => 'Transmission Error: ' . $e->getMessage()], 500);
    }
}

sendResponse(['error' => 'Booking route not found'], 404);
