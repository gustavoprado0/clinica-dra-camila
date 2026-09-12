import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // -------- Configurações da clínica --------
  const existingSettings = await prisma.clinicSettings.findFirst();
  if (existingSettings) {
    console.log('⚙️  Configurações já existem — mantidas');
  } else {
    const settings = await prisma.clinicSettings.create({
      data: {
        openHour: 8,
        closeHour: 19,
        slotMinutes: 60,
        weekdays: '1,2,3,4,5',
      },
    });
    console.log(`⚙️  Configurações criadas: ${settings.openHour}h-${settings.closeHour}h`);
  }

  // -------- Usuário: Dra. Camila --------
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
  console.log(`👩‍⚕️  User: ${camila.name} (${camila.email})`);

  // -------- Procedimentos padrão --------
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
