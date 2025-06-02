# Typography System for Food Expiry App

## Available Fonts

I've set up a modern typography system with 4 font options:

### 1. **Inter** (Current Default) - Modern & Clean
- Perfect for modern apps
- Excellent readability
- Used by companies like GitHub, Figma
- **Best for**: Professional, clean look

### 2. **Poppins** - Rounded & Friendly  
- Geometric sans-serif with rounded edges
- Very friendly and approachable
- Great for consumer apps
- **Best for**: Friendly, approachable feel

### 3. **Nunito** - Friendly & Readable
- Well-balanced, warm feeling
- Great readability at all sizes
- Popular for mobile apps
- **Best for**: Warm, welcoming apps

### 4. **System** - Default System Font
- Uses the device's default font
- Fastest loading
- Familiar to users
- **Best for**: Performance, familiarity

## How to Switch Fonts

### Quick Switch (Global)
Edit `foodexpiry/FoodExpiryApp/styles/typography.ts`:

```typescript
// Change this line (around line 52):
export const CURRENT_FONT_FAMILY = 'inter'; // Change to: 'poppins', 'nunito', or 'system'
```

### Typography Styles Available

The system provides consistent typography scales:

- **Headers**: `h1`, `h2`, `h3`, `h4`, `h5`, `h6`
- **Body**: `body1`, `body2`, `body3`  
- **UI Elements**: `button`, `buttonSmall`, `caption`, `label`, `navLabel`

### Usage in Components

```typescript
import { useTypography } from '../hooks/useTypography';

const MyComponent = () => {
  const typography = useTypography();
  
  return (
    <Text style={[typography.h2, { color: theme.textColor }]}>
      My Heading
    </Text>
  );
};
```

## Font Recommendations by App Style

- **🏢 Professional/Business**: Inter
- **😊 Friendly/Consumer**: Poppins  
- **🏠 Warm/Personal**: Nunito
- **⚡ Performance/Simple**: System

## Already Updated Components

The following components now use the new typography:
- ✅ Home page headers and text
- ✅ Navigation headers
- ✅ Category and location detail pages
- ✅ App layout headers

## Test Different Fonts

1. Open `styles/typography.ts`
2. Change `CURRENT_FONT_FAMILY` to different values:
   - `'inter'` - Clean, modern (current)
   - `'poppins'` - Rounded, friendly
   - `'nunito'` - Warm, readable
   - `'system'` - Device default
3. Restart the app to see changes
4. Compare how they feel in your app

## Performance Notes

- All fonts are loaded at app startup
- Inter is currently set as default (great choice!)
- System font loads fastest but may look different on different devices
- Google Fonts (Inter, Poppins, Nunito) ensure consistent look across devices

Enjoy your new typography! The app should feel much more polished and modern now. 🎨 