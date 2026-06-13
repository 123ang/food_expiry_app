# Food Expiry App (Expiry Alert)

Monorepo for the Expiry Alert product: Expo/React Native client (`FoodExpiryApp/`), Node/Express backend (`backend/`), and a legacy React web app (`web-app/`).

## Rules

- **Monetization/pricing/IAP work:** follow
  `../expiry_alert_ios/MONETIZATION.md` (canonical, approved 2026-06-13). If
  another note conflicts, the canonical iOS document wins.
- Approved products: Free Local, $24.99-$29.99 Personal Lifetime, $1.99/month
  Premium, $14.99/year Premium, and $24.99/year Family.
- Personal Lifetime is local-only. Cloud sync, cloud backup, server-side APNs,
  cloud photos, groups, and sharing require an active Premium or Family
  subscription.
- Family is annual subscription only and is never Lifetime.
- Entitlements live server-side in the backend, with RevenueCat recommended.
  Never authorize paid features from the local SQLite `subscription_type`.
- The current Expo `free | family` subscription types are legacy and must be
  migrated before billing implementation.
- `FoodExpiryApp/services/InAppPurchaseService.ts` is a mock product catalog,
  not real purchase validation.
- Platform sequencing: the SwiftUI app (`../expiry_alert_ios`) ships monetization first. This Expo app is the dormant future Android client — before any release, re-point `FoodExpiryApp/services/SyncService.ts` (currently a placeholder URL) at the live API and replace the mock IAP.
- `web-app/` is marketing/landing only; its Firebase rules are expired and the Firebase→PostgreSQL migration is unfinished. Do not build monetization there.
- `FoodExpiryApp/api/` (legacy PHP) is orphaned, insecure dead code — slated for deletion; do not extend it.
