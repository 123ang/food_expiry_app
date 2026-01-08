<?php
// Main API entry point
header('Content-Type: application/json');

// Check if API is running
echo json_encode([
    'status' => true,
    'message' => 'Food Expiry API is running',
    'version' => '1.0.0',
    'endpoints' => [
        '/users.php' => 'User management',
        '/groups.php' => 'Group management',
        '/food_items.php' => 'Food items management',
        '/sync.php' => 'Data synchronization'
    ]
]);
?>
