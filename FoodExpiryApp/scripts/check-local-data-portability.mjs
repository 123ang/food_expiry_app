import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path) => readFileSync(join(projectRoot, path), 'utf8');
const fail = (message) => {
  throw new Error(message);
};

const packageJson = read('package.json');
if (!packageJson.includes('"check:local-data-portability": "node scripts/check-local-data-portability.mjs"')) {
  fail('package.json is missing check:local-data-portability.');
}

const service = read('services/LocalDataPortabilityService.ts');
for (const snippet of [
  'LOCAL_EXPORT_SCHEMA_VERSION',
  'createLocalDataExport',
  'writeLocalDataExportFile',
  'importLocalDataExportFromJson',
  "food_items",
  "shopping_items",
  "wish_items",
  'INSERT OR REPLACE INTO',
]) {
  if (!service.includes(snippet)) {
    fail(`LocalDataPortabilityService snippet missing: ${snippet}`);
  }
}

const settings = read('app/settings.tsx');
for (const snippet of [
  'writeLocalDataExportFile',
  'importLocalDataExportFromJson',
  'handleExportLocalData',
  'handleImportLocalData',
  'renderImportModal',
  "t('settings.exportLocalData')",
  "t('settings.importLocalData')",
  "['clearExpired', 'clearUsed', 'exportLocal', 'importLocal']",
]) {
  if (!settings.includes(snippet)) {
    fail(`Settings local data portability snippet missing: ${snippet}`);
  }
}

const translationFiles = ['en.ts', 'zh.ts', 'ja.ts', 'th.ts', 'ms.ts'];
const requiredTranslationKeys = [
  'settings.exportLocalData',
  'settings.exportLocalDataDescription',
  'settings.importLocalData',
  'settings.importLocalDataDescription',
  'settings.exportLocalSuccessTitle',
  'settings.exportLocalSuccessMessage',
  'settings.importLocalTitle',
  'settings.importLocalInstructions',
  'settings.importLocalPlaceholder',
  'settings.importLocalConfirmTitle',
  'settings.importLocalConfirmMessage',
  'settings.importLocalSuccessTitle',
  'settings.importLocalSuccessMessage',
  'settings.importLocalError',
  'settings.importLocalButton',
];

for (const translationFile of translationFiles) {
  const content = read(`translations/${translationFile}`);
  for (const key of requiredTranslationKeys) {
    if (!content.includes(`'${key}':`)) {
      fail(`translations/${translationFile} is missing ${key}.`);
    }
  }
}

console.log('Local data portability checks passed.');
