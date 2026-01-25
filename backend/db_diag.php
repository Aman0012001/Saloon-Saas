<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/config.php';

echo "<h3>Database Connection Debug</h3>";
echo "Attempting to connect to: " . DB_HOST . "<br>";
echo "Database name: " . DB_NAME . "<br>";
echo "User: " . DB_USER . "<br>";

try {
    $dsn = "mysql:host=" . DB_HOST . ";charset=" . DB_CHARSET;
    $pdo = new PDO($dsn, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "<p style='color: green;'>✅ Connected to MySQL server successfully!</p>";

    // Check if database exists
    $stmt = $pdo->query("SELECT COUNT(*) FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '" . DB_NAME . "'");
    if ($stmt->fetchColumn()) {
        echo "<p style='color: green;'>✅ Database '" . DB_NAME . "' exists!</p>";

        $pdo->exec("USE " . DB_NAME);

        // List tables
        $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
        echo "<b>Tables found:</b><ul>";
        foreach ($tables as $table) {
            echo "<li>$table</li>";
        }
        echo "</ul>";
    } else {
        echo "<p style='color: red;'>❌ Database '" . DB_NAME . "' does NOT exist!</p>";
        echo "Creating database '" . DB_NAME . "'...<br>";
        $pdo->exec("CREATE DATABASE IF NOT EXISTS " . DB_NAME);
        echo "<p style='color: green;'>✅ Database created successfully. Please run database.sql to import tables.</p>";
    }

} catch (PDOException $e) {
    echo "<p style='color: red;'>❌ Connection failed: " . $e->getMessage() . "</p>";
}
