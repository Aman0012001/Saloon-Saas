<?php
/**
 * PHP Built-in Server Router Script
 */

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$file = __DIR__ . $uri;

// If the request is for a physical file or directory, serve it as is
if ($uri !== '/' && (file_exists($file) || is_dir($file))) {
    return false;
}

// Otherwise, route everything to the API index.php if it starts with /backend/api
if (strpos($uri, '/backend/api') === 0) {
    $_SERVER['SCRIPT_NAME'] = '/backend/api/index.php';
    require_once __DIR__ . '/backend/api/index.php';
    return;
}

// Fallback for other routes (if any)
return false;
