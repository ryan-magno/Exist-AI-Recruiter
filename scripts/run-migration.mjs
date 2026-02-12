#!/usr/bin/env node

/**
 * Database Migration Runner
 * Run this script to apply database migrations without restarting the app
 * Usage: node scripts/run-migration.mjs
 */

const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';

async function runMigration() {
  console.log('🔄 Running database migrations...');
  console.log(`API: ${API_URL}`);
  
  try {
    const response = await fetch(`${API_URL}/migrate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Migration failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Migration completed successfully!');
    console.log(result);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
