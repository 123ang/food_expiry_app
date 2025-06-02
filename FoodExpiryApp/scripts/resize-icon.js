const sharp = require('sharp');
const path = require('path');

async function resizeAdaptiveIcon() {
  try {
    const inputPath = path.join(__dirname, '../assets/food_expiry_logo_adaptive.png');
    const outputPath = path.join(__dirname, '../assets/food_expiry_logo_adaptive_resized.png');
    
    // Get the current image info
    const metadata = await sharp(inputPath).metadata();
    console.log('Current image dimensions:', metadata.width, 'x', metadata.height);
    
    // For Android adaptive icons:
    // - Canvas: 1024x1024
    // - Safe area: ~66% (676x676)
    // - We'll use 60% to add more padding (614x614)
    const canvasSize = 1024;
    const logoSize = Math.floor(canvasSize * 0.6); // 614px
    const padding = Math.floor((canvasSize - logoSize) / 2); // 205px
    
    console.log(`Resizing logo to ${logoSize}x${logoSize} with ${padding}px padding`);
    
    await sharp(inputPath)
      .resize(logoSize, logoSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
      })
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputPath);
    
    console.log('✅ Adaptive icon resized successfully!');
    console.log('New file saved as:', outputPath);
    console.log('Replace the original file with this resized version.');
    
  } catch (error) {
    console.error('Error resizing icon:', error);
  }
}

resizeAdaptiveIcon(); 