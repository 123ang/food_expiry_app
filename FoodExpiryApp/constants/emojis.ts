// Emoji constants for the Food Expiry App
// All emoji arrays are centralized here for easy maintenance

export interface EmojiItem {
  key: string;
  emoji: string;
  label: string;
}

export interface EmojiCategory {
  title: string;
  icon: string;
  items: EmojiItem[];
}

// Category emojis organized by collapsible sections
export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    title: 'Food',
    icon: '🍎',
    items: [
      // Fruits
      { key: '🍎', emoji: '🍎', label: 'Apples' },
      { key: '🍏', emoji: '🍏', label: 'Green Apples' },
      { key: '🍐', emoji: '🍐', label: 'Pears' },
      { key: '🍊', emoji: '🍊', label: 'Oranges' },
      { key: '🍋', emoji: '🍋', label: 'Lemons' },
      { key: '🍌', emoji: '🍌', label: 'Bananas' },
      { key: '🍉', emoji: '🍉', label: 'Watermelon' },
      { key: '🍇', emoji: '🍇', label: 'Grapes' },
      { key: '🍓', emoji: '🍓', label: 'Strawberries' },
      { key: '🍈', emoji: '🍈', label: 'Melon' },
      { key: '🍒', emoji: '🍒', label: 'Cherries' },
      { key: '🍑', emoji: '🍑', label: 'Peaches' },
      { key: '🍍', emoji: '🍍', label: 'Pineapple' },
      { key: '🥭', emoji: '🥭', label: 'Mango' },
      { key: '🥥', emoji: '🥥', label: 'Coconut' },
      
      // Vegetables
      { key: '🍅', emoji: '🍅', label: 'Tomatoes' },
      { key: '🍆', emoji: '🍆', label: 'Eggplant' },
      { key: '🌽', emoji: '🌽', label: 'Corn' },
      { key: '🌶️', emoji: '🌶️', label: 'Peppers' },
      { key: '🥒', emoji: '🥒', label: 'Cucumber' },
      { key: '🥕', emoji: '🥕', label: 'Carrots' },
      { key: '🥔', emoji: '🥔', label: 'Potatoes' },
      { key: '🧄', emoji: '🧄', label: 'Garlic' },
      { key: '🧅', emoji: '🧅', label: 'Onions' },
      { key: '🥦', emoji: '🥦', label: 'Broccoli' },
      { key: '🌰', emoji: '🌰', label: 'Chestnuts' },
      
      // Bread & Grains
      { key: '🍞', emoji: '🍞', label: 'Bread' },
      { key: '🥖', emoji: '🥖', label: 'Baguette' },
      { key: '🥐', emoji: '🥐', label: 'Croissant' },
      { key: '🥯', emoji: '🥯', label: 'Bagel' },
      { key: '🥞', emoji: '🥞', label: 'Pancakes' },
      { key: '🥨', emoji: '🥨', label: 'Pretzel' },
      { key: '🍚', emoji: '🍚', label: 'Rice' },
      { key: '🍙', emoji: '🍙', label: 'Rice Ball' },
      
      // Prepared Foods
      { key: '🥗', emoji: '🥗', label: 'Salad' },
      { key: '🥪', emoji: '🥪', label: 'Sandwich' },
      { key: '🍛', emoji: '🍛', label: 'Curry' },
      { key: '🍜', emoji: '🍜', label: 'Ramen' },
      { key: '🍝', emoji: '🍝', label: 'Pasta' },
      { key: '🍣', emoji: '🍣', label: 'Sushi' },
      { key: '🍢', emoji: '🍢', label: 'Oden' },
      { key: '🍘', emoji: '🍘', label: 'Rice Cracker' },
      { key: '🌮', emoji: '🌮', label: 'Tacos' },
      { key: '🌯', emoji: '🌯', label: 'Burrito' },
      { key: '🍔', emoji: '🍔', label: 'Burger' },
      { key: '🍟', emoji: '🍟', label: 'Fries' },
      { key: '🌭', emoji: '🌭', label: 'Hot Dog' },
      { key: '🍕', emoji: '🍕', label: 'Pizza' },
      { key: '🥙', emoji: '🥙', label: 'Flatbread' },
      { key: '🥘', emoji: '🥘', label: 'Paella' },
      
      // Meat & Protein
      { key: '🍗', emoji: '🍗', label: 'Chicken' },
      { key: '🍖', emoji: '🍖', label: 'Meat' },
      { key: '🥓', emoji: '🥓', label: 'Bacon' },
      { key: '🥩', emoji: '🥩', label: 'Steak' },
      { key: '🐟', emoji: '🐟', label: 'Fish' },
      { key: '🍤', emoji: '🍤', label: 'Shrimp' },
      { key: '🦐', emoji: '🦐', label: 'Prawns' },
      { key: '🥚', emoji: '🥚', label: 'Eggs' },
      { key: '🍳', emoji: '🍳', label: 'Fried Egg' },
      
      // Dairy
      { key: '🥛', emoji: '🥛', label: 'Milk' },
      { key: '🧀', emoji: '🧀', label: 'Cheese' },
      { key: '🧈', emoji: '🧈', label: 'Butter' },
      
      // Snacks
      { key: '🍿', emoji: '🍿', label: 'Popcorn' },
      { key: '🥜', emoji: '🥜', label: 'Nuts' },
      
      // Desserts & Sweets
      { key: '🍪', emoji: '🍪', label: 'Cookies' },
      { key: '🍩', emoji: '🍩', label: 'Donuts' },
      { key: '🧁', emoji: '🧁', label: 'Cupcake' },
      { key: '🎂', emoji: '🎂', label: 'Birthday Cake' },
      { key: '🍰', emoji: '🍰', label: 'Cake' },
      { key: '🍫', emoji: '🍫', label: 'Chocolate' },
      { key: '🍬', emoji: '🍬', label: 'Candy' },
      { key: '🍭', emoji: '🍭', label: 'Lollipop' },
      { key: '🍦', emoji: '🍦', label: 'Ice Cream' },
      { key: '🍨', emoji: '🍨', label: 'Ice Cream Cup' },
      { key: '🍧', emoji: '🍧', label: 'Shaved Ice' },
      
      // Beverages
      { key: '☕', emoji: '☕', label: 'Coffee' },
      { key: '🍵', emoji: '🍵', label: 'Tea' },
      { key: '🍼', emoji: '🍼', label: 'Baby Bottle' },
      { key: '🥤', emoji: '🥤', label: 'Soft Drink' },
      { key: '🧃', emoji: '🧃', label: 'Juice Box' },
      { key: '🍶', emoji: '🍶', label: 'Sake' },
      { key: '🍻', emoji: '🍻', label: 'Beer Mugs' },
      { key: '🍺', emoji: '🍺', label: 'Beer' },
      { key: '🍷', emoji: '🍷', label: 'Wine' },
      { key: '🥂', emoji: '🥂', label: 'Champagne' },
      { key: '🍸', emoji: '🍸', label: 'Martini' },
      { key: '🍹', emoji: '🍹', label: 'Cocktail' },
      { key: '🥃', emoji: '🥃', label: 'Whiskey' },
      
      // Condiments & Seasonings
      { key: '🧂', emoji: '🧂', label: 'Salt' },
      { key: '🍯', emoji: '🍯', label: 'Honey' },
      
      // Kitchen Items
      { key: '🥣', emoji: '🥣', label: 'Bowl' },
    ]
  },
  {
    title: 'Personal Care & Beauty',
    icon: '💅',
    items: [
      { key: '💄', emoji: '💄', label: 'Makeup' },
      { key: '🌞', emoji: '🌞', label: 'Sunscreen' },
      { key: '🧴', emoji: '🧴', label: 'Moisturizers & Lotions' },
      { key: '🧼', emoji: '🧼', label: 'Shampoo & Conditioner' },
      { key: '🌸', emoji: '🌸', label: 'Perfume' },
      { key: '🧽', emoji: '🧽', label: 'Beauty Sponge' },
    ]
  },
  {
    title: 'Medical & Health',
    icon: '🏥',
    items: [
      { key: '💊', emoji: '💊', label: 'Medication' },
      { key: '🍀', emoji: '🍀', label: 'Vitamins & Supplements' },
      { key: '🩹', emoji: '🩹', label: 'First-aid Supplies' },
      { key: '👁️', emoji: '👁️', label: 'Contact Lenses & Solution' },
      { key: '🩸', emoji: '🩸', label: 'Blood Test' },
      { key: '🧪', emoji: '🧪', label: 'Test Tube' },
    ]
  },
  {
    title: 'Household Items',
    icon: '🏠',
    items: [
      { key: '🧺', emoji: '🧺', label: 'Laundry Detergent' },
      { key: '🔋', emoji: '🔋', label: 'Batteries' },
      { key: '🧯', emoji: '🧯', label: 'Fire Extinguisher' },
      { key: '🧹', emoji: '🧹', label: 'Cleaning Supplies' },
    ]
  },
  {
    title: 'Chemical & Automotive',
    icon: '⚗️',
    items: [
      { key: '🎨', emoji: '🎨', label: 'Paint' },
      { key: '🛢️', emoji: '🛢️', label: 'Oil Drum' },
      { key: '⛽', emoji: '⛽', label: 'Fuel' },
    ]
  },
  {
    title: 'Other',
    icon: '📋',
    items: [
      { key: '💳', emoji: '💳', label: 'Credit Card' },
      { key: '🎁', emoji: '🎁', label: 'Gift Card' },
      { key: '🧾', emoji: '🧾', label: 'Receipt' },
      { key: '🏷️', emoji: '🏷️', label: 'Label' },
      { key: '🎟️', emoji: '🎟️', label: 'Ticket' },
      { key: '📱', emoji: '📱', label: 'Phone' },
      { key: '🌱', emoji: '🌱', label: 'Plant' },
      { key: '🌿', emoji: '🌿', label: 'Leaves' }
    ]
  }
];

// Location emojis for selection
export const LOCATION_EMOJIS: EmojiItem[] = [
  { key: '🧊', emoji: '🧊', label: 'Freezer' },
  { key: '❄️', emoji: '❄️', label: 'Fridge' },
  { key: '📦', emoji: '📦', label: 'Cabinet' },
  { key: '🍱', emoji: '🍱', label: 'Lunch Box' },
  { key: '🥡', emoji: '🥡', label: 'Takeout Container' },
  { key: '🏠', emoji: '🏠', label: 'Pantry' },
  { key: '🍽️', emoji: '🍽️', label: 'Dining Area' },
  { key: '📚', emoji: '📚', label: 'Storage Box' },
  { key: '🛒', emoji: '🛒', label: 'Shopping Cart' }
];

// Backward compatibility - flatten all category emojis into a single array
export const CATEGORY_EMOJIS: EmojiItem[] = EMOJI_CATEGORIES.flatMap(category => category.items);

// Helper functions
export const getCategoryEmojiByKey = (key: string): string => {
  const item = CATEGORY_EMOJIS.find(emoji => emoji.key === key);
  return item ? item.emoji : '🍎'; // Default to apple
};

export const getLocationEmojiByKey = (key: string): string => {
  const item = LOCATION_EMOJIS.find(emoji => emoji.key === key);
  return item ? item.emoji : '❄️'; // Default to fridge
};

export const getCategoryLabelByEmoji = (emoji: string): string => {
  const item = CATEGORY_EMOJIS.find(item => item.emoji === emoji);
  return item ? item.label : 'Unknown';
};

export const getLocationLabelByEmoji = (emoji: string): string => {
  const item = LOCATION_EMOJIS.find(item => item.emoji === emoji);
  return item ? item.label : 'Unknown';
}; 