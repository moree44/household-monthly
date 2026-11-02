"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import {
  getChatGreetingAction,
  loadCatatChatHistoryAction,
  sendCatatChatAction,
  type ChatChoice,
  type ChatDraft
} from "@/features/transactions/chat-actions";

type ChatMessage = {
  id: string;
  role: "user" | "bot";
  text: string;
};

export function ChatPanel() {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<ChatDraft | null>(null);
  const [choices, setChoices] = useState<ChatChoice[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "bot",
      text: "Siang. Ada yang mau dicatat atau ditanya?"
    }
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void Promise.all([getChatGreetingAction(), loadCatatChatHistoryAction()]).then(([hello, turns]) => {
      const history = turns.map((turn) => ({
        id: crypto.randomUUID(),
        role: turn.role,
        text: turn.text
      }));

      setMessages([{ id: "welcome", role: "bot", text: hello }, ...history]);
    });
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string, confirmDraft?: ChatDraft | null) {
    const trimmed = text.trim();

    if (!trimmed && !confirmDraft) {
      return;
    }

    if (trimmed && !confirmDraft) {
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", text: trimmed }]);
      setInput("");
    }

    setBusy(true);
    const history = messages
      .filter((message) => message.id !== "welcome")
      .slice(-8)
      .map((message) => ({ role: message.role, text: message.text }));
    const result = await sendCatatChatAction(
      confirmDraft ? trimmed || "ok" : trimmed,
      confirmDraft ?? pendingDraft,
      history
    );
    setBusy(false);
    setPendingDraft(result.needsConfirmation ? result.draft : null);
    setChoices(result.needsConfirmation ? result.choices : []);
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "bot", text: result.reply }]);
  }

  return (
    <div className="mt-3 flex min-h-[420px] flex-col rounded-[20px] bg-white p-3 shadow-sm">
      <div className="flex-1 space-y-2 overflow-y-auto pb-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.role === "user"
                ? "ml-8 rounded-[16px] bg-[#171717] px-3 py-2 text-sm text-white"
                : "mr-6 rounded-[16px] bg-[#F5F5F5] px-3 py-2 text-sm text-[#171717]"
            }
          >
            {message.text}
          </div>
        ))}
        {busy ? <p className="text-xs font-medium text-[#737373]">Cek dulu...</p> : null}
        <div ref={endRef} />
      </div>

      {pendingDraft && choices.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {choices.map((choice) => (
            <button
              key={choice.categoryId}
              type="button"
              disabled={busy}
              onClick={() => void send(choice.label, { ...pendingDraft, categoryId: choice.categoryId })}
              className="h-8 rounded-full bg-[#F5F5F5] px-3 text-xs font-bold text-[#171717]"
            >
              {choice.label}
            </button>
          ))}
        </div>
      ) : null}

      {pendingDraft ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void send("simpan", pendingDraft)}
          className="mb-2 h-10 rounded-[12px] bg-[#171717] text-sm font-bold text-white"
        >
          Ya, simpan
        </button>
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
          placeholder="gorengan 5k, saldo, tambah kategori..."
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
