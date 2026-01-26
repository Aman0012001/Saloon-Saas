<?php
/**
 * 🚀 SALON BOOKING API - MAIN ENTRY POINT
 */

// 1. ==========================================
// 🚀 CORS (PERMISSIVE FOR DEVELOPMENT)
// ==========================================

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (!empty($origin)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
} else {
    header("Access-Control-Allow-Origin: *");
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
    header('Access-Control-Max-Age: 86400');
    http_response_code(204);
    exit();
}

// 2. ==========================================
// 📦 HEADERS & UTILS
// ==========================================

ob_start(); // Prevent accidental output
error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Content-Type: application/json; charset=UTF-8');
header('X-Backend-Server: Salon-PHP-API');

function sendResponse($data, $statusCode = 200)
{
    ob_end_clean(); // Clear any accidental output before sending JSON
    http_response_code($statusCode);
    echo json_encode(['data' => $data]);
    exit();
}

function getRequestBody()
{
    return json_decode(file_get_contents('php://input'), true);
}

// 3. ==========================================
// ⚙️ INITIALIZATION
// ==========================================

try {
    require_once __DIR__ . '/../config.php';
    require_once __DIR__ . '/../Database.php';
    require_once __DIR__ . '/../Auth.php';

    // Get database connection
    $db = Database::getInstance()->getConnection();

    // 4. ==========================================
    // 🛣️ ROUTING
    // ==========================================

    $uri = $_SERVER['REQUEST_URI'] ?? '/';
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    // Parse URI path
    $basePath = '/backend/api';
    $path = parse_url($uri, PHP_URL_PATH);
    $path = str_replace($basePath, '', $path);
    $uriParts = explode('/', trim($path, '/'));

    if (empty($uriParts[0]) || $uriParts[0] === '') {
        sendResponse([
            'status' => 'online',
            'message' => 'Salon API is active'
        ]);
    }

    // DEBUG ROUTE: Promote current user to admin
    if (in_array('debug', $uriParts) && in_array('promote-me', $uriParts)) {
        $userData = Auth::getUserFromToken();
        if (!$userData) {
            sendResponse(['error' => 'Not logged in - Please login as a user first'], 401);
        }
        $userId = $userData['user_id'];

        $db->exec("CREATE TABLE IF NOT EXISTS platform_admins (
            id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36) NOT NULL,
            is_active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id)
        )");

        $db->prepare("INSERT IGNORE INTO platform_admins (id, user_id, is_active) VALUES (?, ?, 1)")
            ->execute([Auth::generateUuid(), $userId]);

        $db->prepare("UPDATE profiles SET user_type = 'admin' WHERE user_id = ?")
            ->execute([$userId]);

        sendResponse(['success' => true, 'message' => 'You have been promoted to super admin', 'user_id' => $userId]);
    }

    // DEBUG ROUTE: Promote first user to admin
    if (in_array('debug', $uriParts) && in_array('promote-first-user', $uriParts)) {
        $db->exec("CREATE TABLE IF NOT EXISTS platform_admins (
            id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36) NOT NULL,
            is_active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id)
        )");
        $stmt = $db->query("SELECT id FROM users LIMIT 1");
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($user) {
            $db->prepare("INSERT IGNORE INTO platform_admins (id, user_id, is_active) VALUES (?, ?, 1)")
                ->execute([Auth::generateUuid(), $user['id']]);
            // Also update profile type
            $db->prepare("UPDATE profiles SET user_type = 'admin' WHERE user_id = ?")
                ->execute([$user['id']]);
            sendResponse(['success' => true, 'message' => 'First user promoted to admin and user_type updated', 'user_id' => $user['id']]);
        }
        sendResponse(['error' => 'No users found'], 404);
    }

    // Load sub-routers
    switch ($uriParts[0]) {
        case 'auth':
            require_once __DIR__ . '/routes/auth.php';
            break;
        case 'salons':
            require_once __DIR__ . '/routes/salons.php';
            break;
        case 'services':
            require_once __DIR__ . '/routes/services.php';
            break;
        case 'bookings':
            require_once __DIR__ . '/routes/bookings.php';
            break;
        case 'users':
        case 'profiles':
            require_once __DIR__ . '/routes/users.php';
            break;
        case 'staff':
            require_once __DIR__ . '/routes/staff.php';
            break;
        case 'admin':
            require_once __DIR__ . '/routes/admin.php';
            break;
        case 'subscriptions':
            require_once __DIR__ . '/routes/subscriptions.php';
            break;
        case 'notifications':
            require_once __DIR__ . '/routes/notifications.php';
            break;
        case 'uploads':
            require_once __DIR__ . '/routes/uploads.php';
            break;
        case 'reviews':
            require_once __DIR__ . '/routes/reviews.php';
            break;
        default:
            sendResponse([
                'error' => 'Route not found',
                'uri' => $uri,
                'path' => $path,
                'uriParts' => $uriParts
            ], 404);
            break;
    }

} catch (Exception $e) {
    sendResponse(['error' => 'System error: ' . $e->getMessage()], 500);
}
