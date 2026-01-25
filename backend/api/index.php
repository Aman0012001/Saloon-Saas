<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle CORS
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
if (in_array($origin, ALLOWED_ORIGINS)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
}

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Auth.php';

// Get request method and URI
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = str_replace('/backend/api/', '', $uri);
$uri = trim($uri, '/');
$uriParts = explode('/', $uri);

// Get database connection
$db = Database::getInstance()->getConnection();

// Helper function to send JSON response
function sendResponse($data, $statusCode = 200)
{
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

// Helper function to get request body
function getRequestBody()
{
    return json_decode(file_get_contents('php://input'), true);
}

// Route handling
try {
    // Authentication routes
    if ($uriParts[0] === 'auth') {
        require_once __DIR__ . '/routes/auth.php';
        exit();
    }

    // Salon routes
    if ($uriParts[0] === 'salons') {
        require_once __DIR__ . '/routes/salons.php';
        exit();
    }

    // Service routes
    if ($uriParts[0] === 'services') {
        require_once __DIR__ . '/routes/services.php';
        exit();
    }

    // Booking routes
    if ($uriParts[0] === 'bookings') {
        require_once __DIR__ . '/routes/bookings.php';
        exit();
    }

    // User/Profile routes
    if ($uriParts[0] === 'users' || $uriParts[0] === 'profiles') {
        require_once __DIR__ . '/routes/users.php';
        exit();
    }

    // Admin routes
    if ($uriParts[0] === 'admin') {
        require_once __DIR__ . '/routes/admin.php';
        exit();
    }

    // Subscription routes
    if ($uriParts[0] === 'subscriptions') {
        require_once __DIR__ . '/routes/subscriptions.php';
        exit();
    }

    // 404 Not Found
    sendResponse(['error' => 'Route not found'], 404);

} catch (Exception $e) {
    sendResponse(['error' => $e->getMessage()], 500);
}
