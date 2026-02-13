<?php
require_once __DIR__ . '/Database.php';
try {
    $db = Database::getInstance()->getConnection();
    $stmt = $db->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo json_encode(['tables' => $tables]);
}
catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
