"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { clearSession, createSession } from "@/lib/auth/session";

const loginSchema = z.object({
  username: z.string().trim().min(1, "Username wajib diisi."),
  password: z.string().min(1, "Password wajib diisi.")
});

export type LoginFormState = {
  error: string | null;
};

export async function loginAction(
  _prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Input login belum lengkap."
    };
  }

  const username = parsed.data.username.toLowerCase();

  const user = await prisma.user.findUnique({
    where: {
      username
    }
  });

  if (!user || !user.isActive) {
    return {
      error: "Username atau password salah."
    };
  }

  const passwordMatches = await bcrypt.compare(parsed.data.password, user.passwordHash);

  if (!passwordMatches) {
    return {
      error: "Username atau password salah."
    };
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}
