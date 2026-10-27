import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, CornerDownLeft, Clock } from 'lucide-react';
import { useProductStore } from '@/store/productStore';
import { buildSuggestions, type Suggestion } from '@/lib/search';

const HISTORY_KEY = 'imara-search-history';

function loadHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function pushHistory(q: string) {
  const next = [q, ...loadHistory().filter((x) => x !== q)].slice(0, 6);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

interface SearchBoxProps {
  compact?: boolean; // mobile drawer variant
  onNavigate?: () => void;
}

export default function SearchBox({ compact = false, onNavigate }: SearchBoxProps) {
  const navigate = useNavigate();
  const allProducts = useProductStore((s) => s.allProducts);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [history, setHistory] = useState<string[]>(() => loadHistory());
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions: Suggestion[] = useMemo(
    () => (query.trim().length >= 2 ? buildSuggestions(allProducts, query.trim()) : []),
    [allProducts, query]
  );

  // Close on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const go = (to: string) => {
    onNavigate?.();
    setOpen(false);
    navigate(to);
  };

  const submit = (q: string) => {
    const term = q.trim();
    if (!term) return;
    pushHistory(term);
    setHistory(loadHistory());
    onNavigate?.();
    setOpen(false);
    navigate(`/shop?search=${encodeURIComponent(term)}`);
  };

  const showDropdown = open && (suggestions.length > 0 || (!query.trim() && history.length > 0));
  const items: Array<Suggestion | { kind: 'history'; label: string; to: string }> =
    suggestions.length > 0
      ? suggestions
      : history.map((h) => ({ kind: 'history' as const, label: h, to: `/shop?search=${encodeURIComponent(h)}` }));

  return (
    <div ref={wrapRef} className={`relative ${compact ? '' : 'max-w-md'}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (highlight >= 0 && items[highlight]) {
            const it = items[highlight];
            if (it.kind === 'history') submit(it.label);
            else go(it.to);
          } else {
            submit(query);
          }
        }}
        role="search"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlight(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHighlight((h) => Math.min(h + 1, items.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlight((h) => Math.max(h - 1, -1));
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
          placeholder="Search laptops, phones, gaming gear…"
          aria-label="Search products"
          aria-expanded={!!showDropdown}
          className={`w-full rounded-lg border border-line bg-mist pl-9 pr-9 text-sm font-medium text-ink outline-none transition placeholder:text-muted/70 focus:border-teal focus:bg-card ${
            compact ? 'h-11' : 'h-10'
          }`}
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-muted hover:bg-line/60 hover:text-ink"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </form>

      {showDropdown && (
        <div className="animate-pop absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-line bg-card shadow-[0_24px_48px_-20px_rgba(10,31,28,0.35)]">
          {!query.trim() && history.length > 0 && (
            <p className="border-b border-line px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted">
              Recent searches
            </p>
          )}
          <ul className="max-h-[340px] overflow-y-auto py-1.5" role="listbox">
            {items.map((it, i) => (
              <li key={`${it.kind}-${it.label}`}>
                <button
                  type="button"
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => (it.kind === 'history' ? submit(it.label) : go(it.to))}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] font-semibold transition ${
                    highlight === i ? 'bg-mist text-teal' : 'text-ink/85 hover:bg-mist'
                  }`}
                  role="option"
                  aria-selected={highlight === i}
                >
                  {it.kind === 'product' && it.image ? (
                    <img
                      src={it.image}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-md border border-line bg-mist object-contain p-0.5"
                    />
                  ) : it.kind === 'history' ? (
                    <Clock className="h-4 w-4 shrink-0 text-muted" />
                  ) : (
                    <Search className="h-4 w-4 shrink-0 text-teal" />
                  )}
                  <span className="min-w-0 flex-1 truncate">{it.label}</span>
                  {it.kind === 'product' && typeof it.price === 'number' ? (
                    <span className="shrink-0 text-[12px] font-extrabold text-ink">
                      KSh {it.price.toLocaleString()}
                    </span>
                  ) : it.kind === 'brand' || it.kind === 'category' ? (
                    <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted" />
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
          {query.trim() && suggestions.length === 0 && (
            <button
              type="button"
              onClick={() => submit(query)}
              className="block w-full border-t border-line bg-mist px-4 py-2.5 text-left text-[12.5px] font-bold text-teal hover:bg-mint"
            >
              No matches — search the whole shop for “{query.trim()}”
            </button>
          )}
        </div>
      )}
    </div>
  );
}
