import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL
    }
  }
});

async function main() {
  console.log('Terminating deadlocked connections on Supabase...');
  try {
    const result = await prisma.$executeRawUnsafe(`
      SELECT pg_terminate_backend(pid) 
      FROM pg_stat_activity 
      WHERE pid <> pg_backend_pid() 
      AND datname = 'postgres';
    `);
    console.log('Terminated connections:', result);
  } catch (err) {
    console.error('Error terminating connections:', err);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
