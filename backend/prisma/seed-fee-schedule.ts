/**
 * seed-fee-schedule.ts
 * Seed ADITIVO para fee schedule con códigos CDT comunes
 * NO elimina datos existentes
 *
 * Uso: npx ts-node -r tsconfig-paths/register prisma/seed-fee-schedule.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('💰 Seeding Fee Schedule (CDT codes)...\n');

  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { subdomain: 'drsmith' } });
  console.log(`✅ Tenant: ${tenant.name} (${tenant.id})`);

  // Check if fee schedule already exists
  const existing = await prisma.feeSchedule.findFirst({
    where: { tenantId: tenant.id, isDefault: true },
  });

  if (existing) {
    console.log('⚠️  Fee schedule ya existe, saltando...');
    return;
  }

  const feeSchedule = await prisma.feeSchedule.create({
    data: {
      tenantId: tenant.id,
      name: 'Tarifa Privada',
      description: 'Tarifa estándar para pacientes privados',
      isDefault: true,
      isActive: true,
    },
  });

  const cdtCodes = [
    // DIAGNOSTIC
    { cdtCode: 'D0120', procedureName: 'Evaluación Periódica', category: 'DIAGNOSTIC', fee: 45 },
    { cdtCode: 'D0140', procedureName: 'Evaluación de Emergencia', category: 'DIAGNOSTIC', fee: 75 },
    { cdtCode: 'D0150', procedureName: 'Evaluación Integral (Nuevo Paciente)', category: 'DIAGNOSTIC', fee: 85 },
    { cdtCode: 'D0210', procedureName: 'Radiografías Intraorales (Serie Completa)', category: 'DIAGNOSTIC', fee: 120 },
    { cdtCode: 'D0220', procedureName: 'Radiografía Periapical (Primera)', category: 'DIAGNOSTIC', fee: 25 },
    { cdtCode: 'D0230', procedureName: 'Radiografía Periapical (Adicional)', category: 'DIAGNOSTIC', fee: 20 },
    { cdtCode: 'D0270', procedureName: 'Radiografía Bitewing (Una)', category: 'DIAGNOSTIC', fee: 25 },
    { cdtCode: 'D0274', procedureName: 'Radiografías Bitewing (Cuatro)', category: 'DIAGNOSTIC', fee: 60 },
    { cdtCode: 'D0330', procedureName: 'Radiografía Panorámica', category: 'DIAGNOSTIC', fee: 100 },
    // PREVENTIVE
    { cdtCode: 'D1110', procedureName: 'Profilaxis Adulto', category: 'PREVENTIVE', fee: 95 },
    { cdtCode: 'D1120', procedureName: 'Profilaxis Niño', category: 'PREVENTIVE', fee: 65 },
    { cdtCode: 'D1206', procedureName: 'Aplicación de Flúor (Barniz)', category: 'PREVENTIVE', fee: 35 },
    { cdtCode: 'D1351', procedureName: 'Sellante por Diente', category: 'PREVENTIVE', fee: 45 },
    // RESTORATIVE
    { cdtCode: 'D2140', procedureName: 'Amalgama - 1 Superficie', category: 'RESTORATIVE', fee: 120 },
    { cdtCode: 'D2150', procedureName: 'Amalgama - 2 Superficies', category: 'RESTORATIVE', fee: 150 },
    { cdtCode: 'D2160', procedureName: 'Amalgama - 3 Superficies', category: 'RESTORATIVE', fee: 180 },
    { cdtCode: 'D2330', procedureName: 'Resina Compuesta - 1 Superficie (Anterior)', category: 'RESTORATIVE', fee: 150 },
    { cdtCode: 'D2331', procedureName: 'Resina Compuesta - 2 Superficies (Anterior)', category: 'RESTORATIVE', fee: 190 },
    { cdtCode: 'D2332', procedureName: 'Resina Compuesta - 3 Superficies (Anterior)', category: 'RESTORATIVE', fee: 230 },
    { cdtCode: 'D2391', procedureName: 'Resina Compuesta - 1 Superficie (Posterior)', category: 'RESTORATIVE', fee: 165 },
    { cdtCode: 'D2392', procedureName: 'Resina Compuesta - 2 Superficies (Posterior)', category: 'RESTORATIVE', fee: 210 },
    { cdtCode: 'D2393', procedureName: 'Resina Compuesta - 3 Superficies (Posterior)', category: 'RESTORATIVE', fee: 255 },
    { cdtCode: 'D2740', procedureName: 'Corona Porcelana/Cerámica', category: 'RESTORATIVE', fee: 900 },
    { cdtCode: 'D2750', procedureName: 'Corona Metal-Porcelana', category: 'RESTORATIVE', fee: 850 },
    { cdtCode: 'D2950', procedureName: 'Reconstrucción de Muñón', category: 'RESTORATIVE', fee: 250 },
    // ENDODONTICS
    { cdtCode: 'D3310', procedureName: 'Endodoncia - Anterior', category: 'ENDODONTICS', fee: 650 },
    { cdtCode: 'D3320', procedureName: 'Endodoncia - Premolar', category: 'ENDODONTICS', fee: 800 },
    { cdtCode: 'D3330', procedureName: 'Endodoncia - Molar', category: 'ENDODONTICS', fee: 1000 },
    { cdtCode: 'D3346', procedureName: 'Retratamiento Endodóntico - Anterior', category: 'ENDODONTICS', fee: 800 },
    { cdtCode: 'D3348', procedureName: 'Retratamiento Endodóntico - Molar', category: 'ENDODONTICS', fee: 1200 },
    // PERIODONTICS
    { cdtCode: 'D4341', procedureName: 'Raspado y Alisado Radicular (por cuadrante)', category: 'PERIODONTICS', fee: 250 },
    { cdtCode: 'D4342', procedureName: 'Raspado y Alisado (1-3 dientes)', category: 'PERIODONTICS', fee: 150 },
    { cdtCode: 'D4355', procedureName: 'Debridamiento Periodontal (Boca Completa)', category: 'PERIODONTICS', fee: 175 },
    { cdtCode: 'D4910', procedureName: 'Mantenimiento Periodontal', category: 'PERIODONTICS', fee: 150 },
    // PROSTHODONTICS
    { cdtCode: 'D5110', procedureName: 'Dentadura Completa (Maxilar)', category: 'PROSTHODONTICS', fee: 1500 },
    { cdtCode: 'D5120', procedureName: 'Dentadura Completa (Mandibular)', category: 'PROSTHODONTICS', fee: 1500 },
    { cdtCode: 'D5213', procedureName: 'Dentadura Parcial (Maxilar)', category: 'PROSTHODONTICS', fee: 1200 },
    { cdtCode: 'D5214', procedureName: 'Dentadura Parcial (Mandibular)', category: 'PROSTHODONTICS', fee: 1200 },
    { cdtCode: 'D6240', procedureName: 'Póntico - Porcelana/Cerámica', category: 'PROSTHODONTICS', fee: 900 },
    // SURGERY
    { cdtCode: 'D7140', procedureName: 'Extracción Simple', category: 'SURGERY', fee: 150 },
    { cdtCode: 'D7210', procedureName: 'Extracción Quirúrgica (Erupcionado)', category: 'SURGERY', fee: 300 },
    { cdtCode: 'D7220', procedureName: 'Extracción de Muela del Juicio (Tejido Blando)', category: 'SURGERY', fee: 350 },
    { cdtCode: 'D7230', procedureName: 'Extracción de Muela del Juicio (Parcial Óseo)', category: 'SURGERY', fee: 450 },
    { cdtCode: 'D7240', procedureName: 'Extracción de Muela del Juicio (Completo Óseo)', category: 'SURGERY', fee: 550 },
    // ORTHODONTICS
    { cdtCode: 'D8080', procedureName: 'Tratamiento Ortodóntico Integral (Adolescente)', category: 'ORTHODONTICS', fee: 5000 },
    { cdtCode: 'D8090', procedureName: 'Tratamiento Ortodóntico Integral (Adulto)', category: 'ORTHODONTICS', fee: 5500 },
    { cdtCode: 'D8660', procedureName: 'Evaluación Pre-Ortodóntica', category: 'ORTHODONTICS', fee: 250 },
    { cdtCode: 'D8670', procedureName: 'Ajuste Periódico de Aparatología', category: 'ORTHODONTICS', fee: 150 },
    // ADJUNCTIVE
    { cdtCode: 'D9110', procedureName: 'Tratamiento Paliativo de Emergencia', category: 'ADJUNCTIVE', fee: 100 },
    { cdtCode: 'D9215', procedureName: 'Anestesia Local', category: 'ADJUNCTIVE', fee: 50 },
    { cdtCode: 'D9230', procedureName: 'Sedación con Óxido Nitroso', category: 'ADJUNCTIVE', fee: 75 },
    { cdtCode: 'D9310', procedureName: 'Consulta (Evaluación por Especialista)', category: 'ADJUNCTIVE', fee: 100 },
    { cdtCode: 'D9430', procedureName: 'Tratamiento de Oficina para Estomatitis', category: 'ADJUNCTIVE', fee: 80 },
    // IMPLANTS
    { cdtCode: 'D6010', procedureName: 'Colocación de Implante Endoóseo', category: 'SURGERY', fee: 2000 },
    { cdtCode: 'D6058', procedureName: 'Pilar de Implante', category: 'PROSTHODONTICS', fee: 700 },
    { cdtCode: 'D6065', procedureName: 'Corona Sobre Implante (Porcelana)', category: 'PROSTHODONTICS', fee: 1200 },
  ];

  for (const item of cdtCodes) {
    await prisma.feeScheduleItem.create({
      data: {
        feeScheduleId: feeSchedule.id,
        ...item,
      },
    });
  }

  console.log(`\n✅ Fee Schedule creado: "${feeSchedule.name}"`);
  console.log(`   📋 ${cdtCodes.length} códigos CDT agregados`);
  console.log('═'.repeat(50));
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
