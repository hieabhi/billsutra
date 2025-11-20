/**
 * Environment Variable Validation
 * Ensures all required environment variables are present before starting the server
 * Industry Standard: Fail-fast approach to configuration errors
 */

export function validateEnvironment() {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_KEY',
    'NODE_ENV'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ FATAL ERROR: Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\n💡 Please check your .env file or environment configuration');
    process.exit(1);
  }

  // Validate URL format
  try {
    new URL(process.env.SUPABASE_URL);
  } catch (error) {
    console.error('❌ FATAL ERROR: Invalid SUPABASE_URL format');
    process.exit(1);
  }

  // Validate key lengths
  if (process.env.SUPABASE_ANON_KEY.length < 50) {
    console.error('❌ FATAL ERROR: SUPABASE_ANON_KEY appears to be invalid (too short)');
    process.exit(1);
  }

  if (process.env.SUPABASE_SERVICE_KEY.length < 50) {
    console.error('❌ FATAL ERROR: SUPABASE_SERVICE_KEY appears to be invalid (too short)');
    process.exit(1);
  }

  console.log('✅ Environment validation passed');
}
