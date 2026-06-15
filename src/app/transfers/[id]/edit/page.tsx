import Link from "next/link";
import { ArrowLeft, PencilLine } from "lucide-react";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { TransferForm } from "@/features/transactions/components/transfer-form";
import { requireUser } from "@/lib/auth/session";
import { formatAppDateInputValue } from "@/lib/date/timezone";
import { prisma } from "@/lib/db/prisma";

type EditTransferPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditTransferPage({ params }: EditTransferPageProps) {
  await requireUser();

  const { id } = await params;

  const [transaction, wallets] = await Promise.all([
    prisma.transaction.findFirst({
      where: {
        id,
        type: "transfer",
        deletedAt: null
      },
      select: {
        id: true,
        transactionDate: true,
        amount: true,
        fromWalletId: true,
        toWalletId: true,
        description: true
      }
    }),
    prisma.wallet.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        sortOrder: "asc"
      },
      select: {
        id: true,
        name: true
      }
    })
  ]);

  if (!transaction || !transaction.fromWalletId || !transaction.toWalletId) {
    redirect("/history");
  }

  return (
    <main className="min-h-screen bg-[#262626] px-0 py-0 text-[#171717] sm:px-4 sm:py-6">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#F5F5F5] px-4 pb-6 pt-5 shadow-2xl shadow-black/20 sm:min-h-0 sm:rounded-[30px]">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-normal text-[#737373]">koreksi transaksi</p>
            <h1 className="text-xl font-bold text-[#0A0A0A]">Edit Transfer</h1>
            <p className="mt-1 text-sm font-medium text-[#737373]">Ubah perpindahan saldo</p>
          </div>
          <Link
            href="/history"
            className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#262626] shadow-sm transition hover:bg-[#FAFAFA]"
            aria-label="Kembali ke history"
          >
            <ArrowLeft size={18} strokeWidth={1.75} />
          </Link>
        </header>

        <section className="mt-5 rounded-[22px] bg-white p-4 shadow-sm shadow-black/5">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-cyan-50 text-cyan-600">
              <PencilLine size={20} strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#171717]">Detail Transfer</h2>
              <p className="mt-1 text-sm font-medium text-[#737373]">
                Ubah detail perpindahan saldo antar wallet.
              </p>
            </div>
          </div>

          <TransferForm
            mode="edit"
            wallets={wallets}
            defaultDate={formatAppDateInputValue(transaction.transactionDate)}
            initialValues={{
              transactionId: transaction.id,
              amount: transaction.amount.toString(),
              fromWalletId: transaction.fromWalletId,
              toWalletId: transaction.toWalletId,
              description: transaction.description ?? ""
            }}
          />
        </section>
        <BottomNav active="history" />
      </div>
    </main>
  );
}
