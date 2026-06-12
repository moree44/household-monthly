import { Home } from "lucide-react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/components/login-form";
import { getCurrentUser } from "@/lib/auth/session";

export default async function LoginPage() {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#262626] px-4 py-8 text-[#171717]">
      <div className="w-full max-w-[430px] rounded-[30px] bg-[#F5F5F5] px-5 py-6 shadow-2xl shadow-black/20">
        <div className="mb-7">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#171717] text-white shadow-lg shadow-black/10">
            <Home size={22} strokeWidth={1.75} />
          </div>
          <p className="text-xs font-bold uppercase tracking-normal text-[#737373]">private finance</p>
          <h1 className="mt-1 text-2xl font-bold tracking-normal text-[#0A0A0A]">
            Household Monthly
          </h1>
          <p className="mt-2 text-sm font-medium leading-6 text-[#737373]">
            Catatan pengeluaran rumah tangga pribadi.
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
