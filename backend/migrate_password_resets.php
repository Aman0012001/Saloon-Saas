<?php
require_once __DIR__ . '/config.php';

echo "Creating password_resets table...\n";

try {
    $sql = file_get_contents(__DIR__ . '/add_password_resets_table.sql');
    $pdo->exec($sql);
    echo "✓ Password resets table created successfully!\n";
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
}
