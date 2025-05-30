import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert, Modal } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useDatabase } from '../context/DatabaseContext';
import { useTheme } from '../context/ThemeContext';
import { Header } from '../components/Header';
import { CategoryLocationCard } from '../components/CategoryLocationCard';
import { CategoryLocationForm } from '../components/CategoryLocationForm';
import { EmptyState } from '../components/EmptyState';
import { Category } from '../database/models';

export default function CategoriesScreen() {
  const { colors } = useTheme();
  const { 
    categories, 
    loading, 
    createCategory, 
    updateCategory, 
    deleteCategory,
    getCategoryItemCount,
  } = useDatabase();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle category creation
  const handleCreateCategory = async (values: Partial<Category>) => {
    setIsSubmitting(true);
    try {
      await createCategory(values as Category);
      setShowAddModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to create category');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle category update
  const handleUpdateCategory = async (values: Partial<Category>) => {
    if (!selectedCategory?.id) return;
    
    setIsSubmitting(true);
    try {
      await updateCategory({ ...values, id: selectedCategory.id } as Category);
      setShowEditModal(false);
      setSelectedCategory(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update category');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle category deletion
  const handleDeleteCategory = (category: Category) => {
    const itemCount = getCategoryItemCount(category.id!);
    
    if (itemCount > 0) {
      Alert.alert(
        'Cannot Delete',
        `This category contains ${itemCount} items. Please remove or reassign these items first.`
      );
      return;
    }
    
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(category.id!);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete category');
            }
          } 
        },
      ]
    );
  };

  // Open edit modal
  const openEditModal = (category: Category) => {
    setSelectedCategory(category);
    setShowEditModal(true);
  };

  // Render add/edit category modal
  const renderCategoryModal = (isEdit: boolean) => {
    const visible = isEdit ? showEditModal : showAddModal;
    const onClose = isEdit ? () => setShowEditModal(false) : () => setShowAddModal(false);
    const onSubmit = isEdit ? handleUpdateCategory : handleCreateCategory;
    const initialValues = isEdit ? selectedCategory : undefined;
    
    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.modalContainer}>
          <CategoryLocationForm
            type="category"
            initialValues={initialValues}
            onSubmit={onSubmit}
            onCancel={onClose}
            isLoading={isSubmitting}
          />
        </View>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        title="Categories" 
        showBackButton 
        onBackPress={() => router.back()} 
        rightIcon="plus"
        onRightIconPress={() => setShowAddModal(true)}
      />
      
      {categories.length === 0 && !loading ? (
        <EmptyState
          title="No Categories"
          message="Add categories to organize your food items."
          icon="tags"
          actionLabel="Add Category"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id!.toString()}
          renderItem={({ item }) => (
            <CategoryLocationCard
              item={item}
              itemCount={getCategoryItemCount(item.id!)}
              onPress={() => router.push(`/category/${item.id}`)}
              onEdit={() => openEditModal(item)}
              onDelete={() => handleDeleteCategory(item)}
              type="category"
            />
          )}
          numColumns={2}
          contentContainerStyle={styles.listContent}
        />
      )}
      
      {renderCategoryModal(false)} {/* Add modal */}
      {renderCategoryModal(true)} {/* Edit modal */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});