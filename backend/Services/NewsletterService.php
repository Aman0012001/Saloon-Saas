<?php
/**
 * Newsletter Service - Handles subscriber notifications
 */

class NewsletterService
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    /**
     * Notify all subscribers about a new entity (Salon or Service)
     */
    public function notifySubscribers($type, $name, $details = "")
    {
        try {
            // Get all subscribers
            $stmt = $this->db->query("SELECT email FROM newsletter_subscribers");
            $subscribers = $stmt->fetchAll(PDO::FETCH_COLUMN);

            if (empty($subscribers)) {
                return false;
            }

            $subject = ($type === 'salon') ? "New Salon on Noamskin: $name" : "New Service Available: $name";
            $message = ($type === 'salon')
                ? "A new premium salon '$name' has joined our network. Explore their services now!"
                : "A new beauty service '$name' is now available. Book your appointment today!";

            if ($details) {
                $message .= "\n\nDetails: $details";
            }

            // In a real application, you would use mail() or a library like PHPMailer here.
            // For this local simulation, we'll log the "sent" emails to a file.
            $logFile = __DIR__ . '/../../logs/newsletter_emails.log';
            if (!is_dir(dirname($logFile))) {
                mkdir(dirname($logFile), 0777, true);
            }

            $logEntry = "[" . date('Y-m-d H:i:s') . "] 📧 TO: " . implode(', ', $subscribers) . "\n";
            $logEntry .= "SUBJECT: $subject\n";
            $logEntry .= "BODY: $message\n";
            $logEntry .= "--------------------------------------------------\n";

            file_put_contents($logFile, $logEntry, FILE_APPEND);

            error_log("[NewsletterService] Notification logged for $type: $name to " . count($subscribers) . " users.");
            return true;
        } catch (Exception $e) {
            error_log("[NewsletterService] Error: " . $e->getMessage());
            return false;
        }
    }
}
