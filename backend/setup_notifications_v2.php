<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/Database.php';

try {
    $db = Database::getInstance()->getConnection();

    $sql = "
    CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        type ENUM('info', 'success', 'warning', 'error', 'billing') DEFAULT 'info',
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        link VARCHAR(255),
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_is_read (is_read),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";

    $db->exec($sql);
    echo "Notifications table created successfully.";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
