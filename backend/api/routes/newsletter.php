<?php
/**
 * Newsletter Routes
 */

if ($method === 'POST' && count($uriParts) === 1) {
    $data = getRequestBody();
    $email = $data['email'] ?? null;

    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendResponse(['error' => 'Valid email is required'], 400);
    }

    try {
        $stmt = $db->prepare("INSERT INTO newsletter_subscribers (email) VALUES (?)");
        $stmt->execute([$email]);
        sendResponse(['message' => 'Successfully subscribed to newsletter!']);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) { // Duplicate entry
            sendResponse(['message' => 'You are already subscribed!']);
        }
        sendResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}
