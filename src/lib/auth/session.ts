import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

const SESSION_COOKIE_NAME = "household_monthly_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt
    }
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await prisma.session.deleteMany({
      where: {
        tokenHash: hashToken(token)
      }
    });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

type SessionUser = Pick<User, "id" | "username" | "displayName" | "role" | "isActive">;

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: {
      tokenHash: hashToken(token)
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          role: true,
          isActive: true
        }
      }
    }
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt <= new Date() || !session.user.isActive) {
    await prisma.session.delete({
      where: {
        id: session.id
      }
    });
    return null;
  }

  return session.user;
});

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  return user;
}
