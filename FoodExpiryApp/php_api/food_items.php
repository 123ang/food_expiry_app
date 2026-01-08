<?php
require_once 'config.php';

// Handle different request methods
$method = $_SERVER['REQUEST_METHOD'];

// Get request data
$data = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            getFoodItem($_GET['id']);
        } else if (isset($_GET['group_id'])) {
            getGroupFoodItems($_GET['group_id']);
        } else {
            getAllFoodItems();
        }
        break;
        
    case 'POST':
        createFoodItem($data);
        break;
        
    case 'PUT':
        if (isset($_GET['id'])) {
            updateFoodItem($_GET['id'], $data);
        } else {
            sendResponse(false, 'Missing ID parameter');
        }
        break;
        
    case 'DELETE':
        if (isset($_GET['id'])) {
            deleteFoodItem($_GET['id']);
        } else {
            sendResponse(false, 'Missing ID parameter');
        }
        break;
        
    default:
        sendResponse(false, 'Method not allowed');
}

// Get all food items
function getAllFoodItems() {
    $conn = getConnection();
    
    try {
        $stmt = $conn->prepare("
            SELECT fi.*, c.name as category_name, c.icon as category_icon, 
            l.name as location_name, l.icon as location_icon
            FROM food_items fi
            LEFT JOIN categories c ON fi.category_id = c.id
            LEFT JOIN locations l ON fi.location_id = l.id
        ");
        $stmt->execute();
        
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        sendResponse(true, 'Food items retrieved successfully', $items);
    } catch(PDOException $e) {
        sendResponse(false, 'Database error: ' . $e->getMessage());
    }
}

// Get food item by ID
function getFoodItem($id) {
    $conn = getConnection();
    
    try {
        $stmt = $conn->prepare("
            SELECT fi.*, c.name as category_name, c.icon as category_icon, 
            l.name as location_name, l.icon as location_icon
            FROM food_items fi
            LEFT JOIN categories c ON fi.category_id = c.id
            LEFT JOIN locations l ON fi.location_id = l.id
            WHERE fi.id = :id
        ");
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        
        $item = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($item) {
            sendResponse(true, 'Food item found', $item);
        } else {
            sendResponse(false, 'Food item not found');
        }
    } catch(PDOException $e) {
        sendResponse(false, 'Database error: ' . $e->getMessage());
    }
}

// Get food items for a group
function getGroupFoodItems($groupId) {
    $conn = getConnection();
    
    try {
        $stmt = $conn->prepare("
            SELECT fi.*, c.name as category_name, c.icon as category_icon, 
            l.name as location_name, l.icon as location_icon
            FROM food_items fi
            LEFT JOIN categories c ON fi.category_id = c.id
            LEFT JOIN locations l ON fi.location_id = l.id
            WHERE fi.group_id = :group_id
        ");
        $stmt->bindParam(':group_id', $groupId);
        $stmt->execute();
        
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        sendResponse(true, 'Group food items retrieved successfully', $items);
    } catch(PDOException $e) {
        sendResponse(false, 'Database error: ' . $e->getMessage());
    }
}

// Create new food item
function createFoodItem($data) {
    if (!isset($data['name']) || !isset($data['expiry_date'])) {
        sendResponse(false, 'Missing required fields');
    }
    
    $conn = getConnection();
    
    try {
        $stmt = $conn->prepare("
            INSERT INTO food_items (
                name, quantity, category_id, location_id, expiry_date, 
                reminder_days, notes, image_uri, group_id, cloud_id
            ) VALUES (
                :name, :quantity, :category_id, :location_id, :expiry_date, 
                :reminder_days, :notes, :image_uri, :group_id, :cloud_id
            )
        ");
        
        $stmt->bindParam(':name', $data['name']);
        $stmt->bindParam(':quantity', $data['quantity'] ?? 1);
        $stmt->bindParam(':category_id', $data['category_id'] ?? null);
        $stmt->bindParam(':location_id', $data['location_id'] ?? null);
        $stmt->bindParam(':expiry_date', $data['expiry_date']);
        $stmt->bindParam(':reminder_days', $data['reminder_days'] ?? 3);
        $stmt->bindParam(':notes', $data['notes'] ?? null);
        $stmt->bindParam(':image_uri', $data['image_uri'] ?? null);
        $stmt->bindParam(':group_id', $data['group_id'] ?? null);
        $stmt->bindParam(':cloud_id', $data['cloud_id'] ?? null);
        
        $stmt->execute();
        
        $itemId = $conn->lastInsertId();
        
        // Generate cloud_id if not provided
        if (!isset($data['cloud_id'])) {
            $cloudId = 'item_' . uniqid();
            $updateStmt = $conn->prepare("UPDATE food_items SET cloud_id = :cloud_id WHERE id = :id");
            $updateStmt->bindParam(':cloud_id', $cloudId);
            $updateStmt->bindParam(':id', $itemId);
            $updateStmt->execute();
        }
        
        sendResponse(true, 'Food item created successfully', [
            'id' => $itemId,
            'cloud_id' => $data['cloud_id'] ?? $cloudId
        ]);
    } catch(PDOException $e) {
        sendResponse(false, 'Database error: ' . $e->getMessage());
    }
}

// Update food item
function updateFoodItem($id, $data) {
    $conn = getConnection();
    
    try {
        $fields = [];
        $params = [':id' => $id];
        
        // Build dynamic update query based on provided fields
        foreach ($data as $key => $value) {
            if ($key !== 'id') {
                $fields[] = "$key = :$key";
                $params[":$key"] = $value;
            }
        }
        
        if (empty($fields)) {
            sendResponse(false, 'No fields to update');
            return;
        }
        
        $query = "UPDATE food_items SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $conn->prepare($query);
        $stmt->execute($params);
        
        if ($stmt->rowCount() > 0) {
            sendResponse(true, 'Food item updated successfully');
        } else {
            sendResponse(false, 'Food item not found or no changes made');
        }
    } catch(PDOException $e) {
        sendResponse(false, 'Database error: ' . $e->getMessage());
    }
}

// Delete food item
function deleteFoodItem($id) {
    $conn = getConnection();
    
    try {
        $stmt = $conn->prepare("DELETE FROM food_items WHERE id = :id");
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            sendResponse(true, 'Food item deleted successfully');
        } else {
            sendResponse(false, 'Food item not found');
        }
    } catch(PDOException $e) {
        sendResponse(false, 'Database error: ' . $e->getMessage());
    }
}
?>
