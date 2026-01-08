<?php
require_once 'config.php';

// Handle different request methods
$method = $_SERVER['REQUEST_METHOD'];

// Get request data
$data = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'GET':
        // Get user by ID or email
        if (isset($_GET['id'])) {
            getUser($_GET['id']);
        } else if (isset($_GET['email'])) {
            getUserByEmail($_GET['email']);
        } else {
            sendResponse(false, 'Missing parameters');
        }
        break;
        
    case 'POST':
        // Create or authenticate user
        if (isset($_GET['action']) && $_GET['action'] === 'login') {
            login($data);
        } else {
            createUser($data);
        }
        break;
        
    case 'PUT':
        // Update user
        if (isset($_GET['id'])) {
            updateUser($_GET['id'], $data);
        } else {
            sendResponse(false, 'Missing ID parameter');
        }
        break;
        
    default:
        sendResponse(false, 'Method not allowed');
}

// Get user by ID
function getUser($id) {
    $conn = getConnection();
    
    try {
        $stmt = $conn->prepare("SELECT id, email, full_name, is_active, subscription_type, subscription_expires_at, created_at, updated_at, last_login FROM users WHERE id = :id OR supabase_id = :supabase_id");
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':supabase_id', $id);
        $stmt->execute();
        
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            sendResponse(true, 'User found', $user);
        } else {
            sendResponse(false, 'User not found');
        }
    } catch(PDOException $e) {
        sendResponse(false, 'Database error: ' . $e->getMessage());
    }
}

// Get user by email
function getUserByEmail($email) {
    $conn = getConnection();
    
    try {
        $stmt = $conn->prepare("SELECT id, email, full_name, is_active, subscription_type, subscription_expires_at, created_at, updated_at, last_login FROM users WHERE email = :email");
        $stmt->bindParam(':email', $email);
        $stmt->execute();
        
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            sendResponse(true, 'User found', $user);
        } else {
            sendResponse(false, 'User not found');
        }
    } catch(PDOException $e) {
        sendResponse(false, 'Database error: ' . $e->getMessage());
    }
}

// Create new user
function createUser($data) {
    if (!isset($data['email']) || !isset($data['full_name']) || !isset($data['password'])) {
        sendResponse(false, 'Missing required fields');
    }
    
    $conn = getConnection();
    
    try {
        // Check if user already exists
        $stmt = $conn->prepare("SELECT id FROM users WHERE email = :email");
        $stmt->bindParam(':email', $data['email']);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            sendResponse(false, 'User already exists');
            return;
        }
        
        // Hash password
        $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
        
        // Generate a unique ID that can be used as supabase_id for compatibility
        $supabase_id = uniqid('', true);
        
        // Insert new user
        $stmt = $conn->prepare("INSERT INTO users (supabase_id, email, full_name, password, is_active) VALUES (:supabase_id, :email, :full_name, :password, 1)");
        $stmt->bindParam(':supabase_id', $supabase_id);
        $stmt->bindParam(':email', $data['email']);
        $stmt->bindParam(':full_name', $data['full_name']);
        $stmt->bindParam(':password', $hashedPassword);
        $stmt->execute();
        
        $userId = $conn->lastInsertId();
        
        // Create a personal group for the new user
        $stmt = $conn->prepare("INSERT INTO groups (name, description, created_by) VALUES ('Personal', 'Your personal food management group', :user_id)");
        $stmt->bindParam(':user_id', $supabase_id);
        $stmt->execute();
        
        $groupId = $conn->lastInsertId();
        
        // Add user to the group as owner
        $stmt = $conn->prepare("INSERT INTO group_memberships (group_id, user_id, role) VALUES (:group_id, :user_id, 'owner')");
        $stmt->bindParam(':group_id', $groupId);
        $stmt->bindParam(':user_id', $supabase_id);
        $stmt->execute();
        
        sendResponse(true, 'User created successfully', [
            'id' => $userId,
            'supabase_id' => $supabase_id,
            'email' => $data['email'],
            'full_name' => $data['full_name']
        ]);
    } catch(PDOException $e) {
        sendResponse(false, 'Database error: ' . $e->getMessage());
    }
}

// Login user
function login($data) {
    if (!isset($data['email']) || !isset($data['password'])) {
        sendResponse(false, 'Missing email or password');
    }
    
    $conn = getConnection();
    
    try {
        $stmt = $conn->prepare("SELECT id, supabase_id, email, full_name, password, is_active, subscription_type FROM users WHERE email = :email");
        $stmt->bindParam(':email', $data['email']);
        $stmt->execute();
        
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user && password_verify($data['password'], $user['password'])) {
            // Update last login
            $stmt = $conn->prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = :id");
            $stmt->bindParam(':id', $user['id']);
            $stmt->execute();
            
            // Remove password from response
            unset($user['password']);
            
            sendResponse(true, 'Login successful', $user);
        } else {
            sendResponse(false, 'Invalid email or password');
        }
    } catch(PDOException $e) {
        sendResponse(false, 'Database error: ' . $e->getMessage());
    }
}

// Update user
function updateUser($id, $data) {
    $conn = getConnection();
    
    try {
        $fields = [];
        $params = [':id' => $id];
        
        // Build dynamic update query based on provided fields
        foreach ($data as $key => $value) {
            if ($key !== 'id' && $key !== 'password') {
                $fields[] = "$key = :$key";
                $params[":$key"] = $value;
            }
        }
        
        // Handle password separately if provided
        if (isset($data['password'])) {
            $fields[] = "password = :password";
            $params[':password'] = password_hash($data['password'], PASSWORD_DEFAULT);
        }
        
        if (empty($fields)) {
            sendResponse(false, 'No fields to update');
            return;
        }
        
        $query = "UPDATE users SET " . implode(', ', $fields) . ", updated_at = CURRENT_TIMESTAMP WHERE id = :id OR supabase_id = :id";
        $stmt = $conn->prepare($query);
        $stmt->execute($params);
        
        if ($stmt->rowCount() > 0) {
            sendResponse(true, 'User updated successfully');
        } else {
            sendResponse(false, 'User not found or no changes made');
        }
    } catch(PDOException $e) {
        sendResponse(false, 'Database error: ' . $e->getMessage());
    }
}
?>
