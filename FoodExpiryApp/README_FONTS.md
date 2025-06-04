# Font Configuration for FoodExpiry App

This app now supports language-specific fonts to enhance the reading experience across different languages.

## Supported Fonts

### English (Merriweather)
- **Font**: [Merriweather](https://fonts.google.com/specimen/Merriweather) from Google Fonts
- **Status**: ✅ Automatically loaded via `@expo-google-fonts/merriweather`
- **Characteristics**: Classic serif font with excellent readability for English text

### Japanese (Shippori Mincho)
- **Font**: [Shippori Mincho](https://fontdasu.com/shippori-mincho/) 
- **Status**: ⚠️ Requires manual setup (see instructions below)
- **Characteristics**: Traditional Japanese serif font optimized for readability

### Chinese (Inter - Fallback)
- **Font**: Inter (fallback for now)
- **Status**: ✅ Loaded automatically
- **Note**: Can be upgraded to a Chinese-specific font later

## Font Loading System

The app uses a sophisticated font loading system:

1. **Language Detection**: Automatically detects the current app language
2. **Font Mapping**: Maps languages to appropriate fonts:
   - `en` → Merriweather
   - `ja` → Shippori Mincho
   - `zh` → Inter (fallback)
3. **Fallback Support**: Falls back to system fonts if custom fonts fail to load
4. **Typography Scaling**: Adjusts line heights for different scripts (Japanese gets 1.6x, Chinese 1.5x)

## Setup Instructions

### Automatic Setup (Current)
The Merriweather font is automatically installed and loaded. No additional setup required.

### Manual Setup for Shippori Mincho (Optional)

To enable the Shippori Mincho font for Japanese:

1. **Download Font Files**:
   - Visit [Shippori Mincho on Font Dasu](https://fontdasu.com/shippori-mincho/)
   - Download the font family (Regular, Medium, SemiBold, Bold variants)

2. **Add to Project**:
   ```
   foodexpiry/FoodExpiryApp/assets/fonts/
   ├── ShipporiMincho-Regular.otf
   ├── ShipporiMincho-Medium.otf
   ├── ShipporiMincho-SemiBold.otf
   └── ShipporiMincho-Bold.otf
   ```

3. **Enable Local Font Loading**:
   In `styles/fontLoader.ts`, uncomment this line:
   ```typescript
   await Font.loadAsync(LOCAL_CUSTOM_FONTS);
   ```

4. **Restart the App**:
   ```bash
   npm start -- --clear
   ```

## Usage in Components

### Automatic (Recommended)
The app automatically uses the correct font based on the current language:

```typescript
import { useTypography } from '../hooks/useTypography';
import { useLanguage } from '../context/LanguageContext';

function MyComponent() {
  const { language } = useLanguage();
  const typography = useTypography(undefined, language);
  
  return (
    <Text style={typography.h1}>This text uses the correct font!</Text>
  );
}
```

### Manual Font Selection
You can also manually specify a font family:

```typescript
const typography = useTypography('merriweather'); // Force Merriweather
const typography = useTypography('shippori');     // Force Shippori Mincho
```

## Typography Styles

The typography system provides these styles:
- `h1`, `h2`, `h3`, `h4`, `h5`, `h6` - Headers
- `body1`, `body2`, `body3` - Body text
- `button`, `buttonSmall` - Button text
- `caption`, `label` - Small text
- `navLabel` - Navigation labels

## Fallback Behavior

If fonts fail to load:
1. Shippori Mincho → Inter → System
2. Merriweather → Inter → System
3. App continues to function with system fonts

## Performance Notes

- Google Fonts (Merriweather, Inter) are loaded efficiently via Expo
- Custom fonts (Shippori Mincho) are loaded asynchronously
- Font loading is cached for subsequent app launches
- Typography is memoized and updates only when language changes 