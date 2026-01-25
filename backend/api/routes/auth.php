<?php
// Authentication routes

if ($uriParts[1] === 'signup') {
    if ($method !== 'POST') {
        sendResponse(['error' => 'Method not allowed'], 405);
    }

    $data = getRequestBody();
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';
    $fullName = $data['full_name'] ?? '';
    $phone = $data['phone'] ?? '';
    $userType = $data['user_type'] ?? 'customer';

    // Salon specific fields
    $salonName = $data['salon_name'] ?? '';
    $salonSlug = $data['salon_slug'] ?? '';

    if (empty($email) || empty($password)) {
        sendResponse(['error' => 'Email and password are required'], 400);
    }

    // Check if user exists
    $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        sendResponse(['error' => 'User already exists'], 409);
    }

    // Create user
    $userId = Auth::generateUuid();
    $passwordHash = Auth::hashPassword($password);

    $db->beginTransaction();
    try {
        $stmt = $db->prepare("INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)");
        $stmt->execute([$userId, $email, $passwordHash]);

        // Create profile
        $profileId = Auth::generateUuid();
        $stmt = $db->prepare("INSERT INTO profiles (id, user_id, full_name, phone, user_type) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$profileId, $userId, $fullName, $phone, $userType]);

        // If salon owner, create salon and link
        if ($userType === 'salon_owner' && !empty($salonName)) {
            $salonId = Auth::generateUuid();
            if (empty($salonSlug)) {
                $salonSlug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $salonName)));
                $salonSlug .= '-' . substr(Auth::generateUuid(), 0, 4);
            }

            $stmt = $db->prepare("INSERT INTO salons (id, name, slug, email, phone, approval_status) VALUES (?, ?, ?, ?, ?, 'approved')");
            $stmt->execute([$salonId, $salonName, $salonSlug, $email, $phone]);

            // Link user to salon as owner
            $roleId = Auth::generateUuid();
            $stmt = $db->prepare("INSERT INTO user_roles (id, user_id, salon_id, role) VALUES (?, ?, ?, 'owner')");
            $stmt->execute([$roleId, $userId, $salonId]);
        }

        $db->commit();

        $token = Auth::generateToken($userId, $email);
        sendResponse([
            'user' => ['id' => $userId, 'email' => $email, 'full_name' => $fullName, 'user_type' => $userType],
            'token' => $token
        ], 201);
    } catch (Exception $e) {
        $db->rollBack();
        sendResponse(['error' => 'Failed to create user: ' . $e->getMessage()], 500);
    }
}

if ($uriParts[1] === 'login') {
    if ($method !== 'POST') {
        sendResponse(['error' => 'Method not allowed'], 405);
    }

    $data = getRequestBody();
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';

    if (empty($email) || empty($password)) {
        sendResponse(['error' => 'Email and password are required'], 400);
    }

    $stmt = $db->prepare("
        SELECT u.id, u.email, u.password_hash, p.full_name, p.user_type
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE u.email = ?
    ");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !Auth::verifyPassword($password, $user['password_hash'])) {
        sendResponse(['error' => 'Invalid credentials'], 401);
    }

    $token = Auth::generateToken($user['id'], $user['email']);
    sendResponse([
        'user' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'full_name' => $user['full_name'],
            'user_type' => $user['user_type']
        ],
        'token' => $token
    ]);
}

if ($uriParts[1] === 'me') {
    if ($method !== 'GET') {
        sendResponse(['error' => 'Method not allowed'], 405);
    }

    $userData = Auth::getUserFromToken();
    if (!$userData) {
        sendResponse(['error' => 'Unauthorized'], 401);
    }

    $stmt = $db->prepare("
        SELECT u.id, u.email, p.full_name, p.phone, p.avatar_url, p.user_type
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE u.id = ?
    ");
    $stmt->execute([$userData['user_id']]);
    $user = $stmt->fetch();

    if (!$user) {
        sendResponse(['error' => 'User not found'], 404);
    }

    sendResponse(['user' => $user]);
}

if ($uriParts[1] === 'logout') {
    sendResponse(['message' => 'Logged out successfully']);
}

sendResponse(['error' => 'Auth route not found'], 404);
