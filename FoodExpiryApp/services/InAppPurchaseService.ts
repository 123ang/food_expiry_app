// Mock implementation for expo-in-app-purchases
// TODO: Replace with actual expo-in-app-purchases when compatible version is available
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
      console.log('InAppPurchaseService: Mock connected to store');
    } catch (error) {
      console.error('InAppPurchaseService: Failed to connect to store:', error);
      throw error;
    }
  }

  async getProducts(): Promise<PurchaseItem[]> {
    await this.initialize();

    // Mock products
    return [
      {
        id: 'premium_package_annual',
        title: 'Premium Package Annual',
        description: 'Unlock all premium features for one year',
        price: '$57.92',
        priceAmount: 57.92,
        currency: 'USD'
      }
    ];
  }

  async purchaseProduct(productId: string): Promise<PurchaseResult> {
    await this.initialize();

    try {
      // Mock successful purchase
      console.log('InAppPurchaseService: Mock purchase successful for', productId);
      
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
      console.log('InAppPurchaseService: Mock restore purchases');
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
      console.log('InAppPurchaseService: Mock disconnected from store');
    } catch (error) {
      console.error('InAppPurchaseService: Error disconnecting from store:', error);
    }
  }
}

export const inAppPurchaseService = new InAppPurchaseService(); 