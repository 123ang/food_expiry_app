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
    title: 'emojiCategory.food',
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
      
      // Canned & Packaged Foods
      { key: '🥫', emoji: '🥫', label: 'Canned Goods' },
      
      // Frozen Foods
      { key: '🥶', emoji: '🥶', label: 'Frozen Products' },
      
      // Spices & Herbs
      { key: '🌿', emoji: '🌿', label: 'Herbs' },
      { key: '🌱', emoji: '🌱', label: 'Sprouts' },
      { key: '🍃', emoji: '🍃', label: 'Leaves' },
    ]
  },
  {
    title: 'emojiCategory.personalCare',
    icon: '💅',
    items: [
      { key: '💄', emoji: '💄', label: 'Makeup' },
      { key: '💅', emoji: '💅', label: 'Nail Polish' },
      { key: '💋', emoji: '💋', label: 'Lipstick' },
      { key: '👄', emoji: '👄', label: 'Lip Care' },
      { key: '👁️', emoji: '👁️', label: 'Eye Makeup' },
      { key: '🌞', emoji: '🌞', label: 'Sunscreen' },
      { key: '🧴', emoji: '🧴', label: 'Moisturizers & Lotions' },
      { key: '🧼', emoji: '🧼', label: 'Shampoo & Conditioner' },
      { key: '🧽', emoji: '🧽', label: 'Beauty Sponge' },
      { key: '🪒', emoji: '🪒', label: 'Razor' },
      { key: '🪥', emoji: '🪥', label: 'Toothbrush' },
      { key: '🦷', emoji: '🦷', label: 'Dental Care' },
      { key: '🧻', emoji: '🧻', label: 'Toilet Paper' },
      { key: '🌸', emoji: '🌸', label: 'Perfume' },
      { key: '🌺', emoji: '🌺', label: 'Floral Fragrance' },
      { key: '🌹', emoji: '🌹', label: 'Rose Products' },
      { key: '🧖', emoji: '🧖', label: 'Hair Treatment' },
      { key: '💆', emoji: '💆', label: 'Face Mask' },
    ]
  },
  {
    title: 'emojiCategory.medical',
    icon: '🏥',
    items: [
      { key: '💊', emoji: '💊', label: 'Medication' },
      { key: '🍀', emoji: '🍀', label: 'Vitamins & Supplements' },
      { key: '🩹', emoji: '🩹', label: 'First Aid' },
      { key: '🩺', emoji: '🩺', label: 'Stethoscope' },
      { key: '💉', emoji: '💉', label: 'Syringe' },
      { key: '🌡️', emoji: '🌡️', label: 'Thermometer' },
      { key: '🩼', emoji: '🩼', label: 'Crutch' },
      { key: '🦽', emoji: '🦽', label: 'Wheelchair' },
      { key: '🧬', emoji: '🧬', label: 'DNA' },
      { key: '🔬', emoji: '🔬', label: 'Microscope' },
      { key: '⚗️', emoji: '⚗️', label: 'Alembic' },
      { key: '⚕️', emoji: '⚕️', label: 'Medical Devices' },
      { key: '👓', emoji: '👓', label: 'Contact Lenses' },
      { key: '🩸', emoji: '🩸', label: 'Blood Test Kits' },
      { key: '🏥', emoji: '🏥', label: 'Hospital' },
      { key: '🚑', emoji: '🚑', label: 'Ambulance' },
      { key: '⛑️', emoji: '⛑️', label: 'Rescue Helmet' },
    ]
  },
  {
    title: 'emojiCategory.household',
    icon: '🏠',
    items: [
      { key: '🧺', emoji: '🧺', label: 'Laundry Detergent' },
      { key: '🧹', emoji: '🧹', label: 'Cleaning Supplies' },
      { key: '🪣', emoji: '🪣', label: 'Bucket' },
      { key: '🧯', emoji: '🧯', label: 'Safety Equipment' },
      { key: '🔋', emoji: '🔋', label: 'Batteries' },
      { key: '💡', emoji: '💡', label: 'Light Bulbs' },
      { key: '🕯️', emoji: '🕯️', label: 'Candles' },
      { key: '🔦', emoji: '🔦', label: 'Flashlight' },
      { key: '🪜', emoji: '🪜', label: 'Ladder' },
      { key: '🔨', emoji: '🔨', label: 'Hammer' },
      { key: '🪚', emoji: '🪚', label: 'Saw' },
      { key: '🪛', emoji: '🪛', label: 'Screwdriver' },
      { key: '⚡', emoji: '⚡', label: 'Electrical' },
    ]
  },
  {
    title: 'emojiCategory.chemical',
    icon: '⚗️',
    items: [
      { key: '🎨', emoji: '🎨', label: 'Paint' },
      { key: '🖌️', emoji: '🖌️', label: 'Paint Brush' },
      { key: '🖍️', emoji: '🖍️', label: 'Crayon' },
      { key: '🛢️', emoji: '🛢️', label: 'Oil Drum' },
      { key: '⛽', emoji: '⛽', label: 'Fuel' },
      { key: '🚗', emoji: '🚗', label: 'Car Products' },
      { key: '⚙️', emoji: '⚙️', label: 'Car Parts' },
      { key: '🛞', emoji: '🛞', label: 'Tire' },
      { key: '☢️', emoji: '☢️', label: 'Radioactive' },
      { key: '⚠️', emoji: '⚠️', label: 'Warning Chemical' },
    ]
  },
  {
    title: 'emojiCategory.other',
    icon: '📋',
    items: [
      { key: '💳', emoji: '💳', label: 'Credit Card' },
      { key: '🎁', emoji: '🎁', label: 'Gift Card' },
      { key: '🧾', emoji: '🧾', label: 'Receipt' },
      { key: '🏷️', emoji: '🏷️', label: 'Label' },
      { key: '🎟️', emoji: '🎟️', label: 'Ticket' },
      { key: '📱', emoji: '📱', label: 'Phone' },
      { key: '📋', emoji: '📋', label: 'Clipboard' },
      { key: '📝', emoji: '📝', label: 'Note' },
      { key: '📄', emoji: '📄', label: 'Document' },
      { key: '📊', emoji: '📊', label: 'Chart' },
      { key: '🎯', emoji: '🎯', label: 'Target' },
      { key: '⭐', emoji: '⭐', label: 'Star' },
      { key: '❤️', emoji: '❤️', label: 'Heart' },
      { key: '🔥', emoji: '🔥', label: 'Fire' },
      { key: '💎', emoji: '💎', label: 'Diamond' },
      { key: '🎪', emoji: '🎪', label: 'Circus' },
      { key: '🎭', emoji: '🎭', label: 'Theater' },
    ]
  }
];

// Location emojis for selection
export const LOCATION_EMOJIS: EmojiItem[] = [
  { key: '🧊', emoji: '🧊', label: 'Freezer' },
  { key: '❄️', emoji: '❄️', label: 'Fridge' },
  { key: '📦', emoji: '📦', label: 'Cabinet' },
  { key: '🏠', emoji: '🏠', label: 'Pantry' },
  { key: '🍽️', emoji: '🍽️', label: 'Dining Area' },
  { key: '📚', emoji: '📚', label: 'Storage Box' },
  { key: '🛒', emoji: '🛒', label: 'Shopping Cart' },
  { key: '🏪', emoji: '🏪', label: 'Store' },
  { key: '🧳', emoji: '🧳', label: 'Travel Bag' }
];

// Backward compatibility - flatten all category emojis into a single array
export const CATEGORY_EMOJIS: EmojiItem[] = EMOJI_CATEGORIES.flatMap(category => category.items);

// Helper functions
export const getCategoryEmojiByKey = (key: string): string => {
  // If the key is already an emoji, return it directly
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]|[\u{FE0F}]|[\u{200D}]/u;
  if (emojiRegex.test(key)) {
    return key;
  }
  
  // Try to find by key first
  const itemByKey = CATEGORY_EMOJIS.find(emoji => emoji.key === key);
  if (itemByKey) {
    return itemByKey.emoji;
  }
  
  // Also try to find by emoji value (for backward compatibility)
  const itemByEmoji = CATEGORY_EMOJIS.find(emoji => emoji.emoji === key);
  if (itemByEmoji) {
    return itemByEmoji.emoji;
  }
  
  return '🍎'; // Default to apple
};

export const getLocationEmojiByKey = (key: string): string => {
  // If the key is already an emoji, return it directly
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]|[\u{FE0F}]|[\u{200D}]/u;
  if (emojiRegex.test(key)) {
    return key;
  }
  
  // Try to find by key first
  const itemByKey = LOCATION_EMOJIS.find(emoji => emoji.key === key);
  if (itemByKey) {
    return itemByKey.emoji;
  }
  
  // Also try to find by emoji value (for backward compatibility)
  const itemByEmoji = LOCATION_EMOJIS.find(emoji => emoji.emoji === key);
  if (itemByEmoji) {
    return itemByEmoji.emoji;
  }
  
  return '❄️'; // Default to fridge
};

export const getCategoryLabelByEmoji = (emoji: string): string => {
  const item = CATEGORY_EMOJIS.find(item => item.emoji === emoji);
  return item ? item.label : 'Unknown';
};

export const getLocationLabelByEmoji = (emoji: string): string => {
  const item = LOCATION_EMOJIS.find(item => item.emoji === emoji);
  return item ? item.label : 'Unknown';
}; 
