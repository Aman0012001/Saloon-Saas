<?php
// Database configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'salon_booking');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// JWT Secret Key
define('JWT_SECRET', 'your-secret-key-change-this-in-production');
define('JWT_EXPIRY', 86400); // 24 hours

// CORS Settings
define('ALLOWED_ORIGINS', ['http://localhost:8081', 'http://localhost:3000']);

// File Upload Settings
define('UPLOAD_DIR', __DIR__ . '/uploads/');
define('MAX_FILE_SIZE', 5242880); // 5MB

// Timezone
date_default_timezone_set('Asia/Kolkata');

// Error Reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);
