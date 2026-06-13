import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { UserManager } from "@/features/settings/components/user-manager";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export default async function UsersSettingsPage() {
  const currentUser = await requireUser();

  const [users, transactionCounts] = await Promise.all([
    prisma.user.findMany({
      orderBy: [
        {
          role: "asc"
        },
        {
          displayName: "asc"
        }
      ],
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        isActive: true
      }
    }),
    prisma.transaction.groupBy({
      by: ["createdById"],
      _count: {
        _all: true
      }
    })
  ]);

  const transactionCountByUserId = new Map(
    transactionCounts.map((count) => [count.createdById, count._count._all])
  );

  return (
    <main className="min-h-screen bg-[#262626] px-0 py-0 text-[#171717] sm:px-4 sm:py-6">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#F5F5F5] px-4 pb-6 pt-5 shadow-2xl shadow-black/20 sm:min-h-0 sm:rounded-[30px]">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-normal text-[#737373]">profile</p>
            <h1 className="text-lg font-bold text-[#0A0A0A]">Kelola Pengguna</h1>
            <p className="mt-1 text-sm text-[#737373]">User access</p>
          </div>
          <Link
            href="/profile"
            className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#262626] shadow-sm transition hover:bg-[#FAFAFA]"
            aria-label="Kembali ke profil"
          >
            <ArrowLeft size={19} strokeWidth={1.8} />
          </Link>
        </header>

        <UserManager
          users={users.map((user) => ({
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            role: user.role,
            isActive: user.isActive,
            transactionCount: transactionCountByUserId.get(user.id) ?? 0,
            isCurrentUser: user.id === currentUser.id
          }))}
        />

        <BottomNav active="profile" />
      </div>
    </main>
  );
}
