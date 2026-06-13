import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { CategoryManager } from "@/features/settings/components/category-manager";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export default async function CategoriesSettingsPage() {
  await requireUser();

  const [categories, transactionCounts] = await Promise.all([
    prisma.category.findMany({
      orderBy: [
        {
          isActive: "desc"
        },
        {
          sortOrder: "asc"
        },
        {
          name: "asc"
        }
      ],
      select: {
        id: true,
        name: true,
        isActive: true,
        isDefault: true
      }
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: {
        categoryId: {
          not: null
        }
      },
      _count: {
        _all: true
      }
    })
  ]);

  const transactionCountByCategoryId = new Map(
    transactionCounts.flatMap((count) => (count.categoryId ? [[count.categoryId, count._count._all]] : []))
  );

  return (
    <main className="min-h-screen bg-[#262626] px-0 py-0 text-[#171717] sm:px-4 sm:py-6">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#F5F5F5] px-4 pb-6 pt-5 shadow-2xl shadow-black/20 sm:min-h-0 sm:rounded-[30px]">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-normal text-[#737373]">profile</p>
            <h1 className="text-lg font-bold text-[#0A0A0A]">Kelola Kategori</h1>
            <p className="mt-1 text-sm text-[#737373]">Category management</p>
          </div>
          <Link
            href="/profile"
            className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#262626] shadow-sm transition hover:bg-[#FAFAFA]"
            aria-label="Kembali ke profil"
          >
            <ArrowLeft size={19} strokeWidth={1.8} />
          </Link>
        </header>

        <CategoryManager
          categories={categories.map((category) => ({
            id: category.id,
            name: category.name,
            isActive: category.isActive,
            isDefault: category.isDefault,
            transactionCount: transactionCountByCategoryId.get(category.id) ?? 0
          }))}
        />

        <BottomNav active="profile" />
      </div>
    </main>
  );
}
