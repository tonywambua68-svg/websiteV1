import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { byId } from "../data/products";
import { useStore } from "../lib/store";
import { useAuth } from "../lib/AuthContext";
import { createMemory, novaAsk, type NovaResponse } from "../lib/nova/engine";
import ProductArt from "./ProductArt";
import { IcArrowR, IcCart, IcSpark, IcX } from "./Icons";

interface Msg { role: "user" | "bot"; text: string; res?: NovaResponse }

const QUICK = [
  "Best laptop under KSh 40,000 for school",
  "How do I pay with M-PESA?",
  "Delivery times?",
  "Where is my order?",
];

/**
 * NOVA — the floating customer assistant (bottom-right). It talks to the
 * same engine as the homepage finder, so behaviour and truth-policy are
 * identical everywhere.
 */
export default function NovaChat() {
  const { orders, addToCart } = useStore();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const memory = useRef(createMemory());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, typing, open]);

  const send = (raw: string) => {
    const q = raw.trim();
    if (!q || typing) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setTyping(true);
    window.setTimeout(() => {
      const res = novaAsk(q, memory.current, { user, orders });
      setMsgs((m) => [...m, { role: "bot", text: res.text, res }]);
      setTyping(false);
    }, 650 + Math.random() * 450);
  };

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close NOVA assistant" : "Open NOVA assistant"}
        className="group fixed bottom-20 right-4 z-[64] flex h-14 items-center gap-2 rounded-full bg-teal pl-4 pr-5 font-display text-sm font-bold text-white shadow-[0_14px_34px_-10px_rgba(11,122,99,0.6)] transition hover:bg-tealdeep md:bottom-6 md:right-6"
      >
        <span className="relative grid h-7 w-7 place-items-center">
          {!open && <span className="absolute inset-0 animate-ping-soft rounded-full bg-amber/70" />}
          <IcSpark className={`relative h-5 w-5 text-amber transition-transform ${open ? "rotate-90" : "group-hover:rotate-12"}`} />
        </span>
        {open ? "Close" : "NOVA"}
      </button>

      {/* Panel */}
      {open && (
        <div className="animate-pop fixed bottom-[9.5rem] right-2 z-[66] flex h-[min(70vh,560px)] w-[calc(100vw-1rem)] max-w-[380px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-pine shadow-[0_30px_80px_-24px_rgba(0,0,0,0.7)] md:bottom-24 md:right-6">
          {/* Header */}
          <div className="flex items-center gap-2.5 border-b border-white/10 bg-ink/70 px-4 py-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal"><IcSpark className="h-4.5 w-4.5 text-amber" /></span>
            <div className="flex-1 leading-tight">
              <p className="font-display text-[15px] font-bold text-white">NOVA</p>
              <p className="flex items-center gap-1.5 text-[10.5px] font-bold text-white/50">
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> Online · answers from live website data
              </p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close NOVA" className="grid h-8 w-8 place-items-center rounded-lg text-white/50 transition hover:bg-white/10 hover:text-white">
              <IcX className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3.5">
            {msgs.length === 0 && (
              <div className="rounded-xl border border-white/10 bg-ink/60 p-3.5 text-[13px] font-semibold leading-relaxed text-white/75">
                Karibu! I'm <b className="text-amber">NOVA</b> — ask me about products, specs, budgets,
                M-PESA payments, delivery or your order. I only quote what's on the website; I never invent
                prices or specs.
              </div>
            )}
            {msgs.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <p className="max-w-[85%] rounded-2xl rounded-br-md bg-amber px-3.5 py-2.5 text-[13px] font-semibold leading-relaxed text-ink">{m.text}</p>
                </div>
              ) : (
                <div key={i} className="flex flex-col gap-2">
                  <p className="max-w-[92%] whitespace-pre-line rounded-2xl rounded-bl-md border border-white/10 bg-ink/70 px-3.5 py-2.5 text-[13px] font-semibold leading-relaxed text-white/85">{m.text}</p>
                  {m.res?.recs && (
                    <div className="grid gap-2">
                      {m.res.recs.map(({ p, reasons }) => {
                        const src = byId(p.id);
                        return (
                        <div key={p.id} className="flex gap-2.5 rounded-xl border border-white/10 bg-ink/70 p-2.5">
                          <span className="grid h-14 w-16 shrink-0 place-items-center overflow-hidden rounded-lg" style={{ background: `linear-gradient(150deg, ${src?.hue ?? "#0b7a63"}33, transparent)` }}>
                            {src ? <ProductArt kind={src.art} accent={src.hue} className="h-[125%]" /> : null}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[12.5px] font-extrabold text-white">{p.name}</span>
                            <span className="block font-display text-[12.5px] font-bold text-amber">{p.price}</span>
                            <span className="mt-0.5 block truncate text-[10.5px] font-semibold text-white/50">{reasons[0]}</span>
                          </span>
                          <span className="flex flex-col justify-center gap-1.5">
                            <Link to={`/product/${p.id}`} onClick={() => setOpen(false)} aria-label={`View ${p.name}`} className="grid h-7 w-7 place-items-center rounded-lg border border-white/15 text-white/70 transition hover:border-amber hover:text-amber">
                              <IcArrowR className="h-3.5 w-3.5" />
                            </Link>
                            <button type="button" onClick={() => addToCart(p.id, 1)} aria-label={`Add ${p.name} to cart`} className="grid h-7 w-7 place-items-center rounded-lg bg-amber text-ink transition hover:bg-[#ffb538]">
                              <IcCart className="h-3.5 w-3.5" />
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
              <div className="flex">
                <span className="inline-flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-white/10 bg-ink/70 px-3.5 py-2.5">
                  {[0, 1, 2].map((i) => <span key={i} className="typing-dot h-1.5 w-1.5 rounded-full bg-amber" style={{ animationDelay: `${i * 0.15}s` }} />)}
                </span>
              </div>
            )}
          </div>

          {/* Quick prompts */}
          <div className="flex gap-1.5 overflow-x-auto border-t border-white/10 px-3 pt-2.5 no-scrollbar">
            {QUICK.map((q) => (
              <button key={q} type="button" onClick={() => send(q)} className="shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-bold text-white/70 transition hover:border-amber hover:text-amber">
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <form className="flex gap-2 p-3" onSubmit={(e) => { e.preventDefault(); send(input); }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask NOVA about products, payments, delivery…"
              aria-label="Ask NOVA"
              className="h-10 flex-1 rounded-xl border border-white/15 bg-ink/60 px-3.5 text-[13px] font-semibold text-white outline-none placeholder:text-white/35 focus:border-amber"
            />
            <button type="submit" disabled={typing || !input.trim()} className="btn btn-amber !h-10 !px-4" aria-label="Send">
              <IcArrowR className="h-4 w-4" />
            </button>
          </form>
          <p className="border-t border-white/10 bg-ink/40 px-4 py-2 text-center text-[10px] font-bold text-white/35">
            NOVA quotes official website prices only · never internal costs
          </p>
        </div>
      )}
    </>
  );
}
