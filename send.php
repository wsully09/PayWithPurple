<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $phone = $_POST['phone'] ?? '';
    $message = $_POST['message'] ?? '';
    $key = $_POST['key'] ?? 'textbelt';
    
    if (empty($phone) || empty($message)) {
        echo json_encode(['success' => false, 'error' => 'Missing phone or message']);
        exit;
    }
    
    // Make the request to Textbelt API
    $url = 'https://textbelt.com/text';
    $data = [
        'phone' => $phone,
        'message' => $message,
        'key' => $key
    ];
    
    $options = [
        'http' => [
            'header' => "Content-type: application/x-www-form-urlencoded\r\n",
            'method' => 'POST',
            'content' => http_build_query($data)
        ]
    ];
    
    $context = stream_context_create($options);
    $result = file_get_contents($url, false, $context);
    
    if ($result === FALSE) {
        echo json_encode(['success' => false, 'error' => 'Failed to send SMS']);
    } else {
        echo $result;
    }
} else {
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
?>
