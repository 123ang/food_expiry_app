// Mock implementation for expo-in-app-purchases
// TODO: Replace with actual expo-in-app-purchases when compatible version is available
// Canonical pricing/tiers live in ../../../expiry_alert_ios/MONETIZATION.md.
// Personal Lifetime is local-only. Premium/Family cloud features require an active
// subscription. Replace this mock with RevenueCat + server-side entitlements.
import { Platform } from 'react-native';

export interface PurchaseItem {
  id: string;
  title: string;
  description: string;
  price: string;
  priceAmount: number;
  currency: string;
}

export interface PurchaseResult {
  success: boolean;
  error?: string;
  transactionId?: string;
}

class InAppPurchaseService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Mock implementation - always succeed
      this.isInitialized = true;
    } catch (error) {
      console.error('InAppPurchaseService: Failed to connect to store:', error);
      throw error;
    }
  }

  async getProducts(): Promise<PurchaseItem[]> {
    await this.initialize();

    // Mock products aligned with the canonical catalog. Store configuration is
    // still the source of truth for localized prices at implementation time.
    return [
      {
        id: 'personal_lifetime',
        title: 'Personal Lifetime',
        description: 'Unlock local personal features forever; cloud services excluded',
        price: '$29.99',
        priceAmount: 29.99,
        currency: 'USD'
      },
      {
        id: 'premium_monthly',
        title: 'Premium Monthly',
        description: 'Individual cloud backup, sync, and server-side alerts',
        price: '$1.99',
        priceAmount: 1.99,
        currency: 'USD'
      },
      {
        id: 'premium_annual',
        title: 'Premium Annual',
        description: 'Recommended individual cloud subscription',
        price: '$14.99',
        priceAmount: 14.99,
        currency: 'USD'
      },
      {
        id: 'family_annual',
        title: 'Family Annual',
        description: 'Shared household cloud features for up to 6 members',
        price: '$24.99',
        priceAmount: 24.99,
        currency: 'USD'
      }
    ];
  }

  async purchaseProduct(productId: string): Promise<PurchaseResult> {
    await this.initialize();

    try {
      // Mock successful purchase
      return {
        success: true,
        transactionId: `mock_transaction_${Date.now()}`
      };
    } catch (error) {
      console.error('InAppPurchaseService: Error during purchase:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async restorePurchases(): Promise<PurchaseResult[]> {
    await this.initialize();

    try {
      // Mock restore - return empty array
      return [];
    } catch (error) {
      console.error('InAppPurchaseService: Error restoring purchases:', error);
      return [];
    }
  }

  async disconnect(): Promise<void> {
    try {
      // Mock disconnect
      this.isInitialized = false;
    } catch (error) {
      console.error('InAppPurchaseService: Error disconnecting from store:', error);
    }
  }
}

export const inAppPurchaseService = new InAppPurchaseService();
