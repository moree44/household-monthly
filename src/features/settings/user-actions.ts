"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export type UserFormState = {
  error: string | null;
  success: string | null;
};

const userRoleSchema = z.enum(["admin", "member"]);

const createUserSchema = z.object({
  displayName: z.string().trim().min(2, "Nama minimal 2 huruf.").max(60, "Nama terlalu panjang."),
  username: z
    .string()
    .trim()
    .min(3, "Username minimal 3 huruf.")
    .max(30, "Username terlalu panjang.")
    .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh huruf, angka, dan underscore."),
  role: userRoleSchema,
  password: z.string().min(6, "Password minimal 6 karakter.")
});

const updateUserSchema = createUserSchema
  .omit({
    password: true
  })
  .extend({
    userId: z.string().min(1, "User tidak ditemukan."),
    password: z
      .string()
      .optional()
      .refine((password) => !password || password.trim().length >= 6, "Password minimal 6 karakter.")
  });

const userIdSchema = z.object({
  userId: z.string().min(1, "User tidak ditemukan.")
});

function cleanName(name: string) {
  return name.replace(/\s+/g, " ").trim();
}

async function requireAdmin() {
  const currentUser = await requireUser();

  if (currentUser.role !== "admin") {
    throw new Error("Hanya admin yang bisa mengelola pengguna.");
  }

  return currentUser;
}

function revalidateUserViews() {
  revalidatePath("/settings/users");
  revalidatePath("/profile");
  revalidatePath("/dashboard");
}

async function activeAdminCount(exceptUserId?: string) {
  return prisma.user.count({
    where: {
      role: "admin",
      isActive: true,
      id: exceptUserId
        ? {
            not: exceptUserId
          }
        : undefined
    }
  });
}

export async function createUserAction(
  _prevState: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  try {
    await requireAdmin();

    const parsed = createUserSchema.safeParse({
      displayName: formData.get("displayName"),
      username: formData.get("username"),
      role: formData.get("role"),
      password: formData.get("password")
    });

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Input user belum valid.",
        success: null
      };
    }

    const username = parsed.data.username.toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true, isActive: true }
    });

    if (existingUser) {
      return {
        error: existingUser.isActive
          ? "Username ini sudah dipakai."
          : "Username ini sudah ada di daftar nonaktif. Aktifkan lagi dari list bawah.",
        success: null
      };
    }

    await prisma.user.create({
      data: {
        displayName: cleanName(parsed.data.displayName),
        username,
        role: parsed.data.role,
        passwordHash: await bcrypt.hash(parsed.data.password, 12)
      }
    });

    revalidateUserViews();

    return {
      error: null,
      success: "User ditambahkan."
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Gagal menambah user.",
      success: null
    };
  }
}

export async function updateUserAction(
  _prevState: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  try {
    await requireAdmin();

    const parsed = updateUserSchema.safeParse({
      userId: formData.get("userId"),
      displayName: formData.get("displayName"),
      username: formData.get("username"),
      role: formData.get("role"),
      password: formData.get("password")
    });

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Input user belum valid.",
        success: null
      };
    }

    const user = await prisma.user.findUnique({
      where: {
        id: parsed.data.userId
      },
      select: {
        id: true,
        role: true,
        isActive: true
      }
    });

    if (!user) {
      return {
        error: "User tidak ditemukan.",
        success: null
      };
    }

    if (user.role === "admin" && user.isActive && parsed.data.role !== "admin") {
      const remainingAdmins = await activeAdminCount(user.id);

      if (remainingAdmins === 0) {
        return {
          error: "Minimal harus ada 1 admin aktif.",
          success: null
        };
      }
    }

    const username = parsed.data.username.toLowerCase();
    const duplicate = await prisma.user.findFirst({
      where: {
        username,
        id: {
          not: user.id
        }
      },
      select: {
        id: true
      }
    });

    if (duplicate) {
      return {
        error: "Username sudah dipakai.",
        success: null
      };
    }

    const password = parsed.data.password?.trim();

    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        displayName: cleanName(parsed.data.displayName),
        username,
        role: parsed.data.role,
        ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {})
      }
    });

    revalidateUserViews();

    return {
      error: null,
      success: "User disimpan."
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Gagal menyimpan user.",
      success: null
    };
  }
}

export async function toggleUserAction(
  _prevState: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  try {
    const currentUser = await requireAdmin();

    const parsed = userIdSchema.safeParse({
      userId: formData.get("userId")
    });

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "User tidak ditemukan.",
        success: null
      };
    }

    if (parsed.data.userId === currentUser.id) {
      return {
        error: "Tidak bisa menonaktifkan akun yang sedang dipakai.",
        success: null
      };
    }

    const user = await prisma.user.findUnique({
      where: {
        id: parsed.data.userId
      },
      select: {
        id: true,
        role: true,
        isActive: true
      }
    });

    if (!user) {
      return {
        error: "User tidak ditemukan.",
        success: null
      };
    }

    if (user.role === "admin" && user.isActive) {
      const remainingAdmins = await activeAdminCount(user.id);

      if (remainingAdmins === 0) {
        return {
          error: "Minimal harus ada 1 admin aktif.",
          success: null
        };
      }
    }

    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        isActive: !user.isActive
      }
    });

    if (user.isActive) {
      await prisma.session.deleteMany({
        where: {
          userId: user.id
        }
      });
    }

    revalidateUserViews();

    return {
      error: null,
      success: user.isActive ? "User dinonaktifkan." : "User diaktifkan."
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Gagal mengubah status user.",
      success: null
    };
  }
}
