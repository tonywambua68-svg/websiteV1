import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { byId } from "../data/products";
import { useStore } from "../lib/store";
import { useAuth } from "../lib/AuthContext";
import { createMemory, novaAsk, type NovaResponse } from "../lib/nova/engine";
import { AI_QUICK_PROMPTS } from "../data/content";
import ProductArt from "./ProductArt";
import { IcArrowR, IcCart, IcSend, IcSpark } from "./Icons";

interface Msg { role: "user" | "bot"; text: string; res?: NovaResponse }

/**
 * Homepage NOVA panel. Same engine + truth-policy as the floating widget.
 * (Formerly "Zuri" — renamed and substantially upgraded, design preserved.)
 */
export default function AIFinder() {
  const { orders, addToCart } = useStore();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "bot",
      text:
        "Karibu! I'm NOVA — Imara's AI shopping assistant. Tell me what you need and your budget, and I'll shortlist the best real matches from our live catalogue. I only quote official website prices — never invented specs or hidden costs.",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const memory = useRef(createMemory());

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const send = (text: string) => {
    const q = text.trim();
    if (!q || typing) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setTyping(true);
    window.setTimeout(() => {
      const res = novaAsk(q, memory.current, { user, orders });
      setMessages((m) => [...m, { role: "bot", text: res.text, res }]);
      setTyping(false);
    }, 900 + Math.random() * 500);
  };

  const prompts = [
    ...AI_QUICK_PROMPTS,
    "Compare AeroBook and Havoc",
    "How do I pay with M-PESA?",
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-pine/60 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]">
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-ink/60 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-error/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/80" />
        <span className="ml-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-white/50">
          <IcSpark className="h-4 w-4 text-amber" /> NOVA · AI Product Finder
        </span>
        <span className="ml-auto rounded-full bg-success/15 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-success">Online</span>
      </div>

      {/* messages */}
      <div ref={scrollRef} className="h-80 space-y-4 overflow-y-auto p-4 md:h-96 md:p-5" aria-live="polite">
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-br-md bg-amber px-4 py-2.5 text-left text-[13.5px] font-semibold leading-relaxed text-ink">{m.text}</p>
            </div>
          ) : (
            <div key={i} className="flex flex-col gap-2.5">
              <p className="max-w-[92%] whitespace-pre-line rounded-2xl rounded-bl-md border border-white/10 bg-ink/70 px-4 py-2.5 text-[13.5px] font-semibold leading-relaxed text-white/90">
                {m.text}
              </p>
              {m.res?.recs && (
                <div className="grid gap-2.5">
                  {m.res.recs.map(({ p, reasons }) => {
                    const src = byId(p.id);
                    return (
                      <div key={p.id} className="flex gap-3 rounded-xl border border-white/10 bg-ink/70 p-3 text-left">
                        <span className="grid h-16 w-20 shrink-0 place-items-center overflow-hidden rounded-lg" style={{ background: `linear-gradient(150deg, ${src?.hue ?? "#0b7a63"}55, transparent)` }}>
                          {src ? <ProductArt kind={src.art} accent={src.hue} className="h-[130%]" /> : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-extrabold text-white">{p.name}</span>
                          <span className="block font-display text-sm font-bold text-amber">{p.price}</span>
                          <span className="mt-1 block space-y-0.5">
                            {reasons.map((r) => (
                              <span key={r} className="flex items-start gap-1.5 text-[11.5px] font-semibold text-white/55">
                                <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-teal" />{r}
                              </span>
                            ))}
                          </span>
                        </span>
                        <span className="flex flex-col justify-center gap-1.5">
                          <Link to={`/product/${p.id}`} className="grid h-8 w-8 place-items-center rounded-lg border border-white/15 text-white/70 transition hover:border-amber hover:text-amber" aria-label={`View ${p.name}`}>
                            <IcArrowR className="h-4 w-4" />
                          </Link>
                          <button type="button" onClick={() => addToCart(p.id, 1)} aria-label={`Add ${p.name} to cart`} className="grid h-8 w-8 place-items-center rounded-lg bg-amber text-ink transition hover:bg-[#ffb538]">
                            <IcCart className="h-4 w-4" />
                          </button>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ),
        )}
        {typing && (
          <div className="flex justify-start">
            <span className="inline-flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-white/10 bg-ink/70 px-4 py-3">
              {[0, 1, 2].map((i) => (
                <span key={i} className="typing-dot h-1.5 w-1.5 rounded-full bg-amber" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </span>
          </div>
        )}
      </div>

      {/* quick prompts */}
      <div className="flex flex-wrap gap-2 border-t border-white/10 px-4 pt-3">
        {prompts.map((q) => (
          <button key={q} type="button" onClick={() => send(q)}
            className="rounded-full border border-white/15 px-3 py-1.5 text-[11.5px] font-bold text-white/70 transition hover:border-amber hover:text-amber">
            {q}
          </button>
        ))}
      </div>

      {/* input */}
      <form
        className="flex gap-2 p-4"
        onSubmit={(e) => { e.preventDefault(); send(input); }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. “A laptop for school under KSh 60,000”"
          aria-label="Ask NOVA what you need"
          className="h-11 w-full rounded-xl border border-white/15 bg-ink/60 px-4 text-sm font-semibold text-white outline-none placeholder:text-white/35 focus:border-amber"
        />
        <button type="submit" className="btn btn-amber !px-4" aria-label="Send message" disabled={typing || !input.trim()}>
          <IcSend className="h-4.5 w-4.5" />
        </button>
      </form>
      <p className="border-t border-white/10 bg-ink/40 px-4 py-2 text-center text-[10.5px] font-bold text-white/35">
        Grounded in live website data · official prices only · never invents specs
      </p>
    </div>
  );
}
