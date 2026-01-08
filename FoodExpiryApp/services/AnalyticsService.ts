import apiClient from './ApiClient';

export interface AnalyticsSummary {
  total_items: number;
  items_used: number;
  items_wasted: number;
  waste_percentage: number;
  total_waste_value: number;
  avg_days_before_expiry: number;
  period: {
    start: string;
    end: string;
  };
}

export interface CategoryBreakdown {
  category_id: string;
  category_name: string;
  total_events: number;
  used_count: number;
  wasted_count: number;
  waste_percentage: number;
  total_waste_value: number;
}

export interface MonthlyTrend {
  month: string;
  items_added: number;
  items_used: number;
  items_wasted: number;
  waste_percentage: number;
  total_waste_value: number;
}

class AnalyticsService {
  // Get waste summary
  async getSummary(groupId: string, months: number = 3): Promise<{ success: boolean; summary?: AnalyticsSummary; error?: string }> {
    const response = await apiClient.get<{ summary: AnalyticsSummary }>(`/analytics/summary?group_id=${groupId}&months=${months}`);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, summary: response.data!.summary };
  }

  // Get category breakdown
  async getCategoryBreakdown(groupId: string): Promise<{ success: boolean; breakdown?: CategoryBreakdown[]; error?: string }> {
    const response = await apiClient.get<{ breakdown: CategoryBreakdown[] }>(`/analytics/category-breakdown?group_id=${groupId}`);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, breakdown: response.data!.breakdown };
  }

  // Get monthly trends
  async getMonthlyTrends(groupId: string, months: number = 12): Promise<{ success: boolean; trends?: MonthlyTrend[]; error?: string }> {
    const response = await apiClient.get<{ trends: MonthlyTrend[] }>(`/analytics/monthly-trends?group_id=${groupId}&months=${months}`);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, trends: response.data!.trends };
  }

  // Get comprehensive analytics (all in one)
  async getComprehensive(groupId: string, months: number = 3): Promise<{ success: boolean; analytics?: any; error?: string }> {
    const response = await apiClient.get<{ analytics: any }>(`/analytics/comprehensive?group_id=${groupId}&months=${months}`);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, analytics: response.data!.analytics };
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;

