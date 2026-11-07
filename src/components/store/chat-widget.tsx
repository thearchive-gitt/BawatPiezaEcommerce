"use client";

import { FormEvent, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { apiFetch } from "@/lib/api";

type ChatMessage = {
  id: number;
  text: string;
  from: "bot" | "user";
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      from: "bot",
      text: "Hi! How can we help with your Bawat Pieza order?",
    },
  ]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = message.trim();
    if (!text || sending) return;

    const nextMessages = [...messages, { id: Date.now(), from: "user" as const, text }];
    setMessages(nextMessages);
    setMessage("");
    setSending(true);
    try {
      const response = await apiFetch("/api/v1/public/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: nextMessages
            .filter((item) => item.from !== "bot" || item.id !== 1)
            .map((item) => ({ role: item.from === "user" ? "user" : "model", text: item.text })),
        }),
      });
      const body = (await response.json()) as { message: string };
      setMessages((current) => [
        ...current,
        { id: Date.now() + 1, from: "bot", text: body.message },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          from: "bot",
          text: error instanceof Error ? error.message : "The support assistant is unavailable right now.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={`chat-widget${open ? " is-open" : ""}`}>
      {open && (
        <section className="chat-panel" aria-label="Customer support chat">
          <div className="chat-panel-header">
            <div>
              <p className="eyebrow">BAWAT PIEZA SUPPORT</p>
              <h2>How can we help?</h2>
            </div>
            <button
              aria-label="Close chat"
              className="chat-close"
              onClick={() => setOpen(false)}
              type="button"
            >
              <X aria-hidden="true" size={18} />
            </button>
          </div>
          <div className="chat-messages" aria-live="polite">
            {messages.map((item) => (
              <p className={`chat-message ${item.from}`} key={item.id}>
                {item.text}
              </p>
            ))}
          </div>
          <form className="chat-form" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="chat-message">
              Type your message
            </label>
            <input
              id="chat-message"
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Type a message..."
              value={message}
              disabled={sending}
            />
            <button aria-label="Send message" type="submit">
              {sending ? "..." : <Send aria-hidden="true" size={17} />}
            </button>
          </form>
        </section>
      )}
      <button
        aria-expanded={open}
        aria-label={open ? "Close customer support chat" : "Open customer support chat"}
        className="chat-launcher"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {open ? <X aria-hidden="true" size={22} /> : <MessageCircle aria-hidden="true" size={22} />}
      </button>
    </div>
  );
}
