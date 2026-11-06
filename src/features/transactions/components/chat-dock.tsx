"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { ChatPanel } from "@/features/transactions/components/chat-sheet";

export function ChatDock() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [booted, setBooted] = useState(false);

  if (pathname === "/chat") {
    return null;
  }

  function openChat() {
    setBooted(true);
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={openChat}
        className="fixed right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-blue-500 text-white shadow-lg shadow-blue-500/40 wide:hidden"
        style={{ bottom: "calc(7.25rem + env(safe-area-inset-bottom, 0px))" }}
        aria-label="Chat AI"
      >
        <MessageCircle size={22} strokeWidth={2} />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 wide:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Tutup chat"
            onClick={() => setOpen(false)}
          />
          <section
            className="absolute inset-x-0 bottom-0 flex h-[min(82vh,640px)] flex-col rounded-t-[24px] bg-[#F5F5F5] p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] shadow-2xl"
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-sm font-bold text-[#171717]">Chat AI</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-white text-[#171717]"
                aria-label="Tutup"
              >
                <X size={16} />
              </button>
            </div>
            {booted ? <ChatPanel className="mt-0 min-h-0 flex-1" /> : null}
          </section>
        </div>
      ) : null}
    </>
  );
}
