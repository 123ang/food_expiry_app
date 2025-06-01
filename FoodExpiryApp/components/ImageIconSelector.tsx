import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native';

interface ImageIconSelectorProps {
  selectedIcon: string;
  onIconSelect: (iconName: string) => void;
  type: 'category' | 'location';
  placeholder?: string;
}

// Category emoji mapping with more variety
const CATEGORY_ICONS = {
  apple: '🍎',
  dairy: '🥛',
  fruits: '🍇',
  vegetables: '🥕',
  meat: '🥩',
  bread: '🍞',
  beverages: '🥤',
  snacks: '🍿',
  frozen: '🧊',
  canned: '🥫',
  grains: '🌾',
  seafood: '🐟',
  spices: '🌶️',
  dessert: '🍰',
};

// Location emoji mapping with more variety
const LOCATION_ICONS = {
  fridge: '❄️',
  freezer: '🧊',
  pantry: '🍳',
  cabinet: '🗄️',
  counter: '🍽️',
  basement: '⬇️',
  garage: '🏢',
  office: '🏢',
  kitchen: '🍳',
  storage: '📦',
};

const ImageIconSelector: React.FC<ImageIconSelectorProps> = ({
  selectedIcon,
  onIconSelect,
  type,
  placeholder = 'Select Icon',
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  
  const icons = type === 'category' ? CATEGORY_ICONS : LOCATION_ICONS;
  const iconNames = Object.keys(icons);
  
  const renderIconItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.iconItem}
      onPress={() => {
        onIconSelect(item);
        setModalVisible(false);
      }}
    >
      <Text style={styles.iconEmoji}>{icons[item as keyof typeof icons]}</Text>
      <Text style={styles.iconName}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <View>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.selectedIcon}>
          {selectedIcon ? (
            <>
              <Text style={styles.selectedEmoji}>
                {icons[selectedIcon as keyof typeof icons] || '❓'}
              </Text>
              <Text style={styles.selectedText}>{selectedIcon}</Text>
            </>
          ) : (
            <Text style={styles.placeholderText}>{placeholder}</Text>
          )}
        </View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select {type === 'category' ? 'Category' : 'Location'} Icon
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={iconNames}
              renderItem={renderIconItem}
              keyExtractor={(item) => item}
              numColumns={3}
              contentContainerStyle={styles.iconGrid}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  selector: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  selectedIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  selectedText: {
    fontSize: 16,
    color: '#333',
    textTransform: 'capitalize',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: Dimensions.get('window').width * 0.9,
    maxHeight: Dimensions.get('window').height * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  iconGrid: {
    paddingBottom: 20,
  },
  iconItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    margin: 4,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    minWidth: 80,
  },
  iconEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  iconName: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
});

export default ImageIconSelector; 