import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  const hashedPassword = await bcrypt.hash('camila123', 10);

  const camila = await prisma.user.upsert({
    where: { email: 'camila@clinica.com' },
    update: {},
    create: {
      name: 'Dra. Camila',
      email: 'camila@clinica.com',
      password: hashedPassword,
      role: 'admin',
    },
  });

  console.log(`👩‍⚕️  User criado: ${camila.name} (${camila.email})`);

  const procedures = [
    { name: 'Avaliação',   durationMin: 30, price: 0   },
    { name: 'Limpeza',     durationMin: 60, price: 180 },
    { name: 'Clareamento', durationMin: 90, price: 650 },
    { name: 'Restauração', durationMin: 60, price: 250 },
    { name: 'Extração',    durationMin: 60, price: 300 },
  ];

  for (const p of procedures) {
    const proc = await prisma.procedure.upsert({
      where: { name: p.name },
      update: {},
      create: p,
    });
    console.log(`🦷 Procedimento: ${proc.name} — R$ ${proc.price.toFixed(2)}`);
  }

  console.log('✅ Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
