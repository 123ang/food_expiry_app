import * as FileSystem from 'expo-file-system/legacy';
import { getDatabase, isUsingFallbackStorage, queuedDatabaseOperation } from '../database/database';
import { webIndexedDbStorage, WebFallbackData } from './WebIndexedDbStorage';

export const LOCAL_EXPORT_SCHEMA_VERSION = 1;

const LOCAL_EXPORT_APP_NAME = 'Expiry Alert';
const LOCAL_EXPORT_TABLES = [
  'categories',
  'locations',
  'food_items',
  'shopping_items',
  'wish_items',
] as const;

type LocalExportTable = typeof LOCAL_EXPORT_TABLES[number];
type LocalExportRow = Record<string, unknown>;
type LocalExportData = Record<LocalExportTable, LocalExportRow[]>;
type ImportCounts = Record<LocalExportTable, number>;

type TableInfoRow = {
  name?: string;
};

export type LocalDataExport = {
  metadata: {
    app: string;
    schemaVersion: number;
    exportedAt: string;
    tables: LocalExportTable[];
  };
  data: LocalExportData;
};

export type LocalDataExportFile = {
  uri: string;
  json: string;
  exportData: LocalDataExport;
};

const createEmptyExportData = (): LocalExportData => ({
  categories: [],
  locations: [],
  food_items: [],
  shopping_items: [],
  wish_items: [],
});

const createEmptyImportCounts = (): ImportCounts => ({
  categories: 0,
  locations: 0,
  food_items: 0,
  shopping_items: 0,
  wish_items: 0,
});

const createExportFromData = (data: LocalExportData): LocalDataExport => ({
  metadata: {
    app: LOCAL_EXPORT_APP_NAME,
    schemaVersion: LOCAL_EXPORT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    tables: [...LOCAL_EXPORT_TABLES],
  },
  data,
});

const fallbackToExportData = (fallbackData: WebFallbackData): LocalExportData => ({
  categories: fallbackData.categories,
  locations: fallbackData.locations,
  food_items: fallbackData.foodItems,
  shopping_items: fallbackData.shoppingItems,
  wish_items: fallbackData.wishItems,
});

export const createFallbackLocalDataExport = async (): Promise<LocalDataExport> => {
  const fallbackData = await webIndexedDbStorage.exportFallbackData();
  return createExportFromData(fallbackToExportData(fallbackData));
};

export const importFallbackLocalDataExport = async (exportData: LocalDataExport): Promise<ImportCounts> => {
  await webIndexedDbStorage.importFallbackData({
    categories: exportData.data.categories,
    locations: exportData.data.locations,
    foodItems: exportData.data.food_items,
    shoppingItems: exportData.data.shopping_items,
    wishItems: exportData.data.wish_items,
  });

  return {
    categories: exportData.data.categories.length,
    locations: exportData.data.locations.length,
    food_items: exportData.data.food_items.length,
    shopping_items: exportData.data.shopping_items.length,
    wish_items: exportData.data.wish_items.length,
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const quoteIdentifier = (identifier: string) => `"${identifier.replace(/"/g, '""')}"`;

const normalizeSqliteValue = (value: unknown): string | number | null => {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }

  return JSON.stringify(value);
};

const getRequiredDatabase = async () => {
  const database = await getDatabase();

  if (!database) {
    throw new Error('Local database is not available.');
  }

  return database;
};

const getTableColumns = async (
  database: Awaited<ReturnType<typeof getRequiredDatabase>>,
  table: LocalExportTable
): Promise<string[]> => {
  const columns = await database.getAllAsync(`PRAGMA table_info(${table})`) as TableInfoRow[];
  return columns
    .map((column) => column.name)
    .filter((name): name is string => typeof name === 'string' && name.length > 0);
};

const validateLocalDataExport = (value: unknown): LocalDataExport => {
  if (!isRecord(value) || !isRecord(value.metadata) || !isRecord(value.data)) {
    throw new Error('Invalid local export format.');
  }

  const schemaVersion = value.metadata.schemaVersion;
  if (schemaVersion !== LOCAL_EXPORT_SCHEMA_VERSION) {
    throw new Error(`Unsupported local export schema version: ${String(schemaVersion)}`);
  }

  const exportData = createEmptyExportData();

  for (const table of LOCAL_EXPORT_TABLES) {
    const rows = value.data[table];
    if (rows === undefined) {
      continue;
    }

    if (!Array.isArray(rows)) {
      throw new Error(`Invalid rows for ${table}.`);
    }

    exportData[table] = rows.map((row) => {
      if (!isRecord(row)) {
        throw new Error(`Invalid row in ${table}.`);
      }
      return row;
    });
  }

  return {
    metadata: {
      app: typeof value.metadata.app === 'string' ? value.metadata.app : LOCAL_EXPORT_APP_NAME,
      schemaVersion: LOCAL_EXPORT_SCHEMA_VERSION,
      exportedAt: typeof value.metadata.exportedAt === 'string' ? value.metadata.exportedAt : new Date().toISOString(),
      tables: [...LOCAL_EXPORT_TABLES],
    },
    data: exportData,
  };
};

export const createLocalDataExport = async (): Promise<LocalDataExport> => (
  queuedDatabaseOperation(async () => {
    if (isUsingFallbackStorage()) {
      return createFallbackLocalDataExport();
    }

    const database = await getRequiredDatabase();
    const data = createEmptyExportData();

    for (const table of LOCAL_EXPORT_TABLES) {
      data[table] = await database.getAllAsync(`SELECT * FROM ${table} ORDER BY id`) as LocalExportRow[];
    }

    return createExportFromData(data);
  }, 'createLocalDataExport')
);

export const writeLocalDataExportFile = async (): Promise<LocalDataExportFile> => {
  const exportData = await createLocalDataExport();
  const json = JSON.stringify(exportData, null, 2);
  const documentDirectory = FileSystem.documentDirectory;

  if (!documentDirectory) {
    throw new Error('Local document directory is not available.');
  }

  const filename = `expiry-alert-local-export-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const uri = `${documentDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(uri, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return {
    uri,
    json,
    exportData,
  };
};

export const importLocalDataExportFromJson = async (json: string): Promise<ImportCounts> => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch (error) {
    throw new Error('Invalid local export JSON.');
  }

  const exportData = validateLocalDataExport(parsed);

  if (isUsingFallbackStorage()) {
    return importFallbackLocalDataExport(exportData);
  }

  return queuedDatabaseOperation(async () => {
    const database = await getRequiredDatabase();
    const counts = createEmptyImportCounts();

    for (const table of LOCAL_EXPORT_TABLES) {
      const tableColumns = await getTableColumns(database, table);
      const allowedColumns = new Set(tableColumns);

      for (const row of exportData.data[table]) {
        const columns = Object.keys(row).filter((column) => allowedColumns.has(column));

        if (columns.length === 0) {
          continue;
        }

        const columnList = columns.map(quoteIdentifier).join(', ');
        const placeholders = columns.map(() => '?').join(', ');
        const values = columns.map((column) => normalizeSqliteValue(row[column]));

        await database.runAsync(
          `INSERT OR REPLACE INTO ${table} (${columnList}) VALUES (${placeholders})`,
          values
        );
        counts[table] += 1;
      }
    }

    return counts;
  }, 'importLocalDataExportFromJson');
};
