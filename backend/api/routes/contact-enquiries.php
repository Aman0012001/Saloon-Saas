<?php
// Contact Enquiries API Routes

// Create contact enquiry (Public endpoint - no auth required)
if ($method === 'POST' && $path === '/contact-enquiries') {
    $input = getRequestBody();

    $name = trim($input['name'] ?? '');
    $email = trim($input['email'] ?? '');
    $phone = trim($input['phone'] ?? '');
    $subject = trim($input['subject'] ?? '');
    $message = trim($input['message'] ?? '');

    if (empty($name) || empty($email) || empty($subject) || empty($message)) {
        sendResponse(['error' => 'Name, email, subject, and message are required'], 400);
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendResponse(['error' => 'Invalid email address'], 400);
    }

    try {
        $id = Auth::generateUuid();

        $stmt = $db->prepare("
            INSERT INTO contact_enquiries (id, name, email, phone, subject, message, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())
        ");

        $stmt->execute([
            $id,
            $name,
            $email,
            $phone ?: null,
            $subject,
            $message
        ]);

        // Send email notification to admin
        $to = "skinnoam@gmail.com";
        $mailSubject = "New Website Inquiry: " . $subject;
        $mailBody = "You have received a new inquiry from the website.\n\n" .
            "Name: " . $name . "\n" .
            "Email: " . $email . "\n" .
            "Phone: " . $phone . "\n" .
            "Subject: " . $subject . "\n" .
            "Message:\n" . $message . "\n\n" .
            "---\n" .
            "Sent via Noamskin Admin Portal";

        $headers = "From: webmaster@noamskin.com" . "\r\n" .
            "Reply-To: " . $email . "\r\n" .
            "X-Mailer: PHP/" . phpversion();

        @mail($to, $mailSubject, $mailBody, $headers);

        // Send in-app notifications to all active Super Admins
        try {
            $stmt = $db->query("SELECT user_id FROM platform_admins WHERE is_active = 1");
            $admins = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($admins as $admin) {
                if (isset($notifService)) {
                    $notifService->notifyUser(
                        $admin['user_id'],
                        "New Contact Message",
                        "New message from {$name}: \"{$subject}\"",
                        'info',
                        '/admin/contact-enquiries',
                        false // Do not send individual emails to every admin to avoid timeout
                    );
                }
            }
        } catch (Exception $e) {
            error_log("Notification Error: " . $e->getMessage());
        }

        sendResponse([
            'message' => 'Contact enquiry submitted successfully',
            'id' => $id
        ]);
    } catch (PDOException $e) {
        sendResponse(['error' => 'Failed to submit contact enquiry: ' . $e->getMessage()], 500);
    }
}
?>