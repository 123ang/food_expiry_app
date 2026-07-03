import { afterAll, afterEach } from 'vitest';
import { closeDatabase, setDatabaseForTesting } from '../config/database';

afterEach(() => {
  setDatabaseForTesting(undefined);
  delete process.env.REVENUECAT_SECRET_API_KEY;
  delete process.env.REVENUECAT_WEBHOOK_AUTHORIZATION;
});

afterAll(async () => {
  await closeDatabase();
});
