# Food Expiry App Database Sync Documentation

This document outlines the database design for the Food Expiry App and explains the synchronization mechanism between local SQLite and cloud databases.

## Local Database Schema

### Tables Structure

The app uses SQLite for local storage with the following tables:

#### 1. `food_items`
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `name` | TEXT | Item name |
| `quantity` | INTEGER | Quantity |
| `category_id` | INTEGER | Foreign key to categories table |
| `location_id` | INTEGER | Foreign key to locations table |
| `group_id` | TEXT | Group identifier for multi-user sync |
| `cloud_id` | TEXT | Unique identifier for cloud sync |
| `expiry_date` | TEXT | Date in YYYY-MM-DD format |
| `reminder_days` | INTEGER | Days before expiry to show reminder |
| `notes` | TEXT | Additional notes |
| `image_uri` | TEXT | Path to local image file |
| `created_at` | TEXT | Creation timestamp |
| `updated_at` | TEXT | Last modification timestamp |
| `sync_status` | TEXT | Status of cloud sync (pending/synced/conflict) |

#### 2. `categories`
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `name` | TEXT | Category name |
| `icon` | TEXT | Emoji or icon code |
| `translation_key` | TEXT | Key for translations |
| `cloud_id` | TEXT | Unique identifier for cloud sync |
| `created_at` | TEXT | Creation timestamp |
| `updated_at` | TEXT | Last modification timestamp |
| `sync_status` | TEXT | Status of cloud sync |

#### 3. `locations`
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `name` | TEXT | Location name |
| `icon` | TEXT | Emoji or icon code |
| `translation_key` | TEXT | Key for translations |
| `cloud_id` | TEXT | Unique identifier for cloud sync |
| `created_at` | TEXT | Creation timestamp |
| `updated_at` | TEXT | Last modification timestamp |
| `sync_status` | TEXT | Status of cloud sync |

#### 4. `shopping_items`
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `name` | TEXT | Item name |
| `image_uri` | TEXT | Path to local image file |
| `done` | BOOLEAN | Completion status |
| `group_id` | TEXT | Group identifier for multi-user sync |
| `cloud_id` | TEXT | Unique identifier for cloud sync |
| `created_at` | TEXT | Creation timestamp |
| `updated_at` | TEXT | Last modification timestamp |
| `sync_status` | TEXT | Status of cloud sync |

#### 5. `wish_items`
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `name` | TEXT | Item name |
| `notes` | TEXT | Additional notes |
| `price` | TEXT | Price information |
| `rating` | INTEGER | Rating (0-5) |
| `image_uri` | TEXT | Path to local image file |
| `done` | BOOLEAN | Completion status |
| `group_id` | TEXT | Group identifier for multi-user sync |
| `cloud_id` | TEXT | Unique identifier for cloud sync |
| `created_at` | TEXT | Creation timestamp |
| `updated_at` | TEXT | Last modification timestamp |
| `sync_status` | TEXT | Status of cloud sync |

#### 6. `deleted_items`
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `table_name` | TEXT | Name of the table item was deleted from |
| `item_id` | INTEGER | ID of the deleted item |
| `cloud_id` | TEXT | Cloud ID of the deleted item (if available) |
| `deleted_at` | TEXT | Deletion timestamp |

#### 7. `sync_log`
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `sync_time` | TEXT | Timestamp of sync operation |
| `status` | TEXT | Success/Failure status |
| `items_uploaded` | INTEGER | Count of items uploaded |
| `items_downloaded` | INTEGER | Count of items downloaded |
| `images_uploaded` | INTEGER | Count of images uploaded |
| `images_downloaded` | INTEGER | Count of images downloaded |
| `error` | TEXT | Error message if sync failed |

## Database Indexes

To optimize sync and query performance, the database includes these indexes:

- `idx_food_items_cloud_id` - Indexes `cloud_id` in the food_items table
- `idx_food_items_updated_at` - Indexes `updated_at` in the food_items table
- `idx_food_items_sync_status` - Indexes `sync_status` in the food_items table
- `idx_food_items_group_id` - Indexes `group_id` in the food_items table

Similar indexes exist for the other tables.

## Sync Mechanism

The sync mechanism follows an offline-first approach where the local SQLite database is the primary source of truth, while the cloud database acts as a backup and sharing platform.

### Sync Flow

1. **Initialization**:
   - User authenticates and selects or creates a group
   - Database is prepared with necessary sync columns
   - Local changes are tracked via timestamps and sync_status flags

2. **Uploading to Cloud**:
   - Local items modified since last sync are collected
   - Images are encoded as base64 for transmission
   - Changes are sent to the cloud server
   - Cloud server processes changes and returns confirmations

3. **Downloading from Cloud**:
   - Server returns items that have been modified by other users
   - Server returns images that need to be downloaded
   - Local database is updated with cloud changes
   - Images are saved locally to the filesystem

4. **Conflict Resolution**:
   - Last-write-wins strategy based on timestamps
   - When conflicts occur, the most recently modified item takes precedence
   - Conflicts are logged for potential manual resolution

5. **Deletion Tracking**:
   - When items are deleted locally, they are tracked in the `deleted_items` table
   - Deleted items are removed from the cloud during the next sync
   - Server-side deletions are applied locally during sync

### Image Handling

Images are handled specially during sync:

1. **Upload**: Local images are read, converted to base64, and sent to the cloud
2. **Download**: Base64-encoded images from the cloud are saved to the local filesystem
3. **Reference Updates**: Image URIs are updated to point to local files after download

## How to Use Sync

### Manual Sync

Users can manually trigger a sync operation by:
1. Tapping the sync button in the app
2. Pulling down to refresh the main screen

The sync operation will:
- Check for internet connectivity
- Authenticate the user if needed
- Upload local changes to the cloud
- Download changes from other devices
- Update the local database
- Provide feedback on sync results

### SyncService API

The app includes a `SyncService` class with these main methods:

```typescript
// Initialize sync service
const syncService = new SyncService();

// Update database schema for sync
await syncService.updateDatabaseForSync();

// Perform sync operation
const result = await syncService.syncDatabase(userId, groupId);

// Track deleted items
await syncService.trackDeletedItem(tableName, itemId);
```

## Cloud API Integration

The app communicates with the cloud server via a REST API with these endpoints:

- `sync.php?action=sync`: Main sync endpoint for bidirectional sync
- `sync.php?action=push`: Push local changes to cloud
- `sync.php?action=pull`: Pull cloud changes to local

The API uses JWT authentication and sends/receives JSON data with base64-encoded images.

## Best Practices

1. **Always Update Local First**: Always update the local database before attempting cloud sync
2. **Unique Cloud IDs**: Ensure all synced items have unique cloud_ids
3. **Track Deletions**: Always track deletions to ensure they propagate to the cloud
4. **Handle Network Issues**: Implement retry logic and offline queue for sync operations
5. **Image Optimization**: Resize/compress images before sync to reduce bandwidth usage
