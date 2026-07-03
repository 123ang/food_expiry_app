import { describe, expect, it } from 'vitest';
import {
  computeEffectiveAccess,
  createEntitlementRepository,
  EntitlementRecord,
  RevenueCatEventRecord,
} from './entitlementRepository';

const now = new Date('2026-07-03T10:00:00.000Z');

class FakeDatabase {
  public queries: Array<{ text: string; params?: readonly unknown[] }> = [];
  private responses: Array<{ rows: unknown[]; rowCount: number }> = [];

  enqueue(rows: unknown[] = [], rowCount = rows.length) {
    this.responses.push({ rows, rowCount });
  }

  async query(text: string, params?: readonly unknown[]) {
    this.queries.push({ text, params });
    return this.responses.shift() || { rows: [], rowCount: 0 };
  }
}

const entitlement = (overrides: Partial<EntitlementRecord>): EntitlementRecord => ({
  id: 'entitlement-id',
  user_id: 'user-id',
  entitlement_key: 'premium',
  product_id: 'com.kevinsoon.expiryalert.premium.annual',
  provider: 'revenuecat',
  status: 'active',
  environment: 'sandbox',
  original_transaction_id: 'transaction-id',
  expires_at: new Date('2027-07-03T10:00:00.000Z'),
  will_renew: true,
  purchased_at: new Date('2026-07-03T10:00:00.000Z'),
  created_at: new Date('2026-07-03T10:00:00.000Z'),
  updated_at: new Date('2026-07-03T10:00:00.000Z'),
  ...overrides,
});

describe('computeEffectiveAccess', () => {
  it('uses family before premium and lifetime', () => {
    const access = computeEffectiveAccess([
      entitlement({ entitlement_key: 'personal_lifetime', expires_at: null, will_renew: false }),
      entitlement({ entitlement_key: 'premium' }),
      entitlement({ entitlement_key: 'family', product_id: 'com.kevinsoon.expiryalert.family.annual' }),
    ], now);

    expect(access.effective_plan).toBe('family');
    expect(access.active_entitlements).toEqual(['personal_lifetime', 'premium', 'family']);
  });

  it('falls back to personal lifetime when premium is expired', () => {
    const access = computeEffectiveAccess([
      entitlement({
        entitlement_key: 'premium',
        status: 'expired',
        expires_at: new Date('2026-01-01T00:00:00.000Z'),
        will_renew: false,
      }),
      entitlement({ entitlement_key: 'personal_lifetime', expires_at: null, will_renew: false }),
    ], now);

    expect(access.effective_plan).toBe('personal_lifetime');
    expect(access.active_entitlements).toEqual(['personal_lifetime']);
    expect(access.expires_at).toBeNull();
    expect(access.will_renew).toBe(false);
  });
});

describe('createEntitlementRepository', () => {
  it('records RevenueCat events idempotently', async () => {
    const database = new FakeDatabase();
    const repository = createEntitlementRepository(database);
    const event: RevenueCatEventRecord = {
      event_id: 'event-id',
      event_type: 'INITIAL_PURCHASE',
      app_user_id: 'user-id',
      environment: 'sandbox',
      payload: { event: { id: 'event-id' } },
    };

    database.enqueue([{ event_id: event.event_id }], 1);
    await expect(repository.recordRevenueCatEvent(event)).resolves.toBe(true);

    database.enqueue([], 0);
    await expect(repository.recordRevenueCatEvent(event)).resolves.toBe(false);

    expect(database.queries[0].text).toContain('ON CONFLICT (event_id) DO NOTHING');
    expect(database.queries[0].params).toEqual([
      event.event_id,
      event.event_type,
      event.app_user_id,
      event.environment,
      event.payload,
    ]);
  });
});
