import { getDatabase } from './database';

/**
 * Adds necessary columns for cloud sync functionality with Supabase
 */
export const addSyncColumnsToDatabase = async (): Promise<boolean> => {
  try {
    const db = await getDatabase();
    if (!db) {
      return false;
    }
    
    // Add cloud_id column to tables (used to map to Supabase UUIDs)
    try { await db.execAsync('ALTER TABLE categories ADD COLUMN cloud_id TEXT'); } catch (e) {}
    try { await db.execAsync('ALTER TABLE locations ADD COLUMN cloud_id TEXT'); } catch (e) {}
    try { await db.execAsync('ALTER TABLE food_items ADD COLUMN cloud_id TEXT'); } catch (e) {}
    try { await db.execAsync('ALTER TABLE wish_items ADD COLUMN cloud_id TEXT'); } catch (e) {}
    try { await db.execAsync('ALTER TABLE shopping_items ADD COLUMN cloud_id TEXT'); } catch (e) {}
    
    // Add updated_at timestamp columns
    try { await db.execAsync('ALTER TABLE categories ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP'); } catch (e) {}
    try { await db.execAsync('ALTER TABLE locations ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP'); } catch (e) {}
    try { await db.execAsync('ALTER TABLE food_items ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP'); } catch (e) {}
    try { await db.execAsync('ALTER TABLE wish_items ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP'); } catch (e) {}
    try { await db.execAsync('ALTER TABLE shopping_items ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP'); } catch (e) {}
    
    // Add sync_status columns
    try { await db.execAsync('ALTER TABLE categories ADD COLUMN sync_status TEXT DEFAULT "pending"'); } catch (e) {}
    try { await db.execAsync('ALTER TABLE locations ADD COLUMN sync_status TEXT DEFAULT "pending"'); } catch (e) {}
    try { await db.execAsync('ALTER TABLE food_items ADD COLUMN sync_status TEXT DEFAULT "pending"'); } catch (e) {}
    try { await db.execAsync('ALTER TABLE wish_items ADD COLUMN sync_status TEXT DEFAULT "pending"'); } catch (e) {}
    try { await db.execAsync('ALTER TABLE shopping_items ADD COLUMN sync_status TEXT DEFAULT "pending"'); } catch (e) {}
    
    // Add group_id column to items tables
    try { await db.execAsync('ALTER TABLE wish_items ADD COLUMN group_id TEXT'); } catch (e) {}
    try { await db.execAsync('ALTER TABLE shopping_items ADD COLUMN group_id TEXT'); } catch (e) {}
    
    // Create deleted items tracking table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS deleted_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        item_id INTEGER NOT NULL,
        cloud_id TEXT,
        group_id TEXT, -- Add group_id for Supabase sync
        deleted_at TEXT NOT NULL
      )
    `);
    
    // Create sync_log table to track sync history
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        group_id TEXT NOT NULL,
        sync_time TEXT NOT NULL,
        status TEXT NOT NULL,
        items_uploaded INTEGER,
        items_downloaded INTEGER,
        images_uploaded INTEGER,
        images_downloaded INTEGER,
        error TEXT
      )
    `);
    
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Create indexes to optimize sync queries for Supabase integration
 */
export const createSyncIndexes = async (): Promise<boolean> => {
  try {
    const db = await getDatabase();
    if (!db) {
      return false;
    }
    
    // Create indexes for cloud_id (maps to Supabase UUIDs)
    try { await db.execAsync('CREATE INDEX IF NOT EXISTS idx_categories_cloud_id ON categories(cloud_id)'); } catch (e) {}
    try { await db.execAsync('CREATE INDEX IF NOT EXISTS idx_locations_cloud_id ON locations(cloud_id)'); } catch (e) {}
    try { await db.execAsync('CREATE INDEX IF NOT EXISTS idx_food_items_cloud_id ON food_items(cloud_id)'); } catch (e) {}
    try { await db.execAsync('CREATE INDEX IF NOT EXISTS idx_wish_items_cloud_id ON wish_items(cloud_id)'); } catch (e) {}
    try { await db.execAsync('CREATE INDEX IF NOT EXISTS idx_shopping_items_cloud_id ON shopping_items(cloud_id)'); } catch (e) {}
    
    // Create indexes for updated_at (for sync conflict resolution)
    try { await db.execAsync('CREATE INDEX IF NOT EXISTS idx_categories_updated_at ON categories(updated_at)'); } catch (e) {}
    try { await db.execAsync('CREATE INDEX IF NOT EXISTS idx_locations_updated_at ON locations(updated_at)'); } catch (e) {}
    try { await db.execAsync('CREATE INDEX IF NOT EXISTS idx_food_items_updated_at ON food_items(updated_at)'); } catch (e) {}
    try { await db.execAsync('CREATE INDEX IF NOT EXISTS idx_wish_items_updated_at ON wish_items(updated_at)'); } catch (e) {}
    try { await db.execAsync('CREATE INDEX IF NOT EXISTS idx_shopping_items_updated_at ON shopping_items(updated_at)'); } catch (e) {}
    
    // Create indexes for sync_status
    try { await db.execAsync('CREATE INDEX IF NOT EXISTS idx_categories_sync_status ON categories(sync_status)'); } catch (e) {}
    try { await db.execAsync('CREATE INDEX IF NOT EXISTS idx_locations_sync_status ON locations(sync_status)'); } catch (e) {}
    try { await db.execAsync('CREATE INDEX IF NOT EXISTS idx_food_items_sync_status ON food_items(sync_status)'); } catch (e) {}
    try { await db.execAsync('CREATE INDEX IF NOT EXISTS idx_wish_items_sync_status ON wish_items(sync_status)'); } catch (e) {}
    try { await db.execAsync('CREATE INDEX IF NOT EXISTS idx_shopping_items_sync_status ON shopping_items(sync_status)'); } catch (e) {}
    
    // Create indexes for group_id (important for Supabase RLS policies)
    try { await db.execAsync('CREATE INDEX IF NOT EXISTS idx_food_items_group_id ON food_items(group_id)'); } catch (e) {}
    try { await db.execAsync('CREATE INDEX IF NOT EXISTS idx_wish_items_group_id ON wish_items(group_id)'); } catch (e) {}
    try { await db.execAsync('CREATE INDEX IF NOT EXISTS idx_shopping_items_group_id ON shopping_items(group_id)'); } catch (e) {}
    try { await db.execAsync('CREATE INDEX IF NOT EXISTS idx_deleted_items_group_id ON deleted_items(group_id)'); } catch (e) {}
    
    // Create index for deleted_items table to optimize syncing
    try { await db.execAsync('CREATE INDEX IF NOT EXISTS idx_deleted_items_cloud_id ON deleted_items(cloud_id)'); } catch (e) {}
    try { await db.execAsync('CREATE INDEX IF NOT EXISTS idx_deleted_items_table ON deleted_items(table_name)'); } catch (e) {}
    try { await db.execAsync('CREATE INDEX IF NOT EXISTS idx_deleted_items_deleted_at ON deleted_items(deleted_at)'); } catch (e) {}
    
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Prepare database for UUID-based synchronization (PostgreSQL)
 * This is now used for PostgreSQL sync, not Supabase
 */
export const prepareForSupabaseSync = async (): Promise<boolean> => {
  try {
    const db = await getDatabase();
    if (!db) {
      return false;
    }
    
    // Ensure all items have a cloud_id (UUID format) for PostgreSQL sync
    const tables = ['food_items', 'categories', 'locations', 'shopping_items', 'wish_items'];
    for (const table of tables) {
      try {
        // First check if the table exists
        const tableExists = await db.getFirstAsync(
          `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
          [table]
        );
        
        if (!tableExists) {
          continue;
        }
        
        // Generate UUIDs for any items that don't have cloud_ids
        const items = await db.getAllAsync<{ id: number }>(
          `SELECT id FROM ${table} WHERE cloud_id IS NULL OR cloud_id = ''`
        );
        
        // Update items in batches to prevent possible locking issues
        const batchSize = 50;
        for (let i = 0; i < items.length; i += batchSize) {
          const batch = items.slice(i, i + batchSize);
          await db.withTransactionAsync(async () => {
            for (const item of batch) {
              const uuid = generateUUID();
              await db.runAsync(
                `UPDATE ${table} SET cloud_id = ?, sync_status = 'pending' WHERE id = ?`,
                [uuid, item.id]
              );
            }
          });
        }
      } catch (e) {
        // Continue with other tables
      }
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

// Helper function to generate UUIDs
const generateUUID = (): string => {
  // Simple UUID v4 implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Run all database migrations needed for sync
 */
export const runSyncMigrations = async (): Promise<boolean> => {
  try {
    const columnsAdded = await addSyncColumnsToDatabase();
    const indexesCreated = await createSyncIndexes();
    const supbasePrepared = await prepareForSupabaseSync();
    return columnsAdded && indexesCreated && supbasePrepared;
  } catch (error) {
    return false;
  }
};
