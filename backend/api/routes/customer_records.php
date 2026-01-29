<?php
// Customer Records routes

// GET /api/customer_records/:userId/salon/:salonId - Get custom profile
if ($method === 'GET' && count($uriParts) === 4 && $uriParts[2] === 'salon') {
    $userData = Auth::getUserFromToken();
    if (!$userData) {
        sendResponse(['error' => 'Unauthorized'], 401);
    }

    $userId = $uriParts[1];
    $salonId = $uriParts[3];

    // Check permission (user themselves or salon staff)
    $hasAccess = ($userData['user_id'] === $userId);
    if (!$hasAccess) {
        $stmt = $db->prepare("SELECT id FROM user_roles WHERE user_id = ? AND salon_id = ?");
        $stmt->execute([$userData['user_id'], $salonId]);
        $hasAccess = (bool) $stmt->fetch();
    }

    if (!$hasAccess) {
        sendResponse(['error' => 'Forbidden'], 403);
    }

    $stmt = $db->prepare("SELECT * FROM customer_salon_profiles WHERE user_id = ? AND salon_id = ?");
    $stmt->execute([$userId, $salonId]);
    $profile = $stmt->fetch();

    sendResponse(['profile' => $profile]);
}

// POST /api/customer_records - Create or update profile
if ($method === 'POST' && count($uriParts) === 1) {
    $userData = Auth::getUserFromToken();
    if (!$userData) {
        sendResponse(['error' => 'Unauthorized'], 401);
    }

    $data = getRequestBody();
    $userId = $data['user_id'] ?? null;
    $salonId = $data['salon_id'] ?? null;

    if (!$userId || !$salonId) {
        sendResponse(['error' => 'User ID and Salon ID are required'], 400);
    }

    // Check permission (only salon staff can update health records)
    $stmt = $db->prepare("SELECT id FROM user_roles WHERE user_id = ? AND salon_id = ?");
    $stmt->execute([$userData['user_id'], $salonId]);
    if (!$stmt->fetch()) {
        sendResponse(['error' => 'Forbidden'], 403);
    }

    $stmt = $db->prepare("
        INSERT INTO customer_salon_profiles (id, user_id, salon_id, date_of_birth, skin_type, skin_issues, allergy_records)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            date_of_birth = VALUES(date_of_birth),
            skin_type = VALUES(skin_type),
            skin_issues = VALUES(skin_issues),
            allergy_records = VALUES(allergy_records)
    ");

    $stmt->execute([
        Auth::generateUuid(),
        $userId,
        $salonId,
        $data['date_of_birth'] ?? null,
        $data['skin_type'] ?? null,
        $data['skin_issues'] ?? null,
        $data['allergy_records'] ?? null
    ]);

    sendResponse(['success' => true]);
}

// Routes for treatment records
// GET /api/customer_records/treatments/:bookingId - Get treatment record
if ($method === 'GET' && count($uriParts) === 3 && $uriParts[1] === 'treatments') {
    $bookingId = $uriParts[2];
    $stmt = $db->prepare("SELECT * FROM treatment_records WHERE booking_id = ?");
    $stmt->execute([$bookingId]);
    $record = $stmt->fetch();
    sendResponse(['record' => $record]);
}

// POST /api/customer_records/treatments - Create or update treatment record
if ($method === 'POST' && count($uriParts) === 2 && $uriParts[1] === 'treatments') {
    $userData = Auth::getUserFromToken();
    if (!$userData) {
        sendResponse(['error' => 'Unauthorized'], 401);
    }

    $data = getRequestBody();
    $bookingId = $data['booking_id'] ?? null;

    if (!$bookingId) {
        sendResponse(['error' => 'Booking ID is required'], 400);
    }

    // Fetch booking to get salon_id and user_id
    $stmt = $db->prepare("SELECT salon_id, user_id FROM bookings WHERE id = ?");
    $stmt->execute([$bookingId]);
    $booking = $stmt->fetch();

    if (!$booking) {
        sendResponse(['error' => 'Booking not found'], 404);
    }

    // Check permission
    $stmt = $db->prepare("SELECT id FROM user_roles WHERE user_id = ? AND salon_id = ?");
    $stmt->execute([$userData['user_id'], $booking['salon_id']]);
    if (!$stmt->fetch()) {
        sendResponse(['error' => 'Forbidden'], 403);
    }

    $stmt = $db->prepare("
        INSERT INTO treatment_records (
            id, booking_id, user_id, salon_id, treatment_details, products_used, 
            skin_reaction, improvement_notes, recommended_next_treatment, 
            post_treatment_instructions, follow_up_reminder_date, marketing_notes,
            before_photo_url, after_photo_url
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            treatment_details = VALUES(treatment_details),
            products_used = VALUES(products_used),
            skin_reaction = VALUES(skin_reaction),
            improvement_notes = VALUES(improvement_notes),
            recommended_next_treatment = VALUES(recommended_next_treatment),
            post_treatment_instructions = VALUES(post_treatment_instructions),
            follow_up_reminder_date = VALUES(follow_up_reminder_date),
            marketing_notes = VALUES(marketing_notes),
            before_photo_url = VALUES(before_photo_url),
            after_photo_url = VALUES(after_photo_url)
    ");

    $stmt->execute([
        Auth::generateUuid(),
        $bookingId,
        $booking['user_id'],
        $booking['salon_id'],
        $data['treatment_details'] ?? null,
        $data['products_used'] ?? null,
        $data['skin_reaction'] ?? null,
        $data['improvement_notes'] ?? null,
        $data['recommended_next_treatment'] ?? null,
        $data['post_treatment_instructions'] ?? null,
        $data['follow_up_reminder_date'] ?? null,
        $data['marketing_notes'] ?? null,
        $data['before_photo_url'] ?? null,
        $data['after_photo_url'] ?? null
    ]);

    sendResponse(['success' => true]);
}

// GET /api/customer_records/:userId/treatments - Get all treatments for a user
if ($method === 'GET' && count($uriParts) === 3 && $uriParts[2] === 'treatments') {
    $userId = $uriParts[1];
    $salonId = $_GET['salon_id'] ?? null;

    $query = "SELECT tr.*, s.name as service_name, b.booking_date 
              FROM treatment_records tr
              JOIN bookings b ON tr.booking_id = b.id
              JOIN services s ON b.service_id = s.id
              WHERE tr.user_id = ?";
    $params = [$userId];

    if ($salonId) {
        $query .= " AND tr.salon_id = ?";
        $params[] = $salonId;
    }

    $query .= " ORDER BY b.booking_date DESC";

    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $treatments = $stmt->fetchAll();

    sendResponse(['treatments' => $treatments]);
}

sendResponse(['error' => 'Customer records route not found'], 404);
