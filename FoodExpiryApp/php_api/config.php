<?php
// Database configuration
$host = 'localhost';
$db_name = 'foodexpiry';
$username = 'root';
$password = ''; // Default XAMPP password is empty

// Create connection
function getConnection() {
    global $host, $db_name, $username, $password;
    
    try {
        $conn = new PDO("mysql:host=$host;dbname=$db_name", $username, $password);
        // Set the PDO error mode to exception
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $conn;
    } catch(PDOException $e) {
        return null;
    }
}

// Helper function to send JSON response
function sendResponse($status, $message, $data = null) {
    header('Content-Type: application/json');
    $response = [
        'status' => $status,
        'message' => $message
    ];
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    echo json_encode($response);
    exit;
}

// Generate API key for the app to use
function generateApiKey() {
    return bin2hex(random_bytes(32));
}

// Verify API key (implement this based on your security needs)
function verifyApiKey($api_key) {
    // For development, you can hardcode a key or store it in the database
    $valid_key = "YOUR_API_KEY"; // Replace with your actual key or validation logic
    return $api_key === $valid_key;
}

// Check if the request has a valid API key
function validateApiKey() {
    $headers = getallheaders();
    $api_key = isset($headers['X-API-Key']) ? $headers['X-API-Key'] : '';
    
    if (!verifyApiKey($api_key)) {
        sendResponse(false, 'Invalid API key');
    }
}

// Enable CORS for development
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-API-Key");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}
?>
