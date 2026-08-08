import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@halqil.uz';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin1234!';
  const hash = await bcrypt.hash(adminPassword, 10);
  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'SUPER_ADMIN', password: hash, name: 'Admin' },
    create: {
      name: 'Admin',
      email: adminEmail,
      password: hash,
      role: 'SUPER_ADMIN',
      walletId: '09876543210987654321',
    },
  });
  console.log('SUCCESS:', user.email, '|', user.role);
  await prisma.$disconnect();
}

main().catch(console.error);
