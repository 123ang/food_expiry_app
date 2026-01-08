import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { GroupService } from './groupService';

interface AnalyticsSummary {
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

interface CategoryBreakdown {
  category_id: string;
  category_name: string;
  total_events: number;
  used_count: number;
  wasted_count: number;
  waste_percentage: number;
  total_waste_value: number;
}

interface MonthlyTrend {
  month: string;
  items_added: number;
  items_used: number;
  items_wasted: number;
  waste_percentage: number;
  total_waste_value: number;
}

export class AnalyticsService {
  // Get waste summary for a group
  static async getWasteSummary(userId: string, groupId: string, startDate?: string, endDate?: string, months?: number): Promise<AnalyticsSummary> {
    // Check if user is member of the group
    const isMember = await GroupService.checkGroupPermission(groupId, userId);
    if (!isMember) {
      throw new AppError('Access denied to this group', 403);
    }

    // Calculate date range
    let start: string;
    let end: string;

    if (startDate && endDate) {
      start = startDate;
      end = endDate;
    } else {
      const monthsAgo = months || 3;
      end = new Date().toISOString().split('T')[0];
      const startDateObj = new Date();
      startDateObj.setMonth(startDateObj.getMonth() - monthsAgo);
      start = startDateObj.toISOString().split('T')[0];
    }

    const result = await query(
      `SELECT 
        COUNT(*) as total_items,
        COUNT(*) FILTER (WHERE event_type IN ('used_completely', 'used_partially')) as items_used,
        COUNT(*) FILTER (WHERE event_type IN ('thrown_away', 'expired_unused')) as items_wasted,
        ROUND(
          (COUNT(*) FILTER (WHERE event_type IN ('thrown_away', 'expired_unused'))::decimal / 
           NULLIF(COUNT(*), 0) * 100), 2
        ) as waste_percentage,
        COALESCE(SUM(price_at_disposal) FILTER (WHERE event_type IN ('thrown_away', 'expired_unused')), 0) as total_waste_value,
        ROUND(AVG(days_before_expiry) FILTER (WHERE event_type IN ('thrown_away', 'expired_unused')), 2) as avg_days_before_expiry
       FROM food_item_events
       WHERE group_id = $1 
         AND created_at >= $2::date 
         AND created_at <= $3::date`,
      [groupId, start, end]
    );

    const data = result.rows[0];

    return {
      total_items: parseInt(data.total_items) || 0,
      items_used: parseInt(data.items_used) || 0,
      items_wasted: parseInt(data.items_wasted) || 0,
      waste_percentage: parseFloat(data.waste_percentage) || 0,
      total_waste_value: parseFloat(data.total_waste_value) || 0,
      avg_days_before_expiry: parseFloat(data.avg_days_before_expiry) || 0,
      period: {
        start,
        end,
      },
    };
  }

  // Get category breakdown
  static async getCategoryBreakdown(userId: string, groupId: string, startDate?: string, endDate?: string): Promise<CategoryBreakdown[]> {
    // Check if user is member of the group
    const isMember = await GroupService.checkGroupPermission(groupId, userId);
    if (!isMember) {
      throw new AppError('Access denied to this group', 403);
    }

    // Calculate date range
    let start: string;
    let end: string;

    if (startDate && endDate) {
      start = startDate;
      end = endDate;
    } else {
      end = new Date().toISOString().split('T')[0];
      const startDateObj = new Date();
      startDateObj.setMonth(startDateObj.getMonth() - 3);
      start = startDateObj.toISOString().split('T')[0];
    }

    const result = await query(
      `SELECT 
        c.id as category_id,
        c.name as category_name,
        COUNT(*) as total_events,
        COUNT(*) FILTER (WHERE fie.event_type IN ('used_completely', 'used_partially')) as used_count,
        COUNT(*) FILTER (WHERE fie.event_type IN ('thrown_away', 'expired_unused')) as wasted_count,
        ROUND(
          (COUNT(*) FILTER (WHERE fie.event_type IN ('thrown_away', 'expired_unused'))::decimal / 
           NULLIF(COUNT(*), 0) * 100), 2
        ) as waste_percentage,
        COALESCE(SUM(fie.price_at_disposal) FILTER (WHERE fie.event_type IN ('thrown_away', 'expired_unused')), 0) as total_waste_value
       FROM food_item_events fie
       LEFT JOIN categories c ON fie.category_at_disposal = c.id
       WHERE fie.group_id = $1 
         AND fie.created_at >= $2::date 
         AND fie.created_at <= $3::date
       GROUP BY c.id, c.name
       HAVING COUNT(*) > 0
       ORDER BY waste_percentage DESC, total_events DESC`,
      [groupId, start, end]
    );

    return result.rows.map(row => ({
      category_id: row.category_id,
      category_name: row.category_name || 'Uncategorized',
      total_events: parseInt(row.total_events),
      used_count: parseInt(row.used_count),
      wasted_count: parseInt(row.wasted_count),
      waste_percentage: parseFloat(row.waste_percentage) || 0,
      total_waste_value: parseFloat(row.total_waste_value) || 0,
    }));
  }

  // Get location breakdown
  static async getLocationBreakdown(userId: string, groupId: string, startDate?: string, endDate?: string): Promise<any[]> {
    // Check if user is member of the group
    const isMember = await GroupService.checkGroupPermission(groupId, userId);
    if (!isMember) {
      throw new AppError('Access denied to this group', 403);
    }

    // Calculate date range
    let start: string;
    let end: string;

    if (startDate && endDate) {
      start = startDate;
      end = endDate;
    } else {
      end = new Date().toISOString().split('T')[0];
      const startDateObj = new Date();
      startDateObj.setMonth(startDateObj.getMonth() - 3);
      start = startDateObj.toISOString().split('T')[0];
    }

    const result = await query(
      `SELECT 
        l.id as location_id,
        l.name as location_name,
        COUNT(*) as total_events,
        COUNT(*) FILTER (WHERE fie.event_type IN ('used_completely', 'used_partially')) as used_count,
        COUNT(*) FILTER (WHERE fie.event_type IN ('thrown_away', 'expired_unused')) as wasted_count,
        ROUND(
          (COUNT(*) FILTER (WHERE fie.event_type IN ('thrown_away', 'expired_unused'))::decimal / 
           NULLIF(COUNT(*), 0) * 100), 2
        ) as waste_percentage,
        COALESCE(SUM(fie.price_at_disposal) FILTER (WHERE fie.event_type IN ('thrown_away', 'expired_unused')), 0) as total_waste_value
       FROM food_item_events fie
       LEFT JOIN locations l ON fie.location_at_disposal = l.id
       WHERE fie.group_id = $1 
         AND fie.created_at >= $2::date 
         AND fie.created_at <= $3::date
       GROUP BY l.id, l.name
       HAVING COUNT(*) > 0
       ORDER BY waste_percentage DESC, total_events DESC`,
      [groupId, start, end]
    );

    return result.rows.map(row => ({
      location_id: row.location_id,
      location_name: row.location_name || 'Unknown',
      total_events: parseInt(row.total_events),
      used_count: parseInt(row.used_count),
      wasted_count: parseInt(row.wasted_count),
      waste_percentage: parseFloat(row.waste_percentage) || 0,
      total_waste_value: parseFloat(row.total_waste_value) || 0,
    }));
  }

  // Get monthly trends
  static async getMonthlyTrends(userId: string, groupId: string, months: number = 12): Promise<MonthlyTrend[]> {
    // Check if user is member of the group
    const isMember = await GroupService.checkGroupPermission(groupId, userId);
    if (!isMember) {
      throw new AppError('Access denied to this group', 403);
    }

    const result = await query(
      `SELECT 
        TO_CHAR(DATE_TRUNC('month', fie.created_at), 'YYYY-MM') as month,
        COUNT(*) as items_added,
        COUNT(*) FILTER (WHERE fie.event_type IN ('used_completely', 'used_partially')) as items_used,
        COUNT(*) FILTER (WHERE fie.event_type IN ('thrown_away', 'expired_unused')) as items_wasted,
        ROUND(
          (COUNT(*) FILTER (WHERE fie.event_type IN ('thrown_away', 'expired_unused'))::decimal / 
           NULLIF(COUNT(*), 0) * 100), 2
        ) as waste_percentage,
        COALESCE(SUM(fie.price_at_disposal) FILTER (WHERE fie.event_type IN ('thrown_away', 'expired_unused')), 0) as total_waste_value
       FROM food_item_events fie
       WHERE fie.group_id = $1 
         AND fie.created_at >= CURRENT_DATE - INTERVAL '${months} months'
       GROUP BY DATE_TRUNC('month', fie.created_at)
       ORDER BY month ASC`,
      [groupId]
    );

    return result.rows.map(row => ({
      month: row.month,
      items_added: parseInt(row.items_added),
      items_used: parseInt(row.items_used),
      items_wasted: parseInt(row.items_wasted),
      waste_percentage: parseFloat(row.waste_percentage) || 0,
      total_waste_value: parseFloat(row.total_waste_value) || 0,
    }));
  }

  // Get most wasted items
  static async getMostWastedItems(userId: string, groupId: string, limit: number = 10): Promise<any[]> {
    // Check if user is member of the group
    const isMember = await GroupService.checkGroupPermission(groupId, userId);
    if (!isMember) {
      throw new AppError('Access denied to this group', 403);
    }

    const result = await query(
      `SELECT 
        fi.name as item_name,
        c.name as category_name,
        COUNT(*) as waste_count,
        COALESCE(SUM(fie.price_at_disposal), 0) as total_waste_value,
        ROUND(AVG(fie.days_before_expiry), 2) as avg_days_before_expiry
       FROM food_item_events fie
       JOIN food_items fi ON fie.food_item_id = fi.id
       LEFT JOIN categories c ON fi.category_id = c.id
       WHERE fie.group_id = $1 
         AND fie.event_type IN ('thrown_away', 'expired_unused')
         AND fie.created_at >= CURRENT_DATE - INTERVAL '6 months'
       GROUP BY fi.name, c.name
       ORDER BY waste_count DESC, total_waste_value DESC
       LIMIT $2`,
      [groupId, limit]
    );

    return result.rows.map(row => ({
      item_name: row.item_name,
      category_name: row.category_name || 'Uncategorized',
      waste_count: parseInt(row.waste_count),
      total_waste_value: parseFloat(row.total_waste_value) || 0,
      avg_days_before_expiry: parseFloat(row.avg_days_before_expiry) || 0,
    }));
  }

  // Get disposal reasons breakdown
  static async getDisposalReasons(userId: string, groupId: string): Promise<any[]> {
    // Check if user is member of the group
    const isMember = await GroupService.checkGroupPermission(groupId, userId);
    if (!isMember) {
      throw new AppError('Access denied to this group', 403);
    }

    const result = await query(
      `SELECT 
        disposal_reason,
        COUNT(*) as count,
        ROUND((COUNT(*)::decimal / SUM(COUNT(*)) OVER () * 100), 2) as percentage,
        COALESCE(SUM(price_at_disposal), 0) as total_value
       FROM food_item_events
       WHERE group_id = $1 
         AND event_type IN ('thrown_away', 'expired_unused')
         AND disposal_reason IS NOT NULL
         AND created_at >= CURRENT_DATE - INTERVAL '6 months'
       GROUP BY disposal_reason
       ORDER BY count DESC`,
      [groupId]
    );

    return result.rows.map(row => ({
      reason: row.disposal_reason,
      count: parseInt(row.count),
      percentage: parseFloat(row.percentage) || 0,
      total_value: parseFloat(row.total_value) || 0,
    }));
  }

  // Get expiry patterns (how many days before/after expiry items are discarded)
  static async getExpiryPatterns(userId: string, groupId: string): Promise<any> {
    // Check if user is member of the group
    const isMember = await GroupService.checkGroupPermission(groupId, userId);
    if (!isMember) {
      throw new AppError('Access denied to this group', 403);
    }

    const result = await query(
      `SELECT 
        COUNT(*) FILTER (WHERE days_before_expiry < -7) as discarded_very_late,
        COUNT(*) FILTER (WHERE days_before_expiry >= -7 AND days_before_expiry < 0) as discarded_after_expiry,
        COUNT(*) FILTER (WHERE days_before_expiry = 0) as discarded_on_expiry,
        COUNT(*) FILTER (WHERE days_before_expiry > 0 AND days_before_expiry <= 3) as discarded_near_expiry,
        COUNT(*) FILTER (WHERE days_before_expiry > 3) as discarded_well_before_expiry,
        ROUND(AVG(days_before_expiry), 2) as avg_days_before_expiry,
        ROUND(AVG(days_since_purchase), 2) as avg_days_since_purchase
       FROM food_item_events
       WHERE group_id = $1 
         AND event_type IN ('thrown_away', 'expired_unused')
         AND created_at >= CURRENT_DATE - INTERVAL '6 months'`,
      [groupId]
    );

    const data = result.rows[0];

    return {
      discarded_very_late: parseInt(data.discarded_very_late) || 0,
      discarded_after_expiry: parseInt(data.discarded_after_expiry) || 0,
      discarded_on_expiry: parseInt(data.discarded_on_expiry) || 0,
      discarded_near_expiry: parseInt(data.discarded_near_expiry) || 0,
      discarded_well_before_expiry: parseInt(data.discarded_well_before_expiry) || 0,
      avg_days_before_expiry: parseFloat(data.avg_days_before_expiry) || 0,
      avg_days_since_purchase: parseFloat(data.avg_days_since_purchase) || 0,
    };
  }

  // Get comprehensive analytics (all in one)
  static async getComprehensiveAnalytics(userId: string, groupId: string, months: number = 3): Promise<any> {
    const [summary, categoryBreakdown, locationBreakdown, monthlyTrends, mostWasted, disposalReasons, expiryPatterns] = await Promise.all([
      this.getWasteSummary(userId, groupId, undefined, undefined, months),
      this.getCategoryBreakdown(userId, groupId),
      this.getLocationBreakdown(userId, groupId),
      this.getMonthlyTrends(userId, groupId, months),
      this.getMostWastedItems(userId, groupId, 10),
      this.getDisposalReasons(userId, groupId),
      this.getExpiryPatterns(userId, groupId),
    ]);

    return {
      summary,
      category_breakdown: categoryBreakdown,
      location_breakdown: locationBreakdown,
      monthly_trends: monthlyTrends,
      most_wasted_items: mostWasted,
      disposal_reasons: disposalReasons,
      expiry_patterns: expiryPatterns,
    };
  }
}

