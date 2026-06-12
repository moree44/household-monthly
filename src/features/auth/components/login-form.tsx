"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, LockKeyhole, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginAction, type LoginFormState } from "@/features/auth/actions";

const initialState: LoginFormState = {
  error: null
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="mt-5 w-full bg-blue-500 shadow-lg shadow-blue-500/20 hover:bg-blue-600" type="submit" disabled={pending}>
      {pending ? "Memeriksa..." : "Masuk"}
      <ArrowRight size={18} strokeWidth={1.75} />
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="rounded-[22px] bg-[#E5E5E5] p-4 shadow-sm">
      <label className="block text-sm font-bold text-[#171717]" htmlFor="username">
        Username
      </label>
      <div className="relative mt-2">
        <UserRound
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]"
          size={18}
          strokeWidth={1.75}
        />
        <Input
          id="username"
          name="username"
          className="pl-10"
          autoComplete="username"
          placeholder="suami atau istri"
        />
      </div>

      <label className="mt-4 block text-sm font-bold text-[#171717]" htmlFor="password">
        Password
      </label>
      <div className="relative mt-2">
        <LockKeyhole
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]"
          size={18}
          strokeWidth={1.75}
        />
        <Input
          id="password"
          name="password"
          type="password"
          className="pl-10"
          autoComplete="current-password"
          placeholder="password"
        />
      </div>

      {state.error ? (
        <p className="mt-4 rounded-[14px] bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{state.error}</p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
