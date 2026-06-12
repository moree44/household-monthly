import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { GoalManager } from "@/features/goals/components/goal-manager";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export default async function GoalsPage() {
  await requireUser();

  const goals = await prisma.goal.findMany({
    orderBy: [
      {
        isActive: "desc"
      },
      {
        sortOrder: "asc"
      },
      {
        title: "asc"
      }
    ]
  });

  return (
    <main className="min-h-screen bg-[#262626] px-0 py-0 text-[#171717] sm:px-4 sm:py-6">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#F5F5F5] px-4 pb-6 pt-5 shadow-2xl shadow-black/20 sm:min-h-0 sm:rounded-[30px]">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-normal text-[#737373]">goals</p>
            <h1 className="text-lg font-bold text-[#0A0A0A]">Goals</h1>
            <p className="mt-1 text-sm text-[#737373]">Target tabungan</p>
          </div>
          <Link
            href="/dashboard"
            className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#262626] shadow-sm transition hover:bg-[#FAFAFA]"
            aria-label="Kembali ke dashboard"
          >
            <ArrowLeft size={19} strokeWidth={1.8} />
          </Link>
        </header>

        <GoalManager
          goals={goals.map((goal) => ({
            id: goal.id,
            title: goal.title,
            targetAmount: Number(goal.targetAmount),
            currentAmount: Number(goal.currentAmount),
            isActive: goal.isActive
          }))}
        />

        <BottomNav active="goals" />
      </div>
    </main>
  );
}
