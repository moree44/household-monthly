import { PrismaClient, UserRole, WalletType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString:
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/household_monthly"
});

const prisma = new PrismaClient({ adapter });

const categories = [
  "Belanja Dapur",
  "Food & Drink",
  "Daily Needs",
  "Bills",
  "Transport",
  "Health",
  "Entertainment",
  "Social",
  "Home Care",
  "Others"
];

const goals = [
  ["Dana Darurat", 10000000],
  ["Tabungan Rumah", 15000000]
] as const;

async function main() {
  const defaultPassword = await bcrypt.hash("password123", 12);

  await prisma.user.upsert({
    where: { username: "suami" },
    update: {},
    create: {
      username: "suami",
      displayName: "Suami",
      role: UserRole.admin,
      passwordHash: defaultPassword
    }
  });

  await prisma.user.upsert({
    where: { username: "istri" },
    update: {},
    create: {
      username: "istri",
      displayName: "Istri",
      role: UserRole.member,
      passwordHash: defaultPassword
    }
  });

  const wallets = [
    ["Kas Rumah Tangga", WalletType.operational],
    ["Dompet Istri", WalletType.wife],
    ["Tabungan Rumah", WalletType.home_setup],
    ["Dana Darurat", WalletType.emergency]
  ] as const;

  for (const [index, [name, type]] of wallets.entries()) {
    await prisma.wallet.upsert({
      where: { name },
      update: {},
      create: {
        name,
        type,
        sortOrder: index
      }
    });
  }

  const sourceAccounts = [
    ["BCA Suami", "suami"],
    ["SeaBank Suami", "suami"],
    ["BCA Istri", "istri"],
    ["SeaBank Istri", "istri"]
  ] as const;

  for (const [name, owner] of sourceAccounts) {
    await prisma.sourceAccount.upsert({
      where: { name },
      update: {},
      create: { name, owner }
    });
  }

  await prisma.category.updateMany({
    where: {
      name: {
        notIn: categories
      }
    },
    data: {
      isActive: false
    }
  });

  for (const [categoryIndex, categoryName] of categories.entries()) {
    await prisma.category.upsert({
      where: { name: categoryName },
      update: {
        sortOrder: categoryIndex,
        isDefault: true,
        isActive: true
      },
      create: {
        name: categoryName,
        sortOrder: categoryIndex,
        isDefault: true
      }
    });
  }

  for (const [goalIndex, [title, targetAmount]] of goals.entries()) {
    await prisma.goal.upsert({
      where: { title },
      update: {
        targetAmount,
        sortOrder: goalIndex,
        isActive: true
      },
      create: {
        title,
        targetAmount,
        sortOrder: goalIndex
      }
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
