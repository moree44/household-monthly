"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Plus, RotateCcw, X } from "lucide-react";
import {
  createCategoryAction,
  type CategoryFormState,
  toggleCategoryAction,
  updateCategoryAction
} from "@/features/settings/category-actions";

type CategoryItem = {
  id: string;
  name: string;
  isActive: boolean;
  isDefault: boolean;
  transactionCount: number;
};

type CategoryManagerProps = {
  categories: CategoryItem[];
};

const emptyCategoryFormState: CategoryFormState = {
  error: null,
  success: null
};

function SubmitButton({ children, variant = "dark" }: { children: React.ReactNode; variant?: "dark" | "light" }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={
        variant === "dark"
          ? "inline-flex h-9 w-fit items-center justify-center gap-1.5 rounded-[12px] bg-[#171717] px-3 text-xs font-bold leading-none text-white shadow-sm transition hover:bg-[#262626] disabled:opacity-60"
          : "inline-flex h-9 w-fit items-center justify-center gap-1.5 rounded-[12px] bg-white px-3 text-xs font-bold leading-none text-[#171717] shadow-sm transition hover:bg-[#FAFAFA] disabled:opacity-60"
      }
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

function RowActionButton({
  children,
  formId
}: {
  children: React.ReactNode;
  formId: string;
}) {
  return (
    <button
      type="submit"
      form={formId}
      className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-[12px] bg-white px-3 text-xs font-bold leading-none text-[#171717] shadow-sm transition hover:bg-[#FAFAFA]"
    >
      {children}
    </button>
  );
}

function CategoryRow({ category }: { category: CategoryItem }) {
  const [updateState, updateAction] = useActionState(updateCategoryAction, emptyCategoryFormState);
  const [toggleState, toggleAction] = useActionState(toggleCategoryAction, emptyCategoryFormState);
  const updateFormId = `update-category-${category.id}`;
  const toggleFormId = `toggle-category-${category.id}`;

  return (
    <div className="rounded-[17px] bg-[#E5E5E5] p-2.5 shadow-sm">
      <form id={updateFormId} action={updateAction} className="space-y-2">
        <input type="hidden" name="categoryId" value={category.id} />
        <div className="flex items-start gap-2.5">
          <span
            className={`mt-3 h-2.5 w-2.5 shrink-0 rounded-full ${
              category.isActive ? "bg-blue-500" : "bg-[#A3A3A3]"
            }`}
          />
          <div className="min-w-0 flex-1">
            <input
              name="name"
              defaultValue={category.name}
              className="h-10 w-full rounded-[13px] border border-transparent bg-[#F5F5F5] px-3 text-sm font-semibold text-[#171717] outline-none transition focus:border-blue-400"
            />
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[#737373]">
              <span>{category.transactionCount} transaksi</span>
              {category.isDefault ? <span>default</span> : null}
              <span>{category.isActive ? "aktif" : "nonaktif"}</span>
            </div>
            <StatusText error={updateState.error} success={updateState.success} />
          </div>
        </div>
      </form>
      <form id={toggleFormId} action={toggleAction} className="hidden">
        <input type="hidden" name="categoryId" value={category.id} />
      </form>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <RowActionButton formId={updateFormId}>
          <Check size={14} strokeWidth={2} />
          Simpan
        </RowActionButton>
        <RowActionButton formId={toggleFormId}>
          {category.isActive ? <X size={14} strokeWidth={2} /> : <RotateCcw size={14} strokeWidth={2} />}
          {category.isActive ? "Nonaktif" : "Aktifkan"}
        </RowActionButton>
      </div>
      <StatusText error={toggleState.error} success={toggleState.success} />
    </div>
  );
}

export function CategoryManager({ categories }: CategoryManagerProps) {
  const [createState, createAction] = useActionState(createCategoryAction, emptyCategoryFormState);
  const activeCategories = categories.filter((category) => category.isActive);
  const inactiveCategories = categories.filter((category) => !category.isActive);

  return (
    <div className="mt-5 space-y-5">
      <section className="rounded-[22px] bg-[#171717] p-4 text-white shadow-lg shadow-black/10">
        <p className="text-xs font-bold uppercase tracking-normal text-[#A3A3A3]">kategori aktif</p>
        <div className="mt-3 flex items-end justify-between gap-4">
          <div>
            <p className="text-5xl">{activeCategories.length}</p>
            <p className="mt-1 text-xs font-semibold text-[#A3A3A3]">dipakai di form catat</p>
          </div>
          <div className="rounded-full bg-[#404040] px-4 py-2 text-xs font-bold">
            {inactiveCategories.length} nonaktif
          </div>
        </div>
      </section>

      <section className="rounded-[20px] bg-[#E5E5E5] p-3 shadow-sm">
        <form action={createAction} className="space-y-3">
          <label className="text-sm font-bold text-[#171717]" htmlFor="category-name">
            Tambah Kategori
          </label>
          <div className="flex gap-2">
            <input
              id="category-name"
              name="name"
              placeholder="Nama kategori"
              className="h-12 min-w-0 flex-1 rounded-[15px] border border-transparent bg-[#F5F5F5] px-4 text-sm font-bold text-[#171717] outline-none transition placeholder:text-[#A3A3A3] focus:border-blue-400"
            />
            <SubmitButton>
              <Plus size={15} strokeWidth={2} />
            </SubmitButton>
          </div>
          <StatusText error={createState.error} success={createState.success} />
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-[#171717]">Daftar Kategori</h2>
        {categories.map((category) => (
          <CategoryRow key={category.id} category={category} />
        ))}
      </section>
    </div>
  );
}
