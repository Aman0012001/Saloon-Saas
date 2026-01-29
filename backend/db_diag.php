<?php
header('Content-Type: text/plain');
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "--- Database Connection Diagnostics ---\n\n";

try {
    require_once __DIR__ . '/config.php';
    echo "Config loaded.\n";
    echo "Host: " . DB_HOST . "\n";
    echo "Port: " . DB_PORT . "\n";
    echo "Database: " . DB_NAME . "\n";
    echo "User: " . DB_USER . "\n";
    echo "Password correctly set: " . (defined('DB_PASS') ? 'Yes' : 'No') . "\n\n";

    echo "Attempting to connect via PDO...\n";
    $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    $pdo = new PDO($dsn, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "SUCCESS: Connected to database '" . DB_NAME . "'.\n\n";

    echo "Checking if 'salons' table exists...\n";
    try {
        $stmt = $pdo->query("SELECT 1 FROM salons LIMIT 1");
        echo "SUCCESS: 'salons' table exists.\n";

        $stmt = $pdo->query("SELECT COUNT(*) FROM salons");
        $count = $stmt->fetchColumn();
        echo "Total salons in database: " . $count . "\n";
    } catch (PDOException $e) {
        echo "ERROR: 'salons' table does not exist or cannot be read.\n";
        echo "Message: " . $e->getMessage() . "\n";
    }

} catch (PDOException $e) {
    echo "ERROR: Connection failed!\n";
    echo "Message: " . $e->getMessage() . "\n";
    echo "\nTIP: Check if MySQL is running in XAMPP/WAMP and that the database name '" . DB_NAME . "' exists.\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
