export interface CategoryThemeData {
  id: string;
  nameKey: string;
  descKey: string;
  icon: string;
  categories: Array<{
    translationKey: string;
    icon: string;
  }>;
}

export const ALL_THEMES: CategoryThemeData[] = [
  {
    id: 'food',
    nameKey: 'theme.food',
    descKey: 'theme.foodDesc',
    icon: '🍔',
    categories: [
      { translationKey: 'category.vegetables', icon: '🥕' },
      { translationKey: 'category.fruits', icon: '🍎' },
      { translationKey: 'category.dairy', icon: '🧀' },
      { translationKey: 'category.meat', icon: '🥩' },
      { translationKey: 'category.snacks', icon: '🥨' },
      { translationKey: 'category.desserts', icon: '🍰' },
      { translationKey: 'category.seafood', icon: '🦞' },
      { translationKey: 'category.bread', icon: '🍞' },
    ],
  },
  {
    id: 'health',
    nameKey: 'theme.health',
    descKey: 'theme.healthDesc',
    icon: '❤️',
    categories: [
      { translationKey: 'category.medications', icon: '💊' },
      { translationKey: 'category.vitamins', icon: '💪' },
      { translationKey: 'category.firstAid', icon: '🩹' },
      { translationKey: 'category.contactLenses', icon: '👁️' },
    ],
  },
  {
    id: 'beauty',
    nameKey: 'theme.beauty',
    descKey: 'theme.beautyDesc',
    icon: '💄',
    categories: [
      { translationKey: 'category.makeup', icon: '💅' },
      { translationKey: 'category.skincare', icon: '🧴' },
      { translationKey: 'category.hairCare', icon: '💇' },
      { translationKey: 'category.perfume', icon: '💨' },
    ],
  },
  {
    id: 'household',
    nameKey: 'theme.household',
    descKey: 'theme.householdDesc',
    icon: '🏠',
    categories: [
      { translationKey: 'category.cleaningSupplies', icon: '🧼' },
      { translationKey: 'category.laundryProducts', icon: '🧺' },
      { translationKey: 'category.batteries', icon: '🔋' },
    ],
  },
];

export const getTranslatedThemes = (t: (key: string) => string) => {
  return ALL_THEMES.map((theme) => ({
    id: theme.id,
    name: t(theme.nameKey),
    description: t(theme.descKey),
    icon: theme.icon,
    categories: theme.categories.map((cat) => ({
      name: t(cat.translationKey),
      icon: cat.icon,
      translationKey: cat.translationKey,
    })),
  }));
}; 