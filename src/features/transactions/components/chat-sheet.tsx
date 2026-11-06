"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import {
  getChatGreetingAction,
  loadCatatChatHistoryAction,
  sendCatatChatAction,
  type ChatChoice,
  type ChatPendingAction,
  type PickedChoice
} from "@/features/transactions/chat-actions";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "bot";
  text: string;
  dayLabel?: string;
};

type SendOptions = {
  echo?: string | null;
  pendingOverride?: ChatPendingAction | null;
  picked?: PickedChoice | null;
};

function confirmLabel(pending: ChatPendingAction) {
  switch (pending.kind) {
    case "save_expense":
    case "save_top_up":
    case "save_transfer":
      return "Ya, simpan";
    case "delete_transactions":
      if (pending.requirePhrase) {
        return "Ya, hapus semua";
      }

      return pending.transactionIds.length > 1 ? `Ya, hapus (${pending.transactionIds.length})` : "Ya, hapus";
    case "edit_transaction":
      return "Ya, ubah";
    case "create_wallet":
      return "Ya, buat";
    case "deactivate_wallet":
      return "Ya, nonaktifkan";
    case "reset_wallets":
      return "Ya, bersihkan";
  }
}

// Draft yang masih kurang data jangan tampilkan tombol konfirmasi biar ga membingungkan.
function pendingReady(pending: ChatPendingAction) {
  if (pending.kind === "save_top_up") {
    return Boolean(pending.draft.walletId && pending.draft.sourceAccountId);
  }

  if (pending.kind === "save_transfer") {
    return Boolean(pending.draft.fromWalletId && pending.draft.toWalletId);
  }

  return true;
}

export function ChatPanel({ className }: { className?: string }) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<ChatPendingAction | null>(null);
  const [choices, setChoices] = useState<ChatChoice[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);
  const lastPromptRef = useRef<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  function updateMessages(next: ChatMessage[]) {
    messagesRef.current = next;
    setMessages(next);
  }

  useEffect(() => {
    void Promise.all([getChatGreetingAction(), loadCatatChatHistoryAction()])
      .then(([hello, turns]) => {
        const history = turns.map((turn) => ({
          id: crypto.randomUUID(),
          role: turn.role,
          text: turn.text,
          dayLabel: turn.dayLabel
        }));

        updateMessages([{ id: "welcome", role: "bot", text: hello }, ...history]);
      })
      .catch(() => {
        updateMessages([
          {
            id: "welcome",
            role: "bot",
            text: "Halo. Ada yang mau dicatat atau ditanya?"
          }
        ]);
      });
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy, choices]);

  async function send(text: string, options: SendOptions = {}) {
    const trimmed = text.trim();
    const echo = options.echo !== undefined ? options.echo : trimmed;

    if (!trimmed && !options.picked) {
      return;
    }

    if (echo) {
      updateMessages([
        ...messagesRef.current,
        { id: crypto.randomUUID(), role: "user", text: echo }
      ]);
    }

    if (!options.picked) {
      lastPromptRef.current = trimmed;
      setInput("");
    }

    setBusy(true);
    setChoices([]);

    const history = messagesRef.current
      .filter((message) => message.id !== "welcome")
      .slice(-8)
      .map((message) => ({ role: message.role, text: message.text }));

    try {
      const result = await sendCatatChatAction(
        trimmed,
        options.pendingOverride !== undefined ? options.pendingOverride : pending,
        options.picked ?? null,
        history
      );

      setPending(result.pendingAction);
      setChoices(result.choices);
      updateMessages([
        ...messagesRef.current,
        { id: crypto.randomUUID(), role: "bot", text: result.reply }
      ]);
    } catch {
      setPending(null);
      setChoices([
        { label: "Coba lagi", value: lastPromptRef.current ?? "", kind: "retry" }
      ]);
      updateMessages([
        ...messagesRef.current,
        {
          id: crypto.randomUUID(),
          role: "bot",
          text: "Waduh, gagal kirim. Coba lagi ya."
        }
      ]);
    } finally {
      setBusy(false);
    }
  }

  function pickChoice(choice: ChatChoice) {
    if (choice.kind === "retry") {
      const retryPrompt = choice.value;

      if (retryPrompt) {
        void send(retryPrompt, { echo: retryPrompt });
      }

      return;
    }

    void send(choice.label, {
      echo: choice.label,
      picked: { kind: choice.kind, value: choice.value }
    });
  }

  return (
    <div className={cn("mt-3 flex min-h-[420px] flex-col rounded-[20px] bg-white p-3 shadow-sm", className)}>
      <div className="flex-1 space-y-2 overflow-y-auto pb-3">
        {messages.map((message, index) => {
          const previous = messages[index - 1];
          const showDivider = message.dayLabel && message.dayLabel !== previous?.dayLabel;

          return (
            <div key={message.id} className="space-y-2">
              {showDivider ? (
                <p className="text-center text-[11px] font-semibold text-[#A3A3A3]">{message.dayLabel}</p>
              ) : null}
              <div
                className={
                  message.role === "user"
                    ? "ml-8 whitespace-pre-line rounded-[16px] bg-[#171717] px-3 py-2 text-sm text-white"
                    : "mr-6 whitespace-pre-line rounded-[16px] bg-[#F5F5F5] px-3 py-2 text-sm text-[#171717]"
                }
              >
                {message.text}
              </div>
            </div>
          );
        })}
        {busy ? (
          <div className="mr-6 inline-flex items-center gap-1 rounded-[16px] bg-[#F5F5F5] px-3 py-2.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#A3A3A3]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#A3A3A3] [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#A3A3A3] [animation-delay:300ms]" />
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      {pending ? (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {pendingReady(pending) ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void send(confirmLabel(pending), { echo: confirmLabel(pending), pendingOverride: pending })}
              className="h-9 rounded-full bg-[#171717] px-3.5 text-xs font-bold text-white"
            >
              {confirmLabel(pending)}
            </button>
          ) : null}
          <button
            type="button"
            disabled={busy}
            onClick={() => void send("batal", { echo: "Batal", pendingOverride: pending })}
            className="h-9 rounded-full bg-[#F5F5F5] px-3.5 text-xs font-bold text-[#737373]"
          >
            Batal
          </button>
        </div>
      ) : null}

      {choices.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {choices.map((choice) => (
            <button
              key={`${choice.kind}-${choice.value}`}
              type="button"
              disabled={busy}
              onClick={() => pickChoice(choice)}
              className="h-8 rounded-full bg-[#F5F5F5] px-3 text-xs font-bold text-[#171717]"
            >
              {choice.label}
            </button>
          ))}
        </div>
      ) : null}

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void send(input);
        }}
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="gorengan 5k, saldo istri, hapus gorengan tadi..."
          className="h-11 min-w-0 flex-1 rounded-[14px] bg-[#F5F5F5] px-3 text-sm font-medium outline-none"
        />
        <button
          type="submit"
          disabled={busy}
          className="grid h-11 w-11 place-items-center rounded-[14px] bg-blue-500 text-white disabled:opacity-50"
          aria-label="Kirim"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
