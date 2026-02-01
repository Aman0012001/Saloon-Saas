<?php
// Database configuration
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'salon_booking');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// JWT Secret Key
define('JWT_SECRET', 'your-secret-key-change-this-in-production');
define('JWT_EXPIRY', 86400); // 24 hours

// CORS Settings - Added 127.0.0.1 and common ports for safety
define('ALLOWED_ORIGINS', [
    'http://localhost:8081',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
]);

// File Upload Settings (Disabled - Moving to Cloudinary)
// define('UPLOAD_DIR', dirname(__DIR__) . '/uploads/');
// define('MAX_FILE_SIZE', 5242880); // 5MB

// Timezone
date_default_timezone_set('Asia/Kolkata');

// Error Reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 0); // Important: stop HTML output breaking JSON
ini_set('log_errors', 1);
ini_set('error_log', dirname(__DIR__) . '/logs/php_error.log');
// Google Drive Configuration
define('GOOGLE_CLIENT_ID', '');
define('GOOGLE_CLIENT_SECRET', '');
define('GOOGLE_REFRESH_TOKEN', '');
define('GOOGLE_DRIVE_FOLDER_ID', ''); // Optional: ID of the folder to upload to

// Cloudinary Configuration
define('CLOUDINARY_CLOUD_NAME', getenv('CLOUDINARY_CLOUD_NAME') ?: 'de28lezdr');
define('CLOUDINARY_API_KEY', getenv('CLOUDINARY_API_KEY') ?: '434569833245894');
define('CLOUDINARY_API_SECRET', getenv('CLOUDINARY_API_SECRET') ?: 'TT-YIiotMjZAb2M4iwJJlkPu3Hw');

// SMTP Configuration (Gmail)
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587); // Use 465 for SSL, 587 for TLS
define('SMTP_USER', 'amanajeetthakur644@gmail.com'); // Your Gmail address
define('SMTP_PASS', 'xxxx xxxx xxxx xxxx'); // Your Gmail App Password (NOT your login password)
define('SMTP_FROM_EMAIL', 'amanajeetthakur644@gmail.com');
define('SMTP_FROM_NAME', 'Salon Style Support');

/**
 * 🛠️ SIMPLE .ENV LOADER
 * Loads variables from .env file into environment
 */
if (file_exists(dirname(__DIR__) . '/.env')) {
    $lines = file(dirname(__DIR__) . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0)
            continue;
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);
        if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
            putenv(sprintf('%s=%s', $name, $value));
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
}
