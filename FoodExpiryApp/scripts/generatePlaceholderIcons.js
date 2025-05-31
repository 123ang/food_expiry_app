// Script to generate placeholder icon files
// Run this in Node.js to create simple colored PNG placeholders

const fs = require('fs');
const path = require('path');

// Create directories if they don't exist
const categoriesDir = path.join(__dirname, '../assets/icons/categories');
const locationsDir = path.join(__dirname, '../assets/icons/locations');

if (!fs.existsSync(categoriesDir)) {
  fs.mkdirSync(categoriesDir, { recursive: true });
}

if (!fs.existsSync(locationsDir)) {
  fs.mkdirSync(locationsDir, { recursive: true });
}

// Category icons to create
const categoryIcons = [
  'apple', 'dairy', 'fruits', 'vegetables', 'meat', 
  'bread', 'beverages', 'snacks', 'frozen', 'canned'
];

// Location icons to create
const locationIcons = [
  'fridge', 'freezer', 'pantry', 'cabinet', 
  'counter', 'basement', 'garage', 'office'
];

// Simple SVG to PNG conversion helper
function createSimplePlaceholder(name, color, outputPath) {
  // Create a simple SVG content
  const svgContent = `
    <svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" fill="${color}" rx="8"/>
      <text x="32" y="40" text-anchor="middle" fill="white" font-family="Arial" font-size="10" font-weight="bold">
        ${name.toUpperCase().substring(0, 3)}
      </text>
    </svg>
  `;
  
  // Write SVG file (you can convert to PNG using tools or keep as SVG)
  fs.writeFileSync(outputPath.replace('.png', '.svg'), svgContent);
  
  console.log(`Created placeholder: ${name}`);
}

// Generate category icons
categoryIcons.forEach((name, index) => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'];
  const color = colors[index % colors.length];
  const outputPath = path.join(categoriesDir, `${name}.png`);
  createSimplePlaceholder(name, color, outputPath);
});

// Generate location icons
locationIcons.forEach((name, index) => {
  const colors = ['#74B9FF', '#00B894', '#FDCB6E', '#E17055', '#A29BFE', '#6C5CE7', '#FD79A8', '#E84393'];
  const color = colors[index % colors.length];
  const outputPath = path.join(locationsDir, `${name}.png`);
  createSimplePlaceholder(name, color, outputPath);
});

console.log('Placeholder icons generated!');
console.log('Note: These are SVG files. For PNG, use a converter or image editing tool.');
console.log('For production, use high-quality custom icons or icon packs.'); 