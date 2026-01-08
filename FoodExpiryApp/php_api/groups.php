<?php
require_once 'config.php';

// Handle different request methods
$method = $_SERVER['REQUEST_METHOD'];

// Get request data
$data = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            getGroup($_GET['id']);
        } else if (isset($_GET['user_id'])) {
            getUserGroups($_GET['user_id']);
        } else {
            getAllGroups();
        }
        break;
        
    case 'POST':
        createGroup($data);
        break;
        
    case 'PUT':
        if (isset($_GET['id'])) {
            updateGroup($_GET['id'], $data);
        } else {
            sendResponse(false, 'Missing ID parameter');
        }
        break;
        
    case 'DELETE':
        if (isset($_GET['id'])) {
            deleteGroup($_GET['id']);
        } else {
            sendResponse(false, 'Missing ID parameter');
        }
        break;
        
    default:
        sendResponse(false, 'Method not allowed');
}

// Get all groups
function getAllGroups() {
    $conn = getConnection();
    
    try {
        $stmt = $conn->prepare("SELECT * FROM groups");
        $stmt->execute();
        
        $groups = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        sendResponse(true, 'Groups retrieved successfully', $groups);
    } catch(PDOException $e) {
        sendResponse(false, 'Database error: ' . $e->getMessage());
    }
}

// Get group by ID
function getGroup($id) {
    $conn = getConnection();
    
    try {
        $stmt = $conn->prepare("SELECT * FROM groups WHERE id = :id");
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        
        $group = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($group) {
            // Get group members
            $stmt = $conn->prepare("
                SELECT gm.*, u.email, u.full_name 
                FROM group_memberships gm
                JOIN users u ON gm.user_id = u.supabase_id
                WHERE gm.group_id = :group_id
            ");
            $stmt->bindParam(':group_id', $id);
            $stmt->execute();
            
            $members = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $group['members'] = $members;
            
            sendResponse(true, 'Group found', $group);
        } else {
            sendResponse(false, 'Group not found');
        }
    } catch(PDOException $e) {
        sendResponse(false, 'Database error: ' . $e->getMessage());
    }
}

// Get groups for a user
function getUserGroups($userId) {
    $conn = getConnection();
    
    try {
        $stmt = $conn->prepare("
            SELECT g.*, gm.role, gm.id as membership_id 
            FROM groups g
            JOIN group_memberships gm ON g.id = gm.group_id
            JOIN users u ON gm.user_id = u.supabase_id
            WHERE gm.user_id = :user_id OR u.id = :user_id_numeric
        ");
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':user_id_numeric', $userId);
        $stmt->execute();
        
        $groups = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        sendResponse(true, 'User groups retrieved successfully', $groups);
    } catch(PDOException $e) {
        sendResponse(false, 'Database error: ' . $e->getMessage());
    }
}

// Create new group
function createGroup($data) {
    if (!isset($data['name']) || !isset($data['created_by'])) {
        sendResponse(false, 'Missing required fields');
    }
    
    $conn = getConnection();
    
    try {
        // Start transaction
        $conn->beginTransaction();
        
        // Insert group
        $stmt = $conn->prepare("
            INSERT INTO groups (name, description, created_by) 
            VALUES (:name, :description, :created_by)
        ");
        $stmt->bindParam(':name', $data['name']);
        $stmt->bindParam(':description', $data['description'] ?? null);
        $stmt->bindParam(':created_by', $data['created_by']);
        $stmt->execute();
        
        $groupId = $conn->lastInsertId();
        
        // Add creator as owner
        $stmt = $conn->prepare("
            INSERT INTO group_memberships (group_id, user_id, role) 
            VALUES (:group_id, :user_id, 'owner')
        ");
        $stmt->bindParam(':group_id', $groupId);
        $stmt->bindParam(':user_id', $data['created_by']);
        $stmt->execute();
        
        // Commit transaction
        $conn->commit();
        
        sendResponse(true, 'Group created successfully', [
            'id' => $groupId,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'created_by' => $data['created_by']
        ]);
    } catch(PDOException $e) {
        // Rollback transaction on error
        $conn->rollBack();
        sendResponse(false, 'Database error: ' . $e->getMessage());
    }
}

// Update group
function updateGroup($id, $data) {
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
        
        $query = "UPDATE groups SET " . implode(', ', $fields) . ", updated_at = CURRENT_TIMESTAMP WHERE id = :id";
        $stmt = $conn->prepare($query);
        $stmt->execute($params);
        
        if ($stmt->rowCount() > 0) {
            sendResponse(true, 'Group updated successfully');
        } else {
            sendResponse(false, 'Group not found or no changes made');
        }
    } catch(PDOException $e) {
        sendResponse(false, 'Database error: ' . $e->getMessage());
    }
}

// Delete group
function deleteGroup($id) {
    $conn = getConnection();
    
    try {
        // Start transaction
        $conn->beginTransaction();
        
        // Delete group memberships first (should cascade, but just to be sure)
        $stmt = $conn->prepare("DELETE FROM group_memberships WHERE group_id = :id");
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        
        // Delete group
        $stmt = $conn->prepare("DELETE FROM groups WHERE id = :id");
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        
        // Commit transaction
        $conn->commit();
        
        if ($stmt->rowCount() > 0) {
            sendResponse(true, 'Group deleted successfully');
        } else {
            sendResponse(false, 'Group not found');
        }
    } catch(PDOException $e) {
        // Rollback transaction on error
        $conn->rollBack();
        sendResponse(false, 'Database error: ' . $e->getMessage());
    }
}
?>
