import bcrypt from "bcrypt";
import { PrismaClient, DiscountType, EventCategory, AdminRole } from "@prisma/client";

const prisma = new PrismaClient();

const templates = [
  { slug: "royal-gold", name: "Royal Gold", category: EventCategory.wedding, isPremium: true, price: 9900, priceUsd: 9900, priceEur: 11900 },
  { slug: "floral-garden", name: "Floral Garden", category: EventCategory.wedding, isPremium: true, price: 9900, priceUsd: 9900, priceEur: 11900 },
  { slug: "eternal-vows", name: "Eternal Vows", category: EventCategory.wedding, isPremium: true, price: 9900, priceUsd: 9900, priceEur: 11900 },
  { slug: "rustic-charm", name: "Rustic Charm", category: EventCategory.wedding, isPremium: true, price: 9900, priceUsd: 9900, priceEur: 11900 },
  { slug: "celestial-dreams", name: "Celestial Dreams", category: EventCategory.wedding, isPremium: true, price: 9900, priceUsd: 9900, priceEur: 11900 },
  { slug: "velvet-3d", name: "Velvet 3D", category: EventCategory.wedding, isPremium: true, price: 9900, priceUsd: 9900, priceEur: 11900 },
  { slug: "midnight-bloom", name: "Midnight Bloom", category: EventCategory.engagement, isPremium: true, price: 9900, priceUsd: 9900, priceEur: 11900 },
  { slug: "golden-ring", name: "Golden Ring", category: EventCategory.engagement, isPremium: true, price: 9900, priceUsd: 9900, priceEur: 11900 },
  { slug: "rose-garden", name: "Rose Garden", category: EventCategory.engagement, isPremium: true, price: 9900, priceUsd: 9900, priceEur: 11900 },
  { slug: "confetti-burst", name: "Confetti Burst", category: EventCategory.birthday, isPremium: true, price: 9900, priceUsd: 9900, priceEur: 11900 },
  { slug: "neon-glow", name: "Neon Glow", category: EventCategory.birthday, isPremium: true, price: 9900, priceUsd: 9900, priceEur: 11900 },
  { slug: "little-star", name: "Little Star", category: EventCategory.baby_shower, isPremium: true, price: 9900, priceUsd: 9900, priceEur: 11900 },
  { slug: "sweet-arrival", name: "Sweet Arrival", category: EventCategory.baby_shower, isPremium: true, price: 9900, priceUsd: 9900, priceEur: 11900 },
  { slug: "executive-edge", name: "Executive Edge", category: EventCategory.corporate, isPremium: true, price: 9900, priceUsd: 9900, priceEur: 11900 },
  { slug: "modern-summit", name: "Modern Summit", category: EventCategory.corporate, isPremium: true, price: 9900, priceUsd: 9900, priceEur: 11900 },
  { slug: "timeless-love", name: "Timeless Love", category: EventCategory.anniversary, isPremium: true, price: 9900, priceUsd: 9900, priceEur: 11900 },
];

const categories = [
  { slug: EventCategory.wedding, name: "Weddings", emoji: "💒", displayOrder: 1 },
  { slug: EventCategory.engagement, name: "Engagements", emoji: "💍", displayOrder: 2 },
  { slug: EventCategory.birthday, name: "Birthdays", emoji: "🎂", displayOrder: 3 },
  { slug: EventCategory.baby_shower, name: "Baby Showers", emoji: "👶", displayOrder: 4 },
  { slug: EventCategory.corporate, name: "Corporate", emoji: "🏢", displayOrder: 5 },
  { slug: EventCategory.anniversary, name: "Anniversaries", emoji: "💕", displayOrder: 6 },
];

const settings = {
  currency: "USD",
  max_gallery_photos: "10",
  max_rsvp_per_invite: "500",
  maintenance_mode: "false",
  allow_google_auth: "true",
  allow_email_auth: "true",
};

const promoCodes = [
  { code: "WELCOME10", discountType: DiscountType.percentage, discountValue: 10, isActive: true },
  { code: "SHYARA20", discountType: DiscountType.percentage, discountValue: 20, isActive: true },
  { code: "FLAT50", discountType: DiscountType.flat, discountValue: 200, isActive: true },
  { code: "NEWUSER", discountType: DiscountType.percentage, discountValue: 15, isActive: true },
  { code: "SAVE100", discountType: DiscountType.flat, discountValue: 500, isActive: true },
  { code: "RAZORPAY10", discountType: DiscountType.percentage, discountValue: 10, isActive: true },
];

async function main() {
  const adminPassword = await bcrypt.hash(process.env.ADMIN_SEED_PASSWORD || "admin123", 12);
  const supportPassword = await bcrypt.hash(process.env.SUPPORT_SEED_PASSWORD || "support123", 12);

  await prisma.adminUser.upsert({
    where: { email: "admin@shyara.co.in" },
    create: {
      name: "Admin User",
      email: "admin@shyara.co.in",
      passwordHash: adminPassword,
      role: AdminRole.admin,
    },
    update: {
      passwordHash: adminPassword,
      role: AdminRole.admin,
    },
  });

  await prisma.adminUser.upsert({
    where: { email: "support@shyara.co.in" },
    create: {
      name: "Support User",
      email: "support@shyara.co.in",
      passwordHash: supportPassword,
      role: AdminRole.support,
    },
    update: {
      passwordHash: supportPassword,
      role: AdminRole.support,
    },
  });

  const testPassword = await bcrypt.hash(process.env.TEST_USER_PASSWORD || "ShyaraTest@2024", 12);
  await prisma.user.upsert({
    where: { email: "test@invitesbyshyara.com" },
    create: {
      name: "Razorpay Test User",
      email: "test@invitesbyshyara.com",
      passwordHash: testPassword,
      status: "active",
      emailVerified: true,
      plan: "free",
    },
    update: { passwordHash: testPassword },
  });

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      create: { ...category, isVisible: true },
      update: {
        name: category.name,
        emoji: category.emoji,
        displayOrder: category.displayOrder,
        isVisible: true,
      },
    });
  }

  for (const [index, template] of templates.entries()) {
    await prisma.template.upsert({
      where: { slug: template.slug },
      create: {
        ...template,
        tags: [template.category, template.isPremium ? "premium" : "free"],
        isVisible: true,
        isFeatured: index < 5,
        sortOrder: index + 1,
      },
      update: {
        name: template.name,
        category: template.category,
        isPremium: template.isPremium,
        price: template.price,
        priceUsd: template.priceUsd,
        priceEur: template.priceEur,
        tags: [template.category, template.isPremium ? "premium" : "free"],
      },
    });
  }

  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }

  for (const promo of promoCodes) {
    await prisma.promoCode.upsert({
      where: { code: promo.code },
      create: {
        ...promo,
        appliesTo: "all",
        usageCount: 0,
      },
      update: {
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        isActive: promo.isActive,
      },
    });
  }

  console.log("Seed complete");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
