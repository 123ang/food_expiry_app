import React from 'react';
import { Text, StyleSheet } from 'react-native';

interface LocationIconProps {
  iconName?: string;
  size?: number;
}

// Location emoji mapping for FontAwesome icon names
const LOCATION_EMOJIS: { [key: string]: string } = {
  // FontAwesome icon names from database
  'snowflake-o': '❄️',    // Fridge
  cube: '🧊',             // Freezer
  home: '🏠',             // Pantry
  archive: '🗄️',         // Cabinet
  
  // Additional common location names
  fridge: '❄️',
  freezer: '🧊',
  pantry: '🏠',
  cabinet: '🗄️',
  counter: '🍽️',
  basement: '⬇️',
  garage: '🏢',
  kitchen: '🍳',
  cupboard: '🗃️',
  shelf: '📚',
  storage: '📦',
  // Additional mappings to match settings and existing data
  office: '🏢',
  refrigerator: '❄️',
  room: '🏠',
  default: '📍',
};

const LocationIcon: React.FC<LocationIconProps> = ({ iconName, size = 24 }) => {
  // First try exact match, then lowercase match, then default
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
      emoji = '🗄️';
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