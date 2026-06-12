"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  Car,
  GraduationCap,
  House,
  Laptop,
  Palmtree,
  Plane,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Target,
  X
} from "lucide-react";
import {
  createGoalAction,
  type GoalFormState,
  toggleGoalAction,
  updateGoalAction
} from "@/features/goals/actions";
import { formatRupiah } from "@/lib/format/currency";

type GoalItem = {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  isActive: boolean;
};

type GoalManagerProps = {
  goals: GoalItem[];
};

const emptyGoalFormState: GoalFormState = {
  error: null,
  success: null
};

function formatInputAmount(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0
  }).format(value);
}

function formatAmountText(value: string) {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0
  }).format(Number(digits));
}

function AmountInput({
  name,
  defaultValue,
  placeholder,
  className
}: {
  name: string;
  defaultValue?: number;
  placeholder?: string;
  className: string;
}) {
  return (
    <input
      name={name}
      defaultValue={defaultValue !== undefined ? formatInputAmount(defaultValue) : undefined}
      placeholder={placeholder}
      inputMode="numeric"
      onChange={(event) => {
        event.currentTarget.value = formatAmountText(event.currentTarget.value);
      }}
      onBlur={(event) => {
        event.currentTarget.value = formatAmountText(event.currentTarget.value);
      }}
      className={className}
    />
  );
}

function SubmitButton({ children, variant = "dark" }: { children: React.ReactNode; variant?: "dark" | "light" }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={
        variant === "dark"
          ? "inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-[14px] bg-[#171717] px-3 text-sm font-bold leading-none text-white shadow-sm transition hover:bg-[#262626] disabled:opacity-60"
          : "inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-[14px] bg-white px-3 text-sm font-bold leading-none text-[#171717] shadow-sm transition hover:bg-[#FAFAFA] disabled:opacity-60"
      }
    >
      {children}
    </button>
  );
}

function RowActionButton({ children, formId }: { children: React.ReactNode; formId: string }) {
  return (
    <button
      type="submit"
      form={formId}
      className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-[13px] bg-white px-3 text-xs font-bold leading-none text-[#171717] shadow-sm transition hover:bg-[#FAFAFA]"
    >
      {children}
    </button>
  );
}

function StatusText({ error, success }: { error: string | null; success: string | null }) {
  if (!error && !success) {
    return null;
  }

  return (
    <p className={`mt-2 text-xs font-bold ${error ? "text-red-600" : "text-emerald-600"}`}>
      {error ?? success}
    </p>
  );
}

function GoalProgress({ currentAmount, targetAmount }: { currentAmount: number; targetAmount: number }) {
  const progress = targetAmount > 0 ? Math.min((currentAmount / targetAmount) * 100, 100) : 0;

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold text-blue-600">{Math.round(progress)}%</p>
        <p className="text-[11px] font-semibold text-[#737373]">
          sisa {formatRupiah(Math.max(targetAmount - currentAmount, 0))}
        </p>
      </div>
      <div className="mt-2 h-2 rounded-full bg-[#D4D4D4]">
        <div className="h-full rounded-full bg-blue-500" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-semibold text-[#737373]">
        <div>
          <p>terkumpul</p>
          <p className="mt-1 text-sm font-bold text-[#171717]">{formatRupiah(currentAmount)}</p>
        </div>
        <div>
          <p>target</p>
          <p className="mt-1 text-sm font-bold text-[#171717]">{formatRupiah(targetAmount)}</p>
        </div>
      </div>
    </div>
  );
}

function GoalIcon({ title }: { title: string }) {
  const normalizedTitle = title.toLowerCase();
  const iconProps = {
    size: 17,
    strokeWidth: 1.9
  };

  if (normalizedTitle.includes("darurat")) {
    return <ShieldCheck {...iconProps} />;
  }

  if (normalizedTitle.includes("rumah") || normalizedTitle.includes("renovasi")) {
    return <House {...iconProps} />;
  }

  if (
    normalizedTitle.includes("liburan") ||
    normalizedTitle.includes("holiday") ||
    normalizedTitle.includes("vacation")
  ) {
    return <Plane {...iconProps} />;
  }

  if (normalizedTitle.includes("travel") || normalizedTitle.includes("jalan")) {
    return <Palmtree {...iconProps} />;
  }

  if (
    normalizedTitle.includes("mobil") ||
    normalizedTitle.includes("motor") ||
    normalizedTitle.includes("kendaraan")
  ) {
    return <Car {...iconProps} />;
  }

  if (
    normalizedTitle.includes("laptop") ||
    normalizedTitle.includes("komputer") ||
    normalizedTitle.includes("pc")
  ) {
    return <Laptop {...iconProps} />;
  }

  if (
    normalizedTitle.includes("sekolah") ||
    normalizedTitle.includes("pendidikan") ||
    normalizedTitle.includes("kuliah")
  ) {
    return <GraduationCap {...iconProps} />;
  }

  return <Target {...iconProps} />;
}

function GoalRow({ goal }: { goal: GoalItem }) {
  const [updateState, updateAction] = useActionState(updateGoalAction, emptyGoalFormState);
  const [toggleState, toggleAction] = useActionState(toggleGoalAction, emptyGoalFormState);
  const updateFormId = `update-goal-${goal.id}`;
  const toggleFormId = `toggle-goal-${goal.id}`;

  return (
    <div className={goal.isActive ? "rounded-[20px] bg-white p-3 shadow-sm" : "rounded-[20px] bg-[#E5E5E5] p-3 shadow-sm"}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px] bg-[#E5E5E5] text-[#525252]">
            <GoalIcon title={goal.title} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-[#171717]">{goal.title}</p>
            <p className="mt-0.5 text-[11px] font-semibold text-[#737373]">Target tabungan</p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
            goal.isActive ? "bg-blue-50 text-blue-600" : "bg-[#E5E5E5] text-[#737373]"
          }`}
        >
          {goal.isActive ? "aktif" : "nonaktif"}
        </span>
      </div>

      <GoalProgress currentAmount={goal.currentAmount} targetAmount={goal.targetAmount} />

      <form id={updateFormId} action={updateAction} className="mt-3 space-y-2">
        <input type="hidden" name="goalId" value={goal.id} />
        <input
          name="title"
          defaultValue={goal.title}
          className="h-10 w-full rounded-[13px] border border-transparent bg-[#F5F5F5] px-3 text-sm font-bold text-[#171717] outline-none transition placeholder:text-[#A3A3A3] focus:border-blue-400"
        />
        <div className="grid grid-cols-2 gap-2">
          <AmountInput
            name="currentAmount"
            defaultValue={goal.currentAmount}
            className="h-10 w-full rounded-[13px] border border-transparent bg-[#F5F5F5] px-3 text-sm font-bold text-[#171717] outline-none transition placeholder:text-[#A3A3A3] focus:border-blue-400"
          />
          <AmountInput
            name="targetAmount"
            defaultValue={goal.targetAmount}
            className="h-10 w-full rounded-[13px] border border-transparent bg-[#F5F5F5] px-3 text-sm font-bold text-[#171717] outline-none transition placeholder:text-[#A3A3A3] focus:border-blue-400"
          />
        </div>
        <StatusText error={updateState.error} success={updateState.success} />
      </form>
      <form id={toggleFormId} action={toggleAction} className="hidden">
        <input type="hidden" name="goalId" value={goal.id} />
      </form>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <RowActionButton formId={updateFormId}>
          <Save size={14} strokeWidth={2} />
          Save
        </RowActionButton>
        <RowActionButton formId={toggleFormId}>
          {goal.isActive ? <X size={14} strokeWidth={2} /> : <RotateCcw size={14} strokeWidth={2} />}
          {goal.isActive ? "Nonaktif" : "Aktifkan"}
        </RowActionButton>
      </div>
      <StatusText error={toggleState.error} success={toggleState.success} />
    </div>
  );
}

export function GoalManager({ goals }: GoalManagerProps) {
  const [createState, createAction] = useActionState(createGoalAction, emptyGoalFormState);
  const activeGoals = goals.filter((goal) => goal.isActive);
  const inactiveGoals = goals.filter((goal) => !goal.isActive);
  const totalCurrentAmount = activeGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalTargetAmount = activeGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalProgress = totalTargetAmount > 0 ? Math.min((totalCurrentAmount / totalTargetAmount) * 100, 100) : 0;

  return (
    <div className="mt-5 space-y-5">
      <section className="rounded-[22px] bg-[#171717] p-4 text-white shadow-lg shadow-black/10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-normal text-[#A3A3A3]">total dialokasikan</p>
            <p className="mt-3 text-4xl font-medium">{formatRupiah(totalCurrentAmount)}</p>
          </div>
          <span className="rounded-full bg-[#404040] px-3 py-2 text-xs font-bold text-[#FAFAFA]">
            {Math.round(totalProgress)}%
          </span>
        </div>
        <div className="mt-4 h-px bg-[#404040]" />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-[14px] bg-[#262626] px-3 py-3">
            <p className="text-xs font-semibold text-[#A3A3A3]">Target</p>
            <p className="mt-1 text-sm font-bold text-[#FAFAFA]">{formatRupiah(totalTargetAmount)}</p>
          </div>
          <div className="rounded-[14px] bg-[#262626] px-3 py-3">
            <p className="text-xs font-semibold text-[#A3A3A3]">Goal Aktif</p>
            <p className="mt-1 text-sm font-bold text-[#FAFAFA]">{activeGoals.length} goal</p>
          </div>
        </div>
      </section>

      <section className="rounded-[20px] bg-[#E5E5E5] p-3 shadow-sm">
        <form action={createAction} className="space-y-3">
          <label className="text-sm font-bold text-[#171717]" htmlFor="goal-title">
            Tambah Goal
          </label>
          <input
            id="goal-title"
            name="title"
            placeholder="Nama goal"
            className="h-11 w-full rounded-[15px] border border-transparent bg-[#F5F5F5] px-4 text-sm font-bold text-[#171717] outline-none transition placeholder:text-[#A3A3A3] focus:border-blue-400"
          />
          <div className="grid grid-cols-2 gap-2">
            <AmountInput
              name="currentAmount"
              placeholder="Terkumpul"
              className="h-11 w-full rounded-[15px] border border-transparent bg-[#F5F5F5] px-4 text-sm font-bold text-[#171717] outline-none transition placeholder:text-[#A3A3A3] focus:border-blue-400"
            />
            <AmountInput
              name="targetAmount"
              placeholder="Target"
              className="h-11 w-full rounded-[15px] border border-transparent bg-[#F5F5F5] px-4 text-sm font-bold text-[#171717] outline-none transition placeholder:text-[#A3A3A3] focus:border-blue-400"
            />
          </div>
          <SubmitButton>
            <Plus size={15} strokeWidth={2} />
            Tambah
          </SubmitButton>
          <StatusText error={createState.error} success={createState.success} />
        </form>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-sm font-bold text-[#171717]">Daftar Goal</h2>
          <p className="text-xs font-bold text-[#737373]">{inactiveGoals.length} nonaktif</p>
        </div>
        {goals.length > 0 ? (
          goals.map((goal) => <GoalRow key={goal.id} goal={goal} />)
        ) : (
          <div className="rounded-[18px] bg-[#E5E5E5] px-4 py-8 text-center shadow-sm">
            <p className="text-sm font-bold text-[#171717]">Belum ada goal</p>
            <p className="mt-2 text-sm text-[#737373]">Mulai dari Dana Darurat atau Tabungan Rumah.</p>
          </div>
        )}
      </section>
    </div>
  );
}
