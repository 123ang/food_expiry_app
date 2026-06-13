# Food Expiry App Agent Instructions

The canonical monetization strategy lives in
`../expiry_alert_ios/MONETIZATION.md`. Read it before changing pricing,
purchase products, entitlements, cloud sync, notifications, photos, groups, or
sharing.

Hard rules:

- Personal Lifetime is $24.99-$29.99 and unlocks local personal features only.
- Premium is $1.99/month or $14.99/year for individual cloud services.
- Family is $24.99/year, subscription only, and never Lifetime.
- Cloud sync, cloud backup, server-side APNs, cloud photos, groups, and sharing
  require an active subscription.
- RevenueCat is recommended, with entitlement state stored and enforced by the
  backend.
- Never trust the local SQLite `subscription_type` as authorization.
- Existing `free | family` plan types are legacy migration work, not the
  approved entitlement model.
- Do not use deprecated USD40, USD57.92, or USD120 pricing.
- Native iOS monetization ships first. Android billing and web checkout remain
  deferred until the iOS launch proves demand.
