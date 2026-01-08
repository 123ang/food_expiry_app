<?php
// Database configuration
$host = 'localhost';
$db_name = 'foodexpiry';
$username = 'root';
$password = ''; // Default XAMPP password is empty

// Headers for API responses
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Create database connection
try {
    $conn = new PDO("mysql:host=$host;dbname=$db_name", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Database connection error: " . $e->getMessage()));
    exit;
}

// Helper function to generate API response
function response($status, $message, $data = null) {
    http_response_code($status);
    echo json_encode(array(
        "status" => $status,
        "message" => $message,
        "data" => $data
    ));
    exit;
}

// Helper function to get JSON data from request
function getRequestData() {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data) {
        response(400, "Invalid JSON data");
    }
    return $data;
}

// Helper function to validate required fields
function validateRequired($data, $requiredFields) {
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            response(400, "Missing required field: $field");
        }
    }
}

// Helper function to authenticate user
function authenticateUser() {
    global $conn;
    
    // Get authorization header
    $headers = getallheaders();
    $auth = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    
    // Check if token exists
    if (empty($auth)) {
        response(401, "Authorization token required");
    }
    
    // Extract token
    $token = str_replace('Bearer ', '', $auth);
    
    // Validate token (simple implementation - you might want to use JWT)
    $stmt = $conn->prepare("SELECT * FROM users WHERE supabase_id = ?");
    $stmt->execute([$token]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        response(401, "Invalid token");
    }
    
    return $user;
}
