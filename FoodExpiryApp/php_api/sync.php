<?php
require_once 'config.php';

// Handle different request methods
$method = $_SERVER['REQUEST_METHOD'];

// Get request data
$data = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'POST':
        if (isset($_GET['action'])) {
            switch ($_GET['action']) {
                case 'push':
                    pushData($data);
                    break;
                case 'pull':
                    pullData($data);
                    break;
                case 'sync':
                    syncData($data);
                    break;
                default:
                    sendResponse(false, 'Invalid action');
            }
        } else {
            sendResponse(false, 'Missing action parameter');
        }
        break;
        
    default:
        sendResponse(false, 'Method not allowed');
}

// Push local data to server
function pushData($data) {
    if (!isset($data['user_id']) || !isset($data['group_id'])) {
        sendResponse(false, 'Missing user_id or group_id');
    }
    
    $conn = getConnection();
    $userId = $data['user_id'];
    $groupId = $data['group_id'];
    $syncResults = [
        'food_items' => ['added' => 0, 'updated' => 0, 'deleted' => 0],
        'categories' => ['added' => 0, 'updated' => 0],
        'locations' => ['added' => 0, 'updated' => 0],
        'shopping_items' => ['added' => 0, 'updated' => 0, 'deleted' => 0],
        'wish_items' => ['added' => 0, 'updated' => 0, 'deleted' => 0],
    ];
    
    try {
        $conn->beginTransaction();
        
        // Process food items
        if (isset($data['food_items'])) {
            foreach ($data['food_items'] as $item) {
                // Check if item exists by cloud_id
                if (isset($item['cloud_id']) && $item['cloud_id']) {
                    $stmt = $conn->prepare("SELECT id FROM food_items WHERE cloud_id = :cloud_id");
                    $stmt->bindParam(':cloud_id', $item['cloud_id']);
                    $stmt->execute();
                    
                    if ($stmt->rowCount() > 0) {
                        // Update existing item
                        $existingItem = $stmt->fetch(PDO::FETCH_ASSOC);
                        $fields = [];
                        $params = [':id' => $existingItem['id']];
                        
                        foreach ($item as $key => $value) {
                            if ($key !== 'id' && $key !== 'cloud_id') {
                                $fields[] = "$key = :$key";
                                $params[":$key"] = $value;
                            }
                        }
                        
                        if (!empty($fields)) {
                            $query = "UPDATE food_items SET " . implode(', ', $fields) . " WHERE id = :id";
                            $stmt = $conn->prepare($query);
                            $stmt->execute($params);
                            $syncResults['food_items']['updated']++;
                        }
                    } else {
                        // Insert new item
                        $columns = array_keys($item);
                        $placeholders = array_map(function($col) { return ":$col"; }, $columns);
                        
                        $query = "INSERT INTO food_items (" . implode(', ', $columns) . ") VALUES (" . implode(', ', $placeholders) . ")";
                        $stmt = $conn->prepare($query);
                        
                        foreach ($item as $key => $value) {
                            $stmt->bindValue(":$key", $value);
                        }
                        
                        $stmt->execute();
                        $syncResults['food_items']['added']++;
                    }
                } else {
                    // Generate cloud_id and insert new item
                    $cloudId = 'item_' . uniqid();
                    $item['cloud_id'] = $cloudId;
                    $item['group_id'] = $groupId;
                    
                    $columns = array_keys($item);
                    $placeholders = array_map(function($col) { return ":$col"; }, $columns);
                    
                    $query = "INSERT INTO food_items (" . implode(', ', $columns) . ") VALUES (" . implode(', ', $placeholders) . ")";
                    $stmt = $conn->prepare($query);
                    
                    foreach ($item as $key => $value) {
                        $stmt->bindValue(":$key", $value);
                    }
                    
                    $stmt->execute();
                    $syncResults['food_items']['added']++;
                }
            }
        }
        
        // Handle deleted items if provided
        if (isset($data['deleted_items']) && isset($data['deleted_items']['food_items'])) {
            foreach ($data['deleted_items']['food_items'] as $cloudId) {
                $stmt = $conn->prepare("DELETE FROM food_items WHERE cloud_id = :cloud_id AND group_id = :group_id");
                $stmt->bindParam(':cloud_id', $cloudId);
                $stmt->bindParam(':group_id', $groupId);
                $stmt->execute();
                
                if ($stmt->rowCount() > 0) {
                    $syncResults['food_items']['deleted']++;
                }
            }
        }
        
        // Process categories (similar to food items)
        if (isset($data['categories'])) {
            // Similar implementation as food items
            // Code omitted for brevity
        }
        
        // Process locations (similar to food items)
        if (isset($data['locations'])) {
            // Similar implementation as food items
            // Code omitted for brevity
        }
        
        // Process shopping items (similar to food items)
        if (isset($data['shopping_items'])) {
            // Similar implementation as food items
            // Code omitted for brevity
        }
        
        // Process wish items (similar to food items)
        if (isset($data['wish_items'])) {
            // Similar implementation as food items
            // Code omitted for brevity
        }
        
        $conn->commit();
        
        sendResponse(true, 'Data pushed successfully', $syncResults);
    } catch(PDOException $e) {
        $conn->rollBack();
        sendResponse(false, 'Database error: ' . $e->getMessage());
    }
}

// Pull server data to local
function pullData($data) {
    if (!isset($data['user_id']) || !isset($data['group_id'])) {
        sendResponse(false, 'Missing user_id or group_id');
    }
    
    $conn = getConnection();
    $userId = $data['user_id'];
    $groupId = $data['group_id'];
    $lastSyncTime = isset($data['last_sync_time']) ? $data['last_sync_time'] : null;
    
    try {
        // Get food items for the group
        $foodItemsQuery = "SELECT * FROM food_items WHERE group_id = :group_id";
        if ($lastSyncTime) {
            $foodItemsQuery .= " AND updated_at > :last_sync_time";
        }
        
        $stmt = $conn->prepare($foodItemsQuery);
        $stmt->bindParam(':group_id', $groupId);
        if ($lastSyncTime) {
            $stmt->bindParam(':last_sync_time', $lastSyncTime);
        }
        $stmt->execute();
        
        $foodItems = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get categories
        $stmt = $conn->prepare("SELECT * FROM categories");
        $stmt->execute();
        $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get locations
        $stmt = $conn->prepare("SELECT * FROM locations");
        $stmt->execute();
        $locations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get shopping items for the group
        $shoppingItemsQuery = "SELECT * FROM shopping_items WHERE group_id = :group_id";
        if ($lastSyncTime) {
            $shoppingItemsQuery .= " AND updated_at > :last_sync_time";
        }
        
        $stmt = $conn->prepare($shoppingItemsQuery);
        $stmt->bindParam(':group_id', $groupId);
        if ($lastSyncTime) {
            $stmt->bindParam(':last_sync_time', $lastSyncTime);
        }
        $stmt->execute();
        
        $shoppingItems = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get wish items for the group
        $wishItemsQuery = "SELECT * FROM wish_items WHERE group_id = :group_id";
        if ($lastSyncTime) {
            $wishItemsQuery .= " AND updated_at > :last_sync_time";
        }
        
        $stmt = $conn->prepare($wishItemsQuery);
        $stmt->bindParam(':group_id', $groupId);
        if ($lastSyncTime) {
            $stmt->bindParam(':last_sync_time', $lastSyncTime);
        }
        $stmt->execute();
        
        $wishItems = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get user's groups
        $stmt = $conn->prepare("
            SELECT g.*, gm.role, gm.id as membership_id 
            FROM groups g
            JOIN group_memberships gm ON g.id = gm.group_id
            WHERE gm.user_id = :user_id
        ");
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        
        $groups = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Return all data
        $responseData = [
            'food_items' => $foodItems,
            'categories' => $categories,
            'locations' => $locations,
            'shopping_items' => $shoppingItems,
            'wish_items' => $wishItems,
            'groups' => $groups,
            'sync_time' => date('Y-m-d H:i:s')
        ];
        
        sendResponse(true, 'Data retrieved successfully', $responseData);
    } catch(PDOException $e) {
        sendResponse(false, 'Database error: ' . $e->getMessage());
    }
}

// Bidirectional sync
function syncData($data) {
    if (!isset($data['user_id']) || !isset($data['group_id'])) {
        sendResponse(false, 'Missing user_id or group_id');
    }
    
    // First push local changes to server
    pushData($data);
    
    // Then pull server changes to local
    pullData($data);
}
?>
