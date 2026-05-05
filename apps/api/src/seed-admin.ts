import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Admin1234!', 10);
  const user = await prisma.user.upsert({
    where: { email: 'admin@halqil.uz' },
    update: { role: 'SUPER_ADMIN', password: hash, name: 'Admin' },
    create: {
      name: 'Admin',
      email: 'admin@halqil.uz',
      password: hash,
      role: 'SUPER_ADMIN',
    },
  });
  console.log('SUCCESS:', user.email, '|', user.role);
  await prisma.$disconnect();
}

main().catch(console.error);
