// Migration script that only runs in production
const { execSync } = require('child_process');

if (process.env.NODE_ENV === 'production') {
  console.log('Running database migrations...');
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
} else {
  console.log('Skipping migrations in non-production environment');
}

