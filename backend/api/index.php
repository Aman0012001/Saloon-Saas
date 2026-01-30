<?php
/**
 * 🚀 SALON BOOKING API - MAIN ENTRY POINT
 */

// 1. ==========================================
// 🚀 CORS (PERMISSIVE FOR DEVELOPMENT)
// ==========================================

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Allow any localhost or 127.0.0.1 origin for local development
if (!empty($origin) && (strpos($origin, 'localhost') !== false || strpos($origin, '127.0.0.1') !== false)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma');
} else if (empty($origin)) {
    header("Access-Control-Allow-Origin: *");
}

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: " . ($origin ?: '*'));
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma');
    header('Access-Control-Max-Age: 86400');
    // Preflight responses should use 204 or 200
    http_response_code(204);
    exit();
}

// 2. ==========================================
// 📦 HEADERS & UTILS
// ==========================================

ob_start(); // Prevent accidental output
ini_set('display_errors', 1);
error_reporting(E_ALL);

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

    require_once __DIR__ . '/../Services/NotificationService.php';
    require_once __DIR__ . '/../Services/InvoiceService.php';
    require_once __DIR__ . '/../Services/RBACService.php';
    require_once __DIR__ . '/../Services/NewsletterService.php';
    require_once __DIR__ . '/../Services/MembershipService.php';
    require_once __DIR__ . '/../Services/GoogleDriveService.php';


    $notifService = new NotificationService($db);
    $invoiceService = new InvoiceService($db, $notifService);
    $rbacService = new RBACService($db);
    $newsletterService = new NewsletterService($db);
    $membershipService = new MembershipService($db);
    $googleDriveService = new GoogleDriveService();


    /**
     * Role-Based Access Control Helper
     */
    if (!function_exists('protectRoute')) {
        function protectRoute($allowedRoles = [], $requiredPermission = null, $explicitSalonId = null)
        {
            global $rbacService;
            $userData = Auth::getUserFromToken();
            if (!$userData) {
                sendResponse(['error' => 'Authentication required in local registry.'], 401);
            }

            // Map profile user_types to salon roles for legacy tokens/backward compatibility
            $effectiveRole = $userData['role'];

            // BYPASS: Check if user is actually a super admin in DB, regardless of token
            try {
                $db = Database::getInstance()->getConnection();
                $stmt = $db->prepare("SELECT 1 FROM platform_admins WHERE user_id = ? AND is_active = 1");
                $stmt->execute([$userData['user_id']]);
                if ($stmt->fetchColumn()) {
                    $effectiveRole = 'admin';
                }
            } catch (Exception $e) {
                // Ignore DB errors here, fall back to token role
            }

            if ($effectiveRole === 'salon_owner')
                $effectiveRole = 'owner';
            if ($effectiveRole === 'salon_staff')
                $effectiveRole = 'staff';
            if ($effectiveRole === 'admin')
                $effectiveRole = 'super_admin';

            // If specific roles are required
            if (!empty($allowedRoles)) {
                $isAllowed = in_array($effectiveRole, (array) $allowedRoles);

                // Also allow super_admin to everything
                if ($effectiveRole === 'super_admin')
                    $isAllowed = true;

                if (!$isAllowed) {
                    sendResponse(['error' => "Forbidden - Insufficient clearance level (Role: $effectiveRole)."], 403);
                }
            }

            // If a specific permission is required
            if ($requiredPermission) {
                $salonId = $explicitSalonId ?: ($_GET['salon_id'] ?? $_POST['salon_id'] ?? null);

                // If not in GET/POST, check request body
                if (!$salonId) {
                    $body = json_decode(file_get_contents('php://input'), true);
                    $salonId = $body['salon_id'] ?? null;
                }

                if ($salonId) {
                    if (!$rbacService->hasPermission($userData['user_id'], $salonId, $requiredPermission)) {
                        // Special case: owners should have all permissions if they are verified owners of the salon
                        $db = Database::getInstance()->getConnection();
                        $stmt = $db->prepare("SELECT role FROM user_roles WHERE user_id = ? AND salon_id = ?");
                        $stmt->execute([$userData['user_id'], $salonId]);
                        $actualRole = $stmt->fetchColumn();

                        if ($actualRole !== 'owner' && $actualRole !== 'super_admin') {
                            sendResponse(['error' => "Forbidden - Missing required permission: $requiredPermission"], 403);
                        }
                    }
                } else {
                    // If permission is required but no salon_id found, we might want to fail safe
                    // unless it's a global permission (not implemented yet).
                    // For now, let's just log it or allow it if it's super_admin.
                    if ($userData['role'] !== 'super_admin') {
                        // sendResponse(['error' => 'Forbidden - Salon context missing for permission check'], 403);
                    }
                }
            }

            return $userData;
        }
    }

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

    error_log("[API Request] Method: $method, Path: $path");
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
        case 'customer_records':
            require_once __DIR__ . '/routes/customer_records.php';
            break;
        case 'platform_products':
            require_once __DIR__ . '/routes/platform_products.php';
            break;
        case 'inventory':
            require_once __DIR__ . '/routes/inventory.php';
            break;
        case 'offers':
            require_once __DIR__ . '/routes/offers.php';
            break;
        case 'contact-enquiries':
            require_once __DIR__ . '/routes/contact-enquiries.php';
            break;
        case 'messages':
            require_once __DIR__ . '/routes/messages.php';
            break;
        case 'knowledge-base':
            require_once __DIR__ . '/routes/knowledge_base.php';
            break;
        case 'product_purchases':
            require_once __DIR__ . '/routes/product_purchases.php';
            break;
        case 'newsletter':
            require_once __DIR__ . '/routes/newsletter.php';
            break;
        case 'reminders':
            require_once __DIR__ . '/routes/reminders.php';
            break;
        case 'loyalty':
            require_once __DIR__ . '/routes/loyalty.php';
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
