import { prisma } from '../src/config/database';
import { hash } from 'bcryptjs';

async function main() {
  console.log('🌱 Seeding database...\n');

  // Create admin user
  const adminHash = await hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminHash,
      fullName: 'Administrador del Sistema',
      role: 'admin',
    },
  });

  // Create support user
  const supportHash = await hash('support123', 10);
  const support = await prisma.user.upsert({
    where: { username: 'soporte' },
    update: {},
    create: {
      username: 'soporte',
      passwordHash: supportHash,
      fullName: 'Soporte Técnico',
      role: 'support',
    },
  });

  // Create guard users
  const guardHash = await hash('guard123', 10);
  const guard1 = await prisma.user.upsert({
    where: { username: 'vigilante' },
    update: {},
    create: {
      username: 'vigilante',
      passwordHash: guardHash,
      fullName: 'Carlos García',
      role: 'guard',
    },
  });

  const guard2 = await prisma.user.upsert({
    where: { username: 'vigilante2' },
    update: {},
    create: {
      username: 'vigilante2',
      passwordHash: guardHash,
      fullName: 'María López',
      role: 'guard',
    },
  });

  console.log('✅ Users created:');
  console.log(`   Admin:      ${admin.username} / admin123`);
  console.log(`   Support:    ${support.username} / support123`);
  console.log(`   Guard 1:     ${guard1.username} / guard123`);
  console.log(`   Guard 2:     ${guard2.username} / guard123`);
  console.log('\n🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
