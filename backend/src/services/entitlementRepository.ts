import { query as defaultQuery } from '../config/database';
import {
  EffectivePlan,
  Entitlement,
  EntitlementAccess,
  EntitlementEnvironment,
  EntitlementKey,
  EntitlementStatus,
  RevenueCatEvent,
} from '../models';

export type EntitlementRecord = Entitlement;
export type RevenueCatEventRecord = Pick<RevenueCatEvent, 'event_id' | 'event_type' | 'app_user_id' | 'environment' | 'payload'>;

interface QueryResultLike {
  rows: any[];
  rowCount: number | null;
}

export interface EntitlementQueryExecutor {
  query(text: string, params?: readonly unknown[]): Promise<QueryResultLike>;
}

export interface UpsertEntitlementInput {
  user_id: string;
  entitlement_key: EntitlementKey;
  product_id: string;
  provider?: 'revenuecat';
  status: EntitlementStatus;
  environment: EntitlementEnvironment;
  original_transaction_id?: string | null;
  expires_at?: Date | string | null;
  will_renew?: boolean;
  purchased_at?: Date | string | null;
}

const entitlementKeys: readonly EntitlementKey[] = ['personal_lifetime', 'premium', 'family'];
const effectivePriority: readonly EffectivePlan[] = ['family', 'premium', 'personal_lifetime'];
const activeStatuses: readonly EntitlementStatus[] = ['active', 'grace_period', 'billing_issue'];
const validStatuses: readonly EntitlementStatus[] = ['active', 'grace_period', 'billing_issue', 'expired', 'revoked'];

const isCurrent = (entitlement: EntitlementRecord, now: Date) => {
  if (!activeStatuses.includes(entitlement.status)) {
    return false;
  }

  if (!entitlement.expires_at) {
    return true;
  }

  return new Date(entitlement.expires_at).getTime() > now.getTime();
};

export const computeEffectiveAccess = (
  entitlements: readonly EntitlementRecord[],
  now = new Date()
): EntitlementAccess => {
  const currentEntitlements = entitlements.filter((entitlement) => isCurrent(entitlement, now));
  const activeEntitlements = entitlementKeys.filter((key) =>
    currentEntitlements.some((entitlement) => entitlement.entitlement_key === key)
  );
  const effectivePlan = effectivePriority.find((plan) => activeEntitlements.includes(plan as EntitlementKey)) || 'free_local';
  const effectiveEntitlement = currentEntitlements.find((entitlement) => entitlement.entitlement_key === effectivePlan);

  return {
    effective_plan: effectivePlan,
    active_entitlements: activeEntitlements,
    expires_at: effectiveEntitlement?.expires_at ? new Date(effectiveEntitlement.expires_at) : null,
    will_renew: effectiveEntitlement?.will_renew || false,
  };
};

const assertValidEntitlement = (input: UpsertEntitlementInput) => {
  if (!entitlementKeys.includes(input.entitlement_key)) {
    throw new Error(`Unknown entitlement_key: ${input.entitlement_key}`);
  }

  if (!validStatuses.includes(input.status)) {
    throw new Error(`Unknown entitlement status: ${input.status}`);
  }
};

export const createEntitlementRepository = (database: EntitlementQueryExecutor = { query: defaultQuery }) => ({
  async upsertEntitlement(input: UpsertEntitlementInput): Promise<EntitlementRecord> {
    assertValidEntitlement(input);

    const result = await database.query(
      `INSERT INTO entitlements (
        user_id,
        entitlement_key,
        product_id,
        provider,
        status,
        environment,
        original_transaction_id,
        expires_at,
        will_renew,
        purchased_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (user_id, entitlement_key, provider)
      DO UPDATE SET
        product_id = EXCLUDED.product_id,
        status = EXCLUDED.status,
        environment = EXCLUDED.environment,
        original_transaction_id = EXCLUDED.original_transaction_id,
        expires_at = EXCLUDED.expires_at,
        will_renew = EXCLUDED.will_renew,
        purchased_at = EXCLUDED.purchased_at,
        updated_at = NOW()
      RETURNING *`,
      [
        input.user_id,
        input.entitlement_key,
        input.product_id,
        input.provider || 'revenuecat',
        input.status,
        input.environment,
        input.original_transaction_id || null,
        input.expires_at || null,
        input.will_renew || false,
        input.purchased_at || null,
      ]
    );

    return result.rows[0] as EntitlementRecord;
  },

  async recordRevenueCatEvent(event: RevenueCatEventRecord): Promise<boolean> {
    const result = await database.query(
      `INSERT INTO revenuecat_events (
        event_id,
        event_type,
        app_user_id,
        environment,
        payload
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (event_id) DO NOTHING
      RETURNING event_id`,
      [event.event_id, event.event_type, event.app_user_id, event.environment, event.payload]
    );

    return (result.rowCount || 0) > 0;
  },

  async listEntitlementsForUser(
    userId: string,
    environment?: EntitlementEnvironment
  ): Promise<EntitlementRecord[]> {
    const params: unknown[] = [userId];
    const environmentClause = environment ? ' AND environment = $2' : '';

    if (environment) {
      params.push(environment);
    }

    const result = await database.query(
      `SELECT *
       FROM entitlements
       WHERE user_id = $1${environmentClause}
       ORDER BY created_at ASC`,
      params
    );

    return result.rows as EntitlementRecord[];
  },

  async getEffectiveAccessForUser(
    userId: string,
    environment?: EntitlementEnvironment,
    now = new Date()
  ): Promise<EntitlementAccess> {
    const entitlements = await this.listEntitlementsForUser(userId, environment);
    return computeEffectiveAccess(entitlements, now);
  },

  async markRevenueCatEventProcessed(eventId: string): Promise<void> {
    await database.query(
      `UPDATE revenuecat_events
       SET processed_at = NOW()
       WHERE event_id = $1`,
      [eventId]
    );
  },
});

export const entitlementRepository = createEntitlementRepository();
