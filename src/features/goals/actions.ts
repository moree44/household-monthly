"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export type GoalFormState = {
  error: string | null;
  success: string | null;
};

const goalSchema = z.object({
  title: z.string().trim().min(2, "Nama goal minimal 2 huruf.").max(80, "Nama goal terlalu panjang."),
  targetAmount: z.string().trim().min(1, "Target wajib diisi."),
  currentAmount: z.string().trim().optional()
});

const goalIdSchema = z.object({
  goalId: z.string().min(1, "Goal tidak ditemukan.")
});

function cleanTitle(title: string) {
  return title.replace(/\s+/g, " ").trim();
}

function parseRupiahInput(value: string | undefined) {
  if (!value) {
    return 0;
  }

  const normalized = value.replace(/[^\d-]/g, "");

  if (!normalized || normalized === "-") {
    return 0;
  }

  return Number(normalized);
}

function revalidateGoalViews() {
  revalidatePath("/goals");
  revalidatePath("/profile");
}

export async function createGoalAction(
  _prevState: GoalFormState,
  formData: FormData
): Promise<GoalFormState> {
  await requireUser();

  const parsed = goalSchema.safeParse({
    title: formData.get("title"),
    targetAmount: formData.get("targetAmount"),
    currentAmount: formData.get("currentAmount")
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Input goal belum valid.",
      success: null
    };
  }

  const title = cleanTitle(parsed.data.title);
  const targetAmount = parseRupiahInput(parsed.data.targetAmount);
  const currentAmount = parseRupiahInput(parsed.data.currentAmount);

  if (targetAmount <= 0) {
    return {
      error: "Target harus lebih dari 0.",
      success: null
    };
  }

  const existingGoal = await prisma.goal.findUnique({
    where: { title },
    select: { id: true, isActive: true }
  });

  if (existingGoal) {
    return {
      error: existingGoal.isActive
        ? "Goal ini sudah ada."
        : "Goal ini sudah ada di daftar nonaktif. Aktifkan lagi dari list bawah.",
      success: null
    };
  }

  const maxSortOrder = await prisma.goal.aggregate({
    _max: {
      sortOrder: true
    }
  });

  await prisma.goal.create({
    data: {
      title,
      targetAmount,
      currentAmount,
      sortOrder: (maxSortOrder._max.sortOrder ?? 0) + 1
    }
  });

  revalidateGoalViews();

  return {
    error: null,
    success: "Goal ditambahkan."
  };
}

export async function updateGoalAction(
  _prevState: GoalFormState,
  formData: FormData
): Promise<GoalFormState> {
  await requireUser();

  const parsedId = goalIdSchema.safeParse({
    goalId: formData.get("goalId")
  });
  const parsedGoal = goalSchema.safeParse({
    title: formData.get("title"),
    targetAmount: formData.get("targetAmount"),
    currentAmount: formData.get("currentAmount")
  });

  if (!parsedId.success || !parsedGoal.success) {
    return {
      error: parsedGoal.error?.issues[0]?.message ?? parsedId.error?.issues[0]?.message ?? "Input belum valid.",
      success: null
    };
  }

  const title = cleanTitle(parsedGoal.data.title);
  const targetAmount = parseRupiahInput(parsedGoal.data.targetAmount);
  const currentAmount = parseRupiahInput(parsedGoal.data.currentAmount);

  if (targetAmount <= 0) {
    return {
      error: "Target harus lebih dari 0.",
      success: null
    };
  }

  const duplicate = await prisma.goal.findFirst({
    where: {
      title,
      id: {
        not: parsedId.data.goalId
      }
    },
    select: {
      id: true
    }
  });

  if (duplicate) {
    return {
      error: "Nama goal sudah dipakai.",
      success: null
    };
  }

  await prisma.goal.update({
    where: {
      id: parsedId.data.goalId
    },
    data: {
      title,
      targetAmount,
      currentAmount
    }
  });

  revalidateGoalViews();

  return {
    error: null,
    success: "Goal disimpan."
  };
}

export async function toggleGoalAction(
  _prevState: GoalFormState,
  formData: FormData
): Promise<GoalFormState> {
  await requireUser();

  const parsedId = goalIdSchema.safeParse({
    goalId: formData.get("goalId")
  });

  if (!parsedId.success) {
    return {
      error: parsedId.error.issues[0]?.message ?? "Goal tidak ditemukan.",
      success: null
    };
  }

  const goal = await prisma.goal.findUnique({
    where: {
      id: parsedId.data.goalId
    },
    select: {
      isActive: true
    }
  });

  if (!goal) {
    return {
      error: "Goal tidak ditemukan.",
      success: null
    };
  }

  await prisma.goal.update({
    where: {
      id: parsedId.data.goalId
    },
    data: {
      isActive: !goal.isActive
    }
  });

  revalidateGoalViews();

  return {
    error: null,
    success: goal.isActive ? "Goal dinonaktifkan." : "Goal diaktifkan."
  };
}
