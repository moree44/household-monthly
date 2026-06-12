"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export type CategoryFormState = {
  error: string | null;
  success: string | null;
};

const categorySchema = z.object({
  name: z.string().trim().min(2, "Nama kategori minimal 2 huruf.").max(60, "Nama kategori terlalu panjang.")
});

const categoryIdSchema = z.object({
  categoryId: z.string().min(1, "Kategori tidak ditemukan.")
});

function cleanName(name: string) {
  return name.replace(/\s+/g, " ").trim();
}

function revalidateCategoryViews() {
  revalidatePath("/settings/categories");
  revalidatePath("/profile");
  revalidatePath("/expenses/new");
  revalidatePath("/dashboard");
  revalidatePath("/history");
}

export async function createCategoryAction(
  _prevState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  await requireUser();

  const parsed = categorySchema.safeParse({
    name: formData.get("name")
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Nama kategori belum valid.",
      success: null
    };
  }

  const name = cleanName(parsed.data.name);
  const existingCategory = await prisma.category.findUnique({
    where: { name },
    select: { id: true, isActive: true }
  });

  if (existingCategory) {
    return {
      error: existingCategory.isActive
        ? "Kategori ini sudah ada."
        : "Kategori ini sudah ada di daftar nonaktif. Aktifkan lagi dari list bawah.",
      success: null
    };
  }

  const maxSortOrder = await prisma.category.aggregate({
    _max: {
      sortOrder: true
    }
  });

  await prisma.category.create({
    data: {
      name,
      sortOrder: (maxSortOrder._max.sortOrder ?? 0) + 1
    }
  });

  revalidateCategoryViews();

  return {
    error: null,
    success: "Kategori ditambahkan."
  };
}

export async function updateCategoryAction(
  _prevState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  await requireUser();

  const parsedId = categoryIdSchema.safeParse({
    categoryId: formData.get("categoryId")
  });
  const parsedCategory = categorySchema.safeParse({
    name: formData.get("name")
  });

  if (!parsedId.success || !parsedCategory.success) {
    return {
      error: parsedCategory.error?.issues[0]?.message ?? parsedId.error?.issues[0]?.message ?? "Input belum valid.",
      success: null
    };
  }

  const name = cleanName(parsedCategory.data.name);
  const duplicate = await prisma.category.findFirst({
    where: {
      name,
      id: {
        not: parsedId.data.categoryId
      }
    },
    select: {
      id: true
    }
  });

  if (duplicate) {
    return {
      error: "Nama kategori sudah dipakai.",
      success: null
    };
  }

  await prisma.category.update({
    where: {
      id: parsedId.data.categoryId
    },
    data: {
      name
    }
  });

  revalidateCategoryViews();

  return {
    error: null,
    success: "Kategori disimpan."
  };
}

export async function toggleCategoryAction(
  _prevState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  await requireUser();

  const parsedId = categoryIdSchema.safeParse({
    categoryId: formData.get("categoryId")
  });

  if (!parsedId.success) {
    return {
      error: parsedId.error.issues[0]?.message ?? "Kategori tidak ditemukan.",
      success: null
    };
  }

  const category = await prisma.category.findUnique({
    where: {
      id: parsedId.data.categoryId
    },
    select: {
      isActive: true
    }
  });

  if (!category) {
    return {
      error: "Kategori tidak ditemukan.",
      success: null
    };
  }

  await prisma.category.update({
    where: {
      id: parsedId.data.categoryId
    },
    data: {
      isActive: !category.isActive
    }
  });

  revalidateCategoryViews();

  return {
    error: null,
    success: category.isActive ? "Kategori dinonaktifkan." : "Kategori diaktifkan."
  };
}
