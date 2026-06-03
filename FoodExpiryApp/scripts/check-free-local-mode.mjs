import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path) => readFileSync(join(projectRoot, path), 'utf8');
const fail = (message) => {
  throw new Error(message);
};

const apiContext = read('context/ApiContext.tsx');
for (const snippet of [
  "export type ProductMode = 'local' | 'cloud'",
  'PRODUCT_MODE_STORAGE_KEY',
  'productMode: ProductMode',
  'isLocalMode: boolean',
  'isCloudMode: boolean',
  'startLocalMode: () => Promise<void>',
  "const [productMode, setProductModeState] = useState<ProductMode>('local')",
  "setProductMode('cloud')",
  'const startLocalMode = async () =>',
  'if (isLocalMode) {',
]) {
  if (!apiContext.includes(snippet)) {
    fail(`ApiContext Free Local Mode snippet missing: ${snippet}`);
  }
}

const home = read('app/index.tsx');
if (home.includes("router.replace('/auth/login')")) {
  fail('Home should not redirect unauthenticated users to login in Free Local Mode.');
}

for (const snippet of [
  'isLocalMode',
  'isCloudMode',
  'group_id: isLocalMode ? null : selectedGroupId',
  'if (isCloudMode && isAuthenticated && syncToServer)',
]) {
  if (!home.includes(snippet)) {
    fail(`Home Free Local Mode snippet missing: ${snippet}`);
  }
}

const login = read('app/auth/login.tsx');
for (const snippet of [
  'startLocalMode',
  'handleStartLocalMode',
  "t('login.continueLocal')",
  "t('login.localModeNote')",
]) {
  if (!login.includes(snippet)) {
    fail(`Login Free Local Mode snippet missing: ${snippet}`);
  }
}

const settings = read('app/settings.tsx');
for (const snippet of [
  'productMode',
  'isLocalMode',
  "t('settings.privateLocalMode')",
  "t('settings.privateLocalModeDescription')",
  "t('settings.cloudModeDescription')",
]) {
  if (!settings.includes(snippet)) {
    fail(`Settings Free Local Mode snippet missing: ${snippet}`);
  }
}

const translationFiles = ['en.ts', 'zh.ts', 'ja.ts', 'th.ts', 'ms.ts'];
const requiredTranslationKeys = [
  'login.continueLocal',
  'login.localModeNote',
  'settings.privateLocalMode',
  'settings.privateLocalModeDescription',
  'settings.cloudModeDescription',
  'settings.cloudSync',
  'settings.localModeInfoTitle',
  'settings.localModeInfoMessage',
];

for (const translationFile of translationFiles) {
  const content = read(`translations/${translationFile}`);
  for (const key of requiredTranslationKeys) {
    if (!content.includes(`'${key}':`)) {
      fail(`translations/${translationFile} is missing ${key}.`);
    }
  }
}

console.log('Free Local Mode checks passed.');
