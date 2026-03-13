import bcrypt from "bcrypt";
import {
  AdminRole,
  DiscountType,
  EventCategory,
  PrismaClient,
} from "@prisma/client";

type SeedTemplate = {
  slug: string;
  name: string;
  category: EventCategory;
  isPremium: boolean;
  price: number;
  priceUsd: number;
  priceEur: number;
};

type SeedCategory = {
  slug: EventCategory;
  name: string;
  emoji: string;
  displayOrder: number;
};

type SeedPromoCode = {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  isActive: boolean;
};

export const DEFAULT_ADMIN_PASSWORD = "admin123";
export const DEFAULT_SUPPORT_PASSWORD = "support123";
export const DEFAULT_TEST_USER_PASSWORD = "ShyaraTest@2024";
export const TEST_USER_EMAIL = "test@invitesbyshyara.com";

const templates: SeedTemplate[] = [
  { slug: "rustic-charm", name: "Rustic Charm", category: EventCategory.wedding, isPremium: true, price: 400, priceUsd: 400, priceEur: 500 },
];

const categories: SeedCategory[] = [
  { slug: EventCategory.wedding, name: "Weddings", emoji: "\u{1F492}", displayOrder: 1 },
];

const settings = {
  currency: "USD",
  max_gallery_photos: "10",
  max_rsvp_per_invite: "500",
  maintenance_mode: "false",
  allow_google_auth: "true",
  allow_email_auth: "true",
};

const promoCodes: SeedPromoCode[] = [
  { code: "WELCOME10", discountType: DiscountType.percentage, discountValue: 10, isActive: true },
  { code: "SHYARA20", discountType: DiscountType.percentage, discountValue: 20, isActive: true },
  { code: "FLAT50", discountType: DiscountType.flat, discountValue: 200, isActive: true },
  { code: "NEWUSER", discountType: DiscountType.percentage, discountValue: 15, isActive: true },
  { code: "SAVE100", discountType: DiscountType.flat, discountValue: 500, isActive: true },
  { code: "RAZORPAY10", discountType: DiscountType.percentage, discountValue: 10, isActive: true },
];

export async function seedCore(prisma: PrismaClient) {
  const activeCategorySlugs = categories.map((category) => category.slug);
  const activeTemplateSlugs = templates.map((template) => template.slug);

  await prisma.category.deleteMany({
    where: {
      slug: { notIn: activeCategorySlugs },
    },
  });

  await prisma.template.updateMany({
    where: {
      slug: { notIn: activeTemplateSlugs },
    },
    data: {
      isVisible: false,
      isFeatured: false,
    },
  });

  await prisma.template.deleteMany({
    where: {
      slug: { notIn: activeTemplateSlugs },
      purchases: { none: {} },
      invites: { none: {} },
    },
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
        isFeatured: true,
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
        isVisible: true,
        isFeatured: true,
        sortOrder: index + 1,
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
}

export async function seedAdminUsers(
  prisma: PrismaClient,
  passwords: {
    admin: string;
    support: string;
  },
) {
  const adminPasswordHash = await bcrypt.hash(passwords.admin, 12);
  const supportPasswordHash = await bcrypt.hash(passwords.support, 12);

  await prisma.adminUser.upsert({
    where: { email: "admin@shyara.co.in" },
    create: {
      name: "Admin User",
      email: "admin@shyara.co.in",
      passwordHash: adminPasswordHash,
      role: AdminRole.admin,
    },
    update: {
      passwordHash: adminPasswordHash,
      role: AdminRole.admin,
    },
  });

  await prisma.adminUser.upsert({
    where: { email: "support@shyara.co.in" },
    create: {
      name: "Support User",
      email: "support@shyara.co.in",
      passwordHash: supportPasswordHash,
      role: AdminRole.support,
    },
    update: {
      passwordHash: supportPasswordHash,
      role: AdminRole.support,
    },
  });
}

export async function seedTestUser(prisma: PrismaClient, password: string) {
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email: TEST_USER_EMAIL },
    create: {
      name: "Razorpay Test User",
      email: TEST_USER_EMAIL,
      passwordHash,
      status: "active",
      emailVerified: true,
      plan: "free",
    },
    update: { passwordHash },
  });
}
