<?php
// Subscription routes

// GET /api/subscriptions/plans - Get all subscription plans
if ($method === 'GET' && $uriParts[1] === 'plans') {
    $stmt = $db->prepare("
        SELECT * FROM subscription_plans
        WHERE is_active = 1
        ORDER BY sort_order, price_monthly
    ");
    $stmt->execute();
    $plans = $stmt->fetchAll();

    sendResponse(['plans' => $plans]);
}

// GET /api/subscriptions/my - Get user's salon subscriptions
if ($method === 'GET' && $uriParts[1] === 'my') {
    $userData = Auth::getUserFromToken();
    if (!$userData) {
        sendResponse(['error' => 'Unauthorized'], 401);
    }

    $salonId = $_GET['salon_id'] ?? null;
    if (!$salonId) {
        sendResponse(['error' => 'salon_id is required'], 400);
    }

    // Check if user has access to salon
    $stmt = $db->prepare("SELECT id FROM user_roles WHERE user_id = ? AND salon_id = ? AND role = 'owner'");
    $stmt->execute([$userData['user_id'], $salonId]);
    if (!$stmt->fetch()) {
        sendResponse(['error' => 'Forbidden'], 403);
    }

    $stmt = $db->prepare("
        SELECT ss.*, sp.name as plan_name, sp.description as plan_description
        FROM salon_subscriptions ss
        INNER JOIN subscription_plans sp ON ss.plan_id = sp.id
        WHERE ss.salon_id = ?
        ORDER BY ss.created_at DESC
    ");
    $stmt->execute([$salonId]);
    $subscriptions = $stmt->fetchAll();

    sendResponse(['subscriptions' => $subscriptions]);
}

sendResponse(['error' => 'Subscription route not found'], 404);
