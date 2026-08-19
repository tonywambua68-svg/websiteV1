import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fmt, PRODUCTS, type Product, type CategoryId } from "../data/products";
import { AI_QUICK_PROMPTS } from "../data/content";
import ProductArt from "./ProductArt";
import { IcArrowR, IcSend, IcSpark } from "./Icons";

interface Msg { role: "user" | "bot"; text: string; recs?: { p: Product; reasons: string[] }[] }

const CAT_WORDS: Record<string, CategoryId[]> = {
  laptop: ["laptops"], notebook: ["laptops"], computer: ["laptops", "gaming"], pc: ["gaming", "laptops"],
  phone: ["phones"], smartphone: ["phones"], simu: ["phones"], mobile: ["phones"],
  tablet: ["tablets"], gaming: ["gaming"], game: ["gaming"], console: ["gaming"],
  headphone: ["audio"], earbud: ["audio"], earphone: ["audio"], music: ["audio"], speaker: ["audio"], audio: ["audio"],
  monitor: ["monitors"], screen: ["monitors"], tv: ["monitors"], television: ["monitors"], display: ["monitors"],
  router: ["networking"], wifi: ["networking"], internet: ["networking"], mesh: ["networking"],
  watch: ["smart"], smartwatch: ["smart"], camera: ["smart"], webcam: ["smart"],
  charger: ["accessories"], power: ["accessories"], storage: ["accessories"], ssd: ["accessories"], accessory: ["accessories"], accessories: ["accessories"], keyboard: ["accessories", "gaming"], mouse: ["accessories", "gaming"], printer: ["accessories"],
};

const USE_CASES: { words: string[]; label: string; score: (p: Product) => number }[] = [
  { words: ["gaming", "games", "play", "esports", "fortnite", "fifa"], label: "Strong dedicated graphics for gaming", score: (p) => (p.graphics && /rx-\d/i.test(p.graphics) ? 60 : p.category === "gaming" ? 40 : 0) },
  { words: ["programming", "coding", "developer", "code"], label: "16GB+ RAM for compiling & multitasking", score: (p) => (p.ram && parseInt(p.ram) >= 16 ? 45 : 10) },
  { words: ["student", "school", "campus", "university", "college"], label: "Light, long battery life for campus days", score: (p) => (p.battery && parseInt(p.battery) >= 10 ? 35 : 15) + (p.price < 60000 ? 20 : 0) },
  { words: ["camera", "photo", "photography", "pictures"], label: "Class-leading camera hardware", score: (p) => (p.specs.some(([k, v]) => /camera/i.test(k) && /MP/.test(v)) ? 40 : 0) },
  { words: ["work", "office", "business"], label: "Reliable performance for work", score: () => 20 },
  { words: ["movie", "movies", "films", "netflix", "entertainment"], label: "Great display & speakers for media", score: (p) => (p.art === "tv" || p.art === "monitor" || p.art === "tablet" ? 40 : 5) },
];

function analyse(input: string): { cats: CategoryId[]; budget: number | null; scoreUse: (p: Product) => { s: number; labels: string[] } } {
  const t = input.toLowerCase();
  const cats = new Set<CategoryId>();
  for (const [word, ids] of Object.entries(CAT_WORDS)) {
    if (t.includes(word)) ids.forEach((c) => cats.add(c));
  }
  let budget: number | null = null;
  const km = t.match(/(\d{1,4})\s*k\b/);
  const full = t.match(/(\d[\d,]{3,})/);
  if (km) budget = parseInt(km[1]) * 1000;
  else if (full) budget = parseInt(full[1].replace(/,/g, ""));
  const scoreUse = (p: Product) => {
    let s = 0;
    const labels: string[] = [];
    for (const uc of USE_CASES) {
      if (uc.words.some((w) => t.includes(w))) {
        const v = uc.score(p);
        if (v > 0) { s += v; labels.push(uc.label); }
      }
    }
    return { s, labels };
  };
  return { cats: [...cats], budget, scoreUse };
}

function recommend(input: string): Msg {
  const { cats, budget, scoreUse } = analyse(input);

  if (cats.length === 0) {
    return {
      role: "bot",
      text: "I can help with laptops, phones, gaming gear, audio, monitors, networking and more. What are you shopping for — and roughly what's your budget in KSh?",
    };
  }

  const pool = PRODUCTS.filter((p) => cats.includes(p.category) && p.stock > 0);
  const scored = pool
    .map((p) => {
      const { s } = scoreUse(p);
      let score = 30 + s;
      if (budget !== null) {
        if (p.price > budget) score -= 90;
        else score += 15 + (budget - p.price < budget * 0.25 ? 15 : 0); // reward good value near the ceiling
      }
      return { p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (scored.length === 0) {
    return { role: "bot", text: "Hmm, I couldn't find anything in that category right now. Try “laptops”, “phones” or “audio”." };
  }

  const recs = scored.map(({ p }) => {
    const reasons: string[] = [];
    if (budget !== null) {
      reasons.push(p.price <= budget ? `Fits your ${fmt(budget)} budget with ${fmt(budget - p.price)} to spare` : `Slightly above budget — included because it's a strong match`);
    }
    reasons.push(...scoreUse(p).labels.slice(0, 2));
    reasons.push(`${p.warranty} · genuine, sealed stock`);
    return { p, reasons: [...new Set(reasons)].slice(0, 3) };
  });

  return {
    role: "bot",
    text: budget !== null
      ? `Here are ${recs.length} options under ${fmt(budget)} that match what you described:`
      : `Here are my top ${recs.length} picks for you:`,
    recs,
  };
}

export default function AIFinder() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "bot", text: "Karibu! I'm Zuri — Imara's shopping assistant. Tell me what you need and your budget, and I'll shortlist the best match. (Frontend demo — no real AI behind the curtain.)" },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      setMessages((m) => [...m, recommend(q)]);
      setTyping(false);
    }, 1000 + Math.random() * 500);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-pine/60 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]">
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-ink/60 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-error/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/80" />
        <span className="ml-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-white/50">
          <IcSpark className="h-4 w-4 text-amber" /> Zuri · AI Product Finder
        </span>
        <span className="ml-auto rounded-full bg-success/15 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-success">Online</span>
      </div>

      {/* messages */}
      <div ref={scrollRef} className="h-80 space-y-4 overflow-y-auto p-4 md:h-96 md:p-5" aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[88%] md:max-w-[78%] ${m.role === "user" ? "text-right" : ""}`}>
              <div className={`inline-block rounded-2xl px-4 py-2.5 text-left text-[13.5px] font-semibold leading-relaxed ${
                m.role === "user" ? "rounded-br-md bg-amber text-ink" : "rounded-bl-md border border-white/10 bg-ink/70 text-white/90"
              }`}>
                {m.text}
              </div>
              {m.recs && (
                <div className="mt-3 grid gap-2.5">
                  {m.recs.map(({ p, reasons }) => (
                    <div key={p.id} className="flex gap-3 rounded-xl border border-white/10 bg-ink/70 p-3 text-left">
                      <span className="grid h-16 w-20 shrink-0 place-items-center overflow-hidden rounded-lg" style={{ background: `linear-gradient(150deg, ${p.hue}55, ${p.hue}18)` }}>
                        <ProductArt kind={p.art} accent={p.hue} className="h-[130%]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-extrabold text-white">{p.name}</span>
                        <span className="block font-display text-sm font-bold text-amber">{fmt(p.price)}</span>
                        <span className="mt-1 block space-y-0.5">
                          {reasons.map((r) => (
                            <span key={r} className="flex items-start gap-1.5 text-[11.5px] font-semibold text-white/55">
                              <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-teal" />{r}
                            </span>
                          ))}
                        </span>
                      </span>
                      <Link to={`/product/${p.id}`} className="self-center rounded-lg border border-white/15 p-2 text-white/70 transition hover:border-amber hover:text-amber" aria-label={`View ${p.name}`}>
                        <IcArrowR className="h-4 w-4" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
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
        {AI_QUICK_PROMPTS.map((q) => (
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
          aria-label="Ask Zuri what you need"
          className="h-11 w-full rounded-xl border border-white/15 bg-ink/60 px-4 text-sm font-semibold text-white outline-none placeholder:text-white/35 focus:border-amber"
        />
        <button type="submit" className="btn btn-amber !px-4" aria-label="Send message" disabled={typing}>
          <IcSend className="h-4.5 w-4.5" />
        </button>
      </form>
    </div>
  );
}
