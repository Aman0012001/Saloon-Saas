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
    $userId = bin2hex(random_bytes(16));
    $passwordHash = Auth::hashPassword($password);

    $db->beginTransaction();
    try {
        $stmt = $db->prepare("INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)");
        $stmt->execute([$userId, $email, $passwordHash]);

        // Create profile
        $stmt = $db->prepare("INSERT INTO profiles (user_id, full_name) VALUES (?, ?)");
        $stmt->execute([$userId, $fullName]);

        $db->commit();

        $token = Auth::generateToken($userId, $email);
        sendResponse([
            'user' => ['id' => $userId, 'email' => $email],
            'token' => $token
        ], 201);
    } catch (Exception $e) {
        $db->rollBack();
        sendResponse(['error' => 'Failed to create user'], 500);
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

    $stmt = $db->prepare("SELECT id, email, password_hash FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !Auth::verifyPassword($password, $user['password_hash'])) {
        sendResponse(['error' => 'Invalid credentials'], 401);
    }

    $token = Auth::generateToken($user['id'], $user['email']);
    sendResponse([
        'user' => ['id' => $user['id'], 'email' => $user['email']],
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
