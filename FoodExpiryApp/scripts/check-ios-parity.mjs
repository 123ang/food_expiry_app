import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path) => readFileSync(join(projectRoot, path), 'utf8');
const fail = (message) => {
  throw new Error(message);
};

const bottomNav = read('components/BottomNav.tsx');
const navBlock = bottomNav.match(/const navItems = \[([\s\S]*?)\];/);
if (!navBlock) fail('BottomNav navItems array was not found.');

const navPaths = [...navBlock[1].matchAll(/path: '([^']+)'/g)].map((match) => match[1]);
const expectedNavPaths = ['/', '/calendar', '/add', '/list', '/settings'];
if (JSON.stringify(navPaths) !== JSON.stringify(expectedNavPaths)) {
  fail(`BottomNav path order is ${JSON.stringify(navPaths)}, expected ${JSON.stringify(expectedNavPaths)}.`);
}

if (!bottomNav.includes('backgroundColor: theme.backgroundColor')) {
  fail('BottomNav container should use theme.backgroundColor like the iOS tab bar.');
}

if (!bottomNav.includes('paddingTop: 8')) {
  fail('BottomNav top padding should match the iOS tab bar top padding of 8.');
}

if (!bottomNav.includes('marginTop: -20')) {
  fail('BottomNav floating add button should sit at -20 like the iOS offset.');
}

const themeFile = read('theme/index.ts');
const expectedThemeKeys = [
  'original',
  'recycled',
  'darkBrown',
  'black',
  'blue',
  'green',
  'softPink',
  'brightPink',
  'naturalGreen',
  'mintRed',
  'darkGold',
];

const themeExportNames = {
  original: 'originalTheme',
  recycled: 'recycledTheme',
  darkBrown: 'darkBrownTheme',
  black: 'blackTheme',
  blue: 'blueTheme',
  green: 'greenTheme',
  softPink: 'softPinkTheme',
  brightPink: 'brightPinkTheme',
  naturalGreen: 'naturalGreenTheme',
  mintRed: 'mintRedTheme',
  darkGold: 'darkGoldTheme',
};

for (const key of expectedThemeKeys) {
  if (!themeFile.includes(`export const ${themeExportNames[key]}: Theme = {`)) {
    fail(`Theme object for ${key} was not found.`);
  }
}

const themeMapBlock = themeFile.match(/export const themes = \{([\s\S]*?)\};/);
if (!themeMapBlock) fail('Theme map was not found.');

const themeMapKeys = [...themeMapBlock[1].matchAll(/^\s+([a-zA-Z]+):/gm)].map((match) => match[1]);
if (JSON.stringify(themeMapKeys) !== JSON.stringify(expectedThemeKeys)) {
  fail(`Theme map order is ${JSON.stringify(themeMapKeys)}, expected ${JSON.stringify(expectedThemeKeys)}.`);
}

const themeObjects = [...themeFile.matchAll(/export const (\w+Theme): Theme = \{([\s\S]*?)\n\};/g)];
if (themeObjects.length !== expectedThemeKeys.length) {
  fail(`Found ${themeObjects.length} Theme objects, expected ${expectedThemeKeys.length}.`);
}

for (const [, themeName, body] of themeObjects) {
  if (!body.includes('placeholderColor:')) {
    fail(`${themeName} is missing placeholderColor from the iOS theme tokens.`);
  }
}

const dashboard = read('app/index.tsx');
for (const snippet of [
  "dashboardLane: {",
  "width: '100%'",
  "alignItems: 'stretch'",
  'styles.welcomeBanner, styles.dashboardLane',
  'styles.quickStats, styles.dashboardLane',
  'styles.locationGrid, styles.dashboardLane',
  'styles.sectionHeaderContainer',
  'categoryList: {',
]) {
  if (!dashboard.includes(snippet)) {
    fail(`Dashboard parity snippet missing: ${snippet}`);
  }
}

for (const styleName of ['statCard', 'locationCard', 'categoryCard']) {
  const block = dashboard.match(new RegExp(`${styleName}: \\{([\\s\\S]*?)\\n    \\},`));
  if (!block) fail(`${styleName} style block was not found.`);
  if (!block[1].includes('borderWidth: 1')) fail(`${styleName} should have a 1px iOS-style border.`);
  if (!block[1].includes('borderColor: theme.borderColor')) fail(`${styleName} should use theme.borderColor.`);
}

const rowFiles = [
  'components/ShoppingList.tsx',
  'components/WishList.tsx',
  'components/ListScreen.tsx',
];

for (const path of rowFiles) {
  const content = read(path);
  if (!content.includes('minHeight: 56')) {
    fail(`${path} row should keep the iOS 56px minimum tap target.`);
  }
  if (!content.includes('borderRadius: 22')) {
    fail(`${path} thumbnails should use 44px circular row media.`);
  }
  if (!content.includes("item.done ? 'checkmark-circle' : 'ellipse-outline'")) {
    fail(`${path} should use circular checkbox icons.`);
  }
}

for (const path of [
  'app/items/[status]/index.tsx',
  'app/categories/[id]/index.tsx',
  'app/locations/[id]/index.tsx',
]) {
  const content = read(path);
  for (const snippet of ['width: 44', 'height: 44', 'borderRadius: 22', 'paddingVertical: 10', 'paddingHorizontal: 12', 'minHeight: 64']) {
    if (!content.includes(snippet)) {
      fail(`${path} inventory row snippet missing: ${snippet}`);
    }
  }
}

const settingsScreen = read('app/settings.tsx');
for (const snippet of [
  'const settingsSections: SettingsSection[] = [',
  "t('settings.sectionAccountGroups')",
  "t('settings.sectionPreferences')",
  "t('settings.sectionManagement')",
  "t('settings.sectionData')",
  'styles.settingsSectionWrapper',
  'styles.settingsSectionTitle',
  "alignItems: 'stretch'",
]) {
  if (!settingsScreen.includes(snippet)) {
    fail(`Settings section parity snippet missing: ${snippet}`);
  }
}

const themeOptionsBlock = settingsScreen.match(/const themeOptions: ThemeTypeOption\[] = \[([\s\S]*?)\];/);
if (!themeOptionsBlock) fail('Settings themeOptions array was not found.');

const settingsThemeIds = [...themeOptionsBlock[1].matchAll(/id: '([^']+)'/g)].map((match) => match[1]);
if (JSON.stringify(settingsThemeIds) !== JSON.stringify(expectedThemeKeys)) {
  fail(`Settings theme picker order is ${JSON.stringify(settingsThemeIds)}, expected ${JSON.stringify(expectedThemeKeys)}.`);
}

for (const snippet of [
  'themeOptions.map(renderThemeOption)',
  'setTheme(themeOption.id)',
  't(themeOption.nameKey)',
  't(themeOption.descriptionKey)',
]) {
  if (!settingsScreen.includes(snippet)) {
    fail(`Settings theme picker parity snippet missing: ${snippet}`);
  }
}

for (const key of expectedThemeKeys) {
  if (settingsScreen.includes(`setTheme('${key}')`)) {
    fail(`Settings theme picker should use themeOptions instead of a hard-coded setTheme('${key}') row.`);
  }
}

for (const path of ['components/ShoppingList.tsx', 'components/WishList.tsx']) {
  const content = read(path);
  for (const snippet of [
    'ListEmptyComponent',
    'emptyListContent',
    'styles.emptyState',
    "t('list.tapAddToAddItem')",
  ]) {
    if (!content.includes(snippet)) {
      fail(`${path} empty-state snippet missing: ${snippet}`);
    }
  }
}

if (!read('components/ShoppingList.tsx').includes("t('shoppingList.noItems')")) {
  fail('ShoppingList empty state should use shoppingList.noItems.');
}

if (!read('components/WishList.tsx').includes("t('wishList.noItems')")) {
  fail('WishList empty state should use wishList.noItems.');
}

const translationFiles = ['en.ts', 'zh.ts', 'ja.ts', 'th.ts', 'ms.ts'];
const requiredTranslationKeys = [
  'settings.sectionAccountGroups',
  'settings.sectionPreferences',
  'settings.sectionManagement',
  'settings.sectionData',
  'list.tapAddToAddItem',
  'shoppingList.noItems',
  'wishList.noItems',
];

for (const translationFile of translationFiles) {
  const content = read(`translations/${translationFile}`);
  for (const key of requiredTranslationKeys) {
    if (!content.includes(`'${key}':`)) {
      fail(`translations/${translationFile} is missing ${key}.`);
    }
  }
}

console.log('iOS parity checks passed.');
