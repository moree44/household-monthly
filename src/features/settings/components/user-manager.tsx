"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Plus, RotateCcw, X } from "lucide-react";
import {
  createUserAction,
  type UserFormState,
  toggleUserAction,
  updateUserAction
} from "@/features/settings/user-actions";
import { StatusBadge } from "@/features/settings/components/status-badge";

type UserItem = {
  id: string;
  username: string;
  displayName: string;
  role: "admin" | "member";
  isActive: boolean;
  transactionCount: number;
  isCurrentUser: boolean;
};

type UserManagerProps = {
  users: UserItem[];
};

const emptyUserFormState: UserFormState = {
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

function RowActionButton({
  children,
  formAction
}: {
  children: React.ReactNode;
  formAction?: (formData: FormData) => void;
}) {
  return (
    <button
      type="submit"
      formAction={formAction}
      className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-[12px] bg-white px-3 text-xs font-bold leading-none text-[#171717] shadow-sm transition hover:bg-[#FAFAFA]"
    >
      {children}
    </button>
  );
}

function RoleSelect({ defaultValue }: { defaultValue?: UserItem["role"] }) {
  return (
    <select
      name="role"
      defaultValue={defaultValue ?? "member"}
      className="h-10 w-full rounded-[13px] border border-transparent bg-[#F5F5F5] px-3 text-sm font-semibold text-[#171717] outline-none transition focus:border-blue-400"
    >
      <option value="admin">Admin</option>
      <option value="member">Member</option>
    </select>
  );
}

function UserRow({ user }: { user: UserItem }) {
  const [updateState, updateAction] = useActionState(updateUserAction, emptyUserFormState);
  const [toggleState, toggleAction] = useActionState(toggleUserAction, emptyUserFormState);

  return (
    <div className="rounded-[17px] bg-[#E5E5E5] p-2.5 shadow-sm">
      <form action={updateAction} className="space-y-2">
        <input type="hidden" name="userId" value={user.id} />
        <div className="flex items-start gap-2.5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#171717] text-xs font-bold text-white">
            {user.displayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <input
              name="displayName"
              defaultValue={user.displayName}
              className="h-10 w-full rounded-[13px] border border-transparent bg-[#F5F5F5] px-3 text-sm font-semibold text-[#171717] outline-none transition focus:border-blue-400"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                name="username"
                defaultValue={user.username}
                className="h-10 w-full rounded-[13px] border border-transparent bg-[#F5F5F5] px-3 text-sm font-semibold text-[#171717] outline-none transition focus:border-blue-400"
              />
              <RoleSelect defaultValue={user.role} />
            </div>
            <input
              name="password"
              type="password"
              placeholder="Password baru"
              className="h-10 w-full rounded-[13px] border border-transparent bg-[#F5F5F5] px-3 text-sm font-semibold text-[#171717] outline-none transition placeholder:text-[#A3A3A3] focus:border-blue-400"
            />
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[#737373]">
              <span>{user.transactionCount} transaksi</span>
              <span>{user.role}</span>
              <span>{user.isActive ? "aktif" : "nonaktif"}</span>
              {user.isCurrentUser ? <span>akun ini</span> : null}
            </div>
            <StatusBadge error={updateState.error} success={updateState.success} />
          </div>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <RowActionButton>
            <Check size={14} strokeWidth={2} />
            Simpan
          </RowActionButton>
          <RowActionButton formAction={toggleAction}>
            {user.isActive ? <X size={14} strokeWidth={2} /> : <RotateCcw size={14} strokeWidth={2} />}
            {user.isActive ? "Nonaktif" : "Aktifkan"}
          </RowActionButton>
        </div>
      </form>
      <StatusBadge error={toggleState.error} success={toggleState.success} />
    </div>
  );
}

export function UserManager({ users }: UserManagerProps) {
  const [createState, createAction] = useActionState(createUserAction, emptyUserFormState);
  const activeUsers = users.filter((user) => user.isActive);
  const inactiveUsers = users.filter((user) => !user.isActive);

  return (
    <div className="mt-5 space-y-5">
      <section className="rounded-[22px] bg-[#171717] p-4 text-white shadow-lg shadow-black/10">
        <p className="text-xs font-bold uppercase tracking-normal text-[#A3A3A3]">pengguna aktif</p>
        <div className="mt-3 flex items-end justify-between gap-4">
          <div>
            <p className="text-5xl">{activeUsers.length}</p>
            <p className="mt-1 text-xs font-semibold text-[#A3A3A3]">bisa login</p>
          </div>
          <div className="rounded-full bg-[#404040] px-4 py-2 text-xs font-bold">
            {inactiveUsers.length} nonaktif
          </div>
        </div>
      </section>

      <section className="rounded-[20px] bg-[#E5E5E5] p-3 shadow-sm">
        <form action={createAction} className="space-y-3">
          <label className="text-sm font-bold text-[#171717]" htmlFor="display-name">
            Tambah User
          </label>
          <input
            id="display-name"
            name="displayName"
            placeholder="Nama tampil"
            className="h-12 w-full rounded-[15px] border border-transparent bg-[#F5F5F5] px-4 text-sm font-bold text-[#171717] outline-none transition placeholder:text-[#A3A3A3] focus:border-blue-400"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              name="username"
              placeholder="Username"
              className="h-12 w-full rounded-[15px] border border-transparent bg-[#F5F5F5] px-4 text-sm font-bold text-[#171717] outline-none transition placeholder:text-[#A3A3A3] focus:border-blue-400"
            />
            <RoleSelect />
          </div>
          <input
            name="password"
            type="password"
            placeholder="Password"
            className="h-12 w-full rounded-[15px] border border-transparent bg-[#F5F5F5] px-4 text-sm font-bold text-[#171717] outline-none transition placeholder:text-[#A3A3A3] focus:border-blue-400"
          />
          <SubmitButton>
            <Plus size={15} strokeWidth={2} />
            Tambah
          </SubmitButton>
          <StatusBadge error={createState.error} success={createState.success} />
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-[#171717]">Daftar User</h2>
        {users.map((user) => (
          <UserRow key={user.id} user={user} />
        ))}
      </section>
    </div>
  );
}
