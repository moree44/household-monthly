import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { GoalManager } from "@/features/goals/components/goal-manager";
import { PrivacyToggle } from "@/features/privacy/privacy";
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
      <div className="app-canvas-mid mx-auto min-h-screen max-w-[430px] bg-[#F5F5F5] px-4 pb-6 pt-5 shadow-2xl shadow-black/20 sm:min-h-0 sm:rounded-[30px] wide:max-w-none">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-[#0A0A0A]">Goals</h1>
          </div>
          <div className="flex items-center gap-2">
            <PrivacyToggle />
            <Link
              href="/dashboard"
              className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#262626] shadow-sm transition hover:bg-[#FAFAFA]"
              aria-label="Kembali ke dashboard"
            >
              <ArrowLeft size={19} strokeWidth={1.8} />
            </Link>
          </div>
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
