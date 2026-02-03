import { PrismaClient, Role, ItemStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // --- USERS ---
  const password = await bcrypt.hash('zzzz', 10);

  const usersData = [
    { username: 'superadmin', name: 'Super Admin', role: Role.SUPERADMIN },
    { username: 'owner', name: 'Owner', role: Role.OWNER },
    { username: 'supervisor', name: 'Supervisor', role: Role.SUPERVISOR },
    { username: 'kasir', name: 'Kasir', role: Role.KASIR },
  ];

  for (const u of usersData) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {
        password: password, // Ensure password is updated if user exists
        role: u.role
      },
      create: {
        username: u.username,
        password: password,
        name: u.name,
        role: u.role,
      },
    });
    console.log(`User ${u.username} created/ensured.`);
  }


  // --- CUSTOMERS ---
  const customers = [
    { name: 'Budi Santoso', phone: '081234567890', address: 'Jl. Merdeka No. 1' },
    { name: 'Siti Aminah', phone: '081987654321', address: 'Jl. Sudirman No. 45' },
    { name: 'Andi Wijaya', phone: '081223344556', address: 'Jl. Ahmad Yani No. 10' },
  ];

  for (const c of customers) {
    await prisma.customer.upsert({
      where: { phone: c.phone },
      update: {},
      create: c
    });
  }
  console.log('Customers seeded.');


  // --- CATEGORIES ---
  const categories = ['Kebaya', 'Jas', 'Gaun', 'Kemeja', 'Celana'];
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('Categories seeded.');

  // --- BRANDS ---
  const brands = ['Zara', 'H&M', 'Uniqlo', 'Local Brand', 'Executive'];
  for (const name of brands) {
    await prisma.brand.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('Brands seeded.');

  // --- COLORS ---
  const colors = [
    { name: 'Merah', hex: '#FF0000' },
    { name: 'Putih', hex: '#FFFFFF' },
    { name: 'Hitam', hex: '#000000' },
    { name: 'Biru', hex: '#0000FF' },
    { name: 'Kuning', hex: '#FFFF00' },
    { name: 'Hijau', hex: '#00FF00' },
    { name: 'Abu-abu', hex: '#808080' },
    { name: 'Coklat', hex: '#A52A2A' }
  ];
  for (const c of colors) {
    await prisma.color.upsert({
      where: { name: c.name },
      update: {},
      create: { name: c.name, hexCode: c.hex },
    });
  }
  console.log('Colors seeded.');

  // --- SIZES ---
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  for (const name of sizes) {
    await prisma.size.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('Sizes seeded.');

  // --- PAYMENT METHODS ---
  const paymentMethods = [
    { name: 'Cash', type: 'CASH', account: '-' },
    { name: 'Transfer BCA', type: 'TRANSFER', account: '1234567890 a/n PT Rumah Dinar' },
    { name: 'Transfer Mandiri', type: 'TRANSFER', account: '0987654321 a/n PT Rumah Dinar' },
    { name: 'Payment Gateway - Duitku (automatic)', type: 'GATEWAY', account: 'N/A' }
  ];
  for (const pm of paymentMethods) {
    await prisma.paymentMethod.upsert({
      where: { name: pm.name },
      update: { type: pm.type as any, account: pm.account },
      create: {
        name: pm.name,
        type: pm.type as any,
        account: pm.account
      }
    });
  }
  console.log('PaymentMethods seeded.');

  // --- VIOLATION TYPES ---
  const violationTypes = [
    { name: 'Terlambat', defaultFine: 50000 },
    { name: 'Noda', defaultFine: 25000 },
    { name: 'Rusak Ringan', defaultFine: 100000 },
    { name: 'Rusak Berat', defaultFine: 500000 },
    { name: 'Hilang', defaultFine: 1000000 }
  ];
  for (const vt of violationTypes) {
    await prisma.violationType.upsert({
      where: { name: vt.name },
      update: {},
      create: vt
    });
  }
  console.log('ViolationTypes seeded.');

  // --- LAUNDRY PARTNERS ---
  const laundryPartners = [
    { name: 'Clean & Fresh Laundry', phone: '021-5551234', address: 'Jl. Laundry No. 1' },
    { name: 'Berkah Laundry', phone: '0812341234', address: 'Jl. Bersih No. 99' }
  ];
  for (const lp of laundryPartners) {
    const existing = await prisma.laundryPartner.findFirst({ where: { name: lp.name } });
    if (!existing) {
      await prisma.laundryPartner.create({ data: lp });
    }
  }
  console.log('LaundryPartners seeded.');

  // --- ITEMS & VARIANTS & INSTANCES ---

  const catKebaya = await prisma.category.findUnique({ where: { name: 'Kebaya' } });
  const brandLocal = await prisma.brand.findUnique({ where: { name: 'Local Brand' } });

  if (catKebaya && brandLocal) {
    const itemData = {
      name: 'Kebaya Modern Merah',
      categoryId: catKebaya.id,
      brandId: brandLocal.id,
      rentalPrice: 150000,
      description: 'Kebaya modern warna merah cantik',
    };

    // Check if item exists
    let item = await prisma.item.findFirst({ where: { name: itemData.name } });
    if (!item) {
      item = await prisma.item.create({ data: itemData });
    }

    // Create Variants
    const colorMerah = await prisma.color.findUnique({ where: { name: 'Merah' } });
    const sizeM = await prisma.size.findUnique({ where: { name: 'M' } });

    if (item && colorMerah && sizeM) {
      const variantData = {
        itemId: item.id,
        colorId: colorMerah.id,
        sizeId: sizeM.id
      };

      let variant = await prisma.itemVariant.findUnique({
        where: {
          itemId_sizeId_colorId: {
            itemId: item.id,
            sizeId: sizeM.id,
            colorId: colorMerah.id
          }
        }
      });

      if (!variant) {
        variant = await prisma.itemVariant.create({ data: variantData });
      }

      // Create Instances
      const skus = ['KMM-M-001', 'KMM-M-002', 'KMM-M-003'];
      for (const sku of skus) {
        await prisma.itemInstance.upsert({
          where: { sku },
          update: {},
          create: {
            sku,
            itemVariantId: variant.id,
            status: ItemStatus.AVAILABLE
          }
        });
      }
    }
  }

  // Create another item
  const catJas = await prisma.category.findUnique({ where: { name: 'Jas' } });
  const brandZara = await prisma.brand.findUnique({ where: { name: 'Zara' } });
  if (catJas && brandZara) {
    const itemJas = {
      name: 'Jas Hitam Formal',
      categoryId: catJas.id,
      brandId: brandZara.id,
      rentalPrice: 200000,
      description: 'Jas hitam formal elegan',
    };
    let item2 = await prisma.item.findFirst({ where: { name: itemJas.name } });
    if (!item2) item2 = await prisma.item.create({ data: itemJas });

    const colorHitam = await prisma.color.findUnique({ where: { name: 'Hitam' } });
    const sizeL = await prisma.size.findUnique({ where: { name: 'L' } });
    const sizeXL = await prisma.size.findUnique({ where: { name: 'XL' } }); // Add XL variant too

    if (item2 && colorHitam && sizeL) {
      let variant2 = await prisma.itemVariant.findUnique({
        where: { itemId_sizeId_colorId: { itemId: item2.id, sizeId: sizeL.id, colorId: colorHitam.id } }
      });
      if (!variant2) variant2 = await prisma.itemVariant.create({ data: { itemId: item2.id, sizeId: sizeL.id, colorId: colorHitam.id } });

      await prisma.itemInstance.upsert({
        where: { sku: 'JHF-L-001' },
        update: {},
        create: { sku: 'JHF-L-001', itemVariantId: variant2.id, status: ItemStatus.AVAILABLE }
      });
      await prisma.itemInstance.upsert({
        where: { sku: 'JHF-L-002' },
        update: {},
        create: { sku: 'JHF-L-002', itemVariantId: variant2.id, status: ItemStatus.RENTED } // One Rented
      });

      // Create a Transaction for this rented item
      const customer = await prisma.customer.findFirst();
      if (customer) {
        const transaction = await prisma.transaction.create({
          data: {
            type: 'BOOKING',
            customerId: customer.id,
            status: 'RENTED',
            pickupDate: new Date(),
            returnPlanDate: new Date(new Date().setDate(new Date().getDate() + 3)), // 3 days rental
            totalAmount: 200000,
            paidAmount: 200000,
            paymentStatus: 'PAID',
            items: {
              create: {
                itemInstanceSku: 'JHF-L-002',
                priceAtRental: 200000
              }
            }
          }
        });
        console.log(`Transaction seeded for rented item: ${transaction.id}`);
      }
    }

    if (item2 && colorHitam && sizeXL) {
      let variant3 = await prisma.itemVariant.findUnique({
        where: { itemId_sizeId_colorId: { itemId: item2.id, sizeId: sizeXL.id, colorId: colorHitam.id } }
      });
      if (!variant3) variant3 = await prisma.itemVariant.create({ data: { itemId: item2.id, sizeId: sizeXL.id, colorId: colorHitam.id } });

      await prisma.itemInstance.upsert({
        where: { sku: 'JHF-XL-001' },
        update: {},
        create: { sku: 'JHF-XL-001', itemVariantId: variant3.id, status: ItemStatus.AVAILABLE }
      });
    }
  }

  console.log('Items seeded.');

  // --- BROADCAST TEMPLATES ---
  const templates = [
    {
      name: 'Reminder Pickup',
      content: 'Halo {{name}}, \n\nPesanan Anda di Rumah Dinar sudah siap diambil hari ini. \nSilakan datang ke store kami untuk pengambilan.\n\nTerima kasih!'
    },
    {
      name: 'Reminder Return',
      content: 'Halo {{name}}, \n\nHari ini adalah jadwal pengembalian sewa Anda di Rumah Dinar. \nMohon kembalikan tepat waktu untuk menghindari denda keterlambatan.\n\nTerima kasih!'
    }
  ];

  for (const t of templates) {
    await prisma.broadcastTemplate.upsert({
      where: { name: t.name },
      update: {},
      create: t
    });
  }
  console.log('Broadcast Templates seeded.');

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
