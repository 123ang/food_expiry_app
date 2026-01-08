import apiClient from './ApiClient';

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  is_default: boolean;
  group_id?: string;
  created_by?: string;
  created_at: string;
}

class CategoryService {
  // Get all categories (default + group-specific)
  async getCategories(groupId?: string): Promise<{ success: boolean; categories?: Category[]; error?: string }> {
    const url = groupId ? `/categories?group_id=${groupId}` : '/categories';
    const response = await apiClient.get<{ categories: Category[] }>(url);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, categories: response.data!.categories };
  }

  // Get category by ID
  async getCategory(categoryId: string): Promise<{ success: boolean; category?: Category; error?: string }> {
    const response = await apiClient.get<{ category: Category }>(`/categories/${categoryId}`);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, category: response.data!.category };
  }

  // Create custom category
  async createCategory(groupId: string, categoryData: { name: string; icon?: string; color?: string }): Promise<{ success: boolean; category?: Category; error?: string }> {
    const response = await apiClient.post<{ category: Category }>('/categories', {
      group_id: groupId,
      ...categoryData,
    });

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, category: response.data!.category };
  }

  // Update category
  async updateCategory(categoryId: string, updates: { name?: string; icon?: string; color?: string }): Promise<{ success: boolean; category?: Category; error?: string }> {
    const response = await apiClient.patch<{ category: Category }>(`/categories/${categoryId}`, updates);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, category: response.data!.category };
  }

  // Delete category
  async deleteCategory(categoryId: string): Promise<{ success: boolean; error?: string }> {
    const response = await apiClient.delete(`/categories/${categoryId}`);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true };
  }
}

export const categoryService = new CategoryService();
export default categoryService;

