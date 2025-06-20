import React from 'react';
import { Text, StyleSheet } from 'react-native';

interface LocationIconProps {
  iconName?: string;
  size?: number;
}

// Location emoji mapping for FontAwesome icon names and direct emojis
const LOCATION_EMOJIS: { [key: string]: string } = {
  // New direct emoji mappings (from database)
  '❄️': '❄️',             // Fridge
  '🧊': '🧊',             // Freezer
  '🏠': '🏠',             // Pantry
  '📦': '📦',             // Cabinet
  
  // Legacy FontAwesome icon names (for backward compatibility)
  'snowflake-o': '❄️',    // Fridge
  cube: '🧊',             // Freezer
  home: '🏠',             // Pantry
  archive: '📦',          // Cabinet
  
  // Additional common location names
  fridge: '❄️',
  freezer: '🧊',
  pantry: '🏠',
  cabinet: '📦',
  counter: '🍽️',
  basement: '⬇️',
  garage: '🏢',
  kitchen: '🍳',
  cupboard: '🗃️',
  shelf: '📚',
  storage: '📦',
  office: '🏢',
  refrigerator: '❄️',
  room: '🏠',
  default: '📍',
};

const LocationIcon: React.FC<LocationIconProps> = ({ iconName, size = 24 }) => {
  // Handle null/undefined iconName
  if (!iconName) {
    return (
      <Text style={[styles.emoji, { fontSize: size }]}>
        {LOCATION_EMOJIS.default}
      </Text>
    );
  }

  // First check if it's already an emoji (improved Unicode detection)
  if (iconName && (
    // Check for common emoji ranges
    /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]/u.test(iconName) ||
    // Check for specific emojis we use
    ['❄️', '🧊', '🏠', '📦', '🍽️', '⬇️', '🏢', '🍳', '🗃️', '📚', '📍'].includes(iconName)
  )) {
    return (
      <Text style={[styles.emoji, { fontSize: size }]}>
        {iconName}
      </Text>
    );
  }
  
  // Otherwise use mapping
  let emoji = LOCATION_EMOJIS.default;
  
  if (iconName) {
    // Try exact match first
    if (LOCATION_EMOJIS[iconName]) {
      emoji = LOCATION_EMOJIS[iconName];
    } 
    // Try lowercase match
    else if (LOCATION_EMOJIS[iconName.toLowerCase()]) {
      emoji = LOCATION_EMOJIS[iconName.toLowerCase()];
    }
    // Try partial matches for common patterns
    else if (iconName.toLowerCase().includes('fridge') || iconName.toLowerCase().includes('refrigerator')) {
      emoji = '❄️';
    }
    else if (iconName.toLowerCase().includes('freezer') || iconName.toLowerCase().includes('frozen')) {
      emoji = '🧊';
    }
    else if (iconName.toLowerCase().includes('pantry') || iconName.toLowerCase().includes('kitchen')) {
      emoji = '🍳';
    }
    else if (iconName.toLowerCase().includes('cabinet') || iconName.toLowerCase().includes('cupboard')) {
      emoji = '📦';
    }
    else if (iconName.toLowerCase().includes('counter')) {
      emoji = '🍽️';
    }
    else if (iconName.toLowerCase().includes('storage') || iconName.toLowerCase().includes('room')) {
      emoji = '📦';
    }
  }
  
  return (
    <Text style={[styles.emoji, { fontSize: size }]}>
      {emoji}
    </Text>
  );
};

const styles = StyleSheet.create({
  emoji: {
    textAlign: 'center',
  },
});

export default LocationIcon; 
