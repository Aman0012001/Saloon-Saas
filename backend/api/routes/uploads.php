<?php
/**
 * 🚀 FILE UPLOAD ROUTER
 */

// POST /api/uploads - Upload a file
if ($method === 'POST') {
    $userData = Auth::getUserFromToken();
    if (!$userData) {
        sendResponse(['error' => 'Unauthorized'], 401);
    }

    if (!isset($_FILES['file'])) {
        sendResponse(['error' => 'No file uploaded'], 400);
    }

    $file = $_FILES['file'];
    $allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    if (!in_array($file['type'], $allowedTypes)) {
        sendResponse(['error' => 'Invalid file type. Only JPEG, PNG, WEBP and GIF are allowed.'], 400);
    }

    // Limit size to 5MB
    if ($file['size'] > 5 * 1024 * 1024) {
        sendResponse(['error' => 'File too large. Maximum size is 5MB.'], 400);
    }

    $uploadDir = __DIR__ . '/../../uploads/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $fileName = Auth::generateUuid() . '.' . $extension;
    $targetPath = $uploadDir . $fileName;

    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        global $googleDriveService;
        $driveUrl = null;
        $driveId = null;

        // Try to upload to Google Drive if configured
        if (!empty(GOOGLE_CLIENT_ID) && !empty(GOOGLE_REFRESH_TOKEN)) {
            $result = $googleDriveService->uploadFile($targetPath, $fileName, $file['type']);
            if (isset($result['success']) && $result['success']) {
                $driveUrl = $result['url'];
                $driveId = $result['id'];

                // Optionally remove local file after successful drive upload
                // unlink($targetPath); 
            }
        }

        // Construct public URL (Local fallback)
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'];
        $localUrl = $protocol . '://' . $host . '/backend/uploads/' . $fileName;

        sendResponse([
            'message' => 'File uploaded successfully',
            'url' => $driveUrl ?: $localUrl, // Prefer drive URL if available
            'localUrl' => $localUrl,
            'driveUrl' => $driveUrl,
            'driveId' => $driveId,
            'fileName' => $fileName
        ], 201);
    } else {
        sendResponse(['error' => 'Failed to save file on server'], 500);
    }
}

sendResponse(['error' => 'Upload route only supports POST'], 405);
