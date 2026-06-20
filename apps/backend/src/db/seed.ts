import { prisma } from './prisma';
import { registerUser } from '../services/authService';

async function main() {
  console.log('🌱 Seeding database...');
  try {
    await registerUser('demo@streambrws.com', 'Demo1234!', 'Demo User');
    console.log('✅ Demo user created: demo@streambrws.com / Demo1234!');
  } catch {
    console.log('ℹ️  Demo user already exists');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
