import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path) => readFileSync(join(projectRoot, path), 'utf8');
const fail = (message) => {
  throw new Error(message);
};

const packageJson = read('package.json');
if (!packageJson.includes('"check:phase-2-complete": "node scripts/check-phase-2-complete.mjs"')) {
  fail('package.json is missing check:phase-2-complete.');
}

const webStorage = read('services/WebIndexedDbStorage.ts');
for (const snippet of [
  'indexedDB',
  'expiry_alert_web_local_store',
  'readFallbackData',
  'writeFallbackData',
  'exportFallbackData',
  'importFallbackData',
  'shoppingItems',
  'wishItems',
]) {
  if (!webStorage.includes(snippet)) {
    fail(`WebIndexedDbStorage snippet missing: ${snippet}`);
  }
}

const database = read('database/database.ts');
for (const snippet of [
  'webIndexedDbStorage',
  "Platform.OS === 'web'",
  'readFallbackData',
  'writeFallbackData',
  'shoppingItems: []',
  'wishItems: []',
]) {
  if (!database.includes(snippet)) {
    fail(`database.ts Phase 2 web fallback snippet missing: ${snippet}`);
  }
}

const portability = read('services/LocalDataPortabilityService.ts');
for (const snippet of [
  'createFallbackLocalDataExport',
  'importFallbackLocalDataExport',
  'isUsingFallbackStorage',
  'webIndexedDbStorage.exportFallbackData',
  'webIndexedDbStorage.importFallbackData',
]) {
  if (!portability.includes(snippet)) {
    fail(`LocalDataPortabilityService Phase 2 web snippet missing: ${snippet}`);
  }
}

const databaseContext = read('context/DatabaseContext.tsx');
for (const snippet of [
  'rescheduleLocalNotifications',
  'simpleNotificationService.checkAllFoodItemsForExpiry',
  'void rescheduleLocalNotifications()',
]) {
  if (!databaseContext.includes(snippet)) {
    fail(`DatabaseContext local notification snippet missing: ${snippet}`);
  }
}

const settings = read('app/settings.tsx');
for (const snippet of [
  'showCloudUpgradePrompt',
  "t('settings.cloudOnlyFeatureTitle')",
  "t('settings.cloudOnlyFeatureMessage')",
  "t('settings.upgradeToCloud')",
]) {
  if (!settings.includes(snippet)) {
    fail(`Settings cloud upgrade prompt snippet missing: ${snippet}`);
  }
}

const translationFiles = ['en.ts', 'zh.ts', 'ja.ts', 'th.ts', 'ms.ts'];
const requiredTranslationKeys = [
  'settings.cloudOnlyFeatureTitle',
  'settings.cloudOnlyFeatureMessage',
  'settings.upgradeToCloud',
];

for (const translationFile of translationFiles) {
  const content = read(`translations/${translationFile}`);
  for (const key of requiredTranslationKeys) {
    if (!content.includes(`'${key}':`)) {
      fail(`translations/${translationFile} is missing ${key}.`);
    }
  }
}

console.log('Phase 2 completion checks passed.');
