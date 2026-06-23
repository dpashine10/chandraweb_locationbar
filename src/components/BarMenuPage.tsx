"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Search, RotateCcw, Phone, Wine, Beer, Martini, ChevronDown } from "lucide-react";

interface BarItem {
  id: string;
  category: string;
  name: string;
  price: string;
  quantity?: string;
  description?: string;
  available: boolean;
}

const WAITER_PHONE = "+91 91588 99631";

// ── Palette ───────────────────────────────────────────────────
const R = {
  red:         "#c0392b",
  redBright:   "#e74c3c",
  redGlow:     "rgba(192,57,43,0.18)",
  redBorder:   "rgba(192,57,43,0.35)",
  redFaint:    "rgba(192,57,43,0.10)",
  bg:          "#0a0000",
  bgCard:      "rgba(255,255,255,0.028)",
  bgCardHover: "rgba(255,255,255,0.048)",
  border:      "rgba(192,57,43,0.22)",
  borderFaint: "rgba(192,57,43,0.12)",
  ink:         "#fff0ee",
  inkMuted:    "rgba(255,240,238,0.60)",
  inkFaint:    "rgba(255,240,238,0.38)",
  pill:        "rgba(255,255,255,0.05)",
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function normalizeQty(raw: string): string {
  const n = parseInt(raw.trim().replace(/\s+/g, "").replace(/ml/i, ""), 10);
  return isNaN(n) ? raw.trim() : `${n} ml`;
}

function isValidQty(q?: string): q is string {
  if (!q) return false;
  const t = q.trim().toLowerCase();
  return t !== "" && t !== "nan";
}

function CatIcon({ cat, size = 26, color = R.redBright }: { cat: string; size?: number; color?: string }) {
  const c = cat.toLowerCase();
  const props = { size, style: { color } };
  if (c.includes("wine")) return <Wine {...props} />;
  if (c.includes("beer")) return <Beer {...props} />;
  return <Martini {...props} />;
}

// ── Photo with graceful fallback ──────────────────────────────
function BarPhoto({
  name, className, sizes, fallbackSize = 28,
}: { name: string; className?: string; sizes: string; fallbackSize?: number }) {
  const [err, setErr] = useState(false);
  const src = `/bar_images/${slugify(name)}.jpg`;

  if (err) {
    return (
      <div className={`flex items-center justify-center ${className ?? ""}`}
        style={{ background: "linear-gradient(135deg,#1a0000,rgba(192,57,43,0.25))" }}>
        <Martini size={fallbackSize} style={{ color: "rgba(192,57,43,0.45)" }} />
      </div>
    );
  }
  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      <Image src={src} alt={name} fill sizes={sizes}
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        onError={() => setErr(true)} />
    </div>
  );
}

// ── Multi-quantity row: image left, name + qty pills right ────
function MultiQtyRow({ name, variants }: {
  name: string;
  variants: { qty: string; price: string }[];
}) {
  const sorted = [...variants]
    .sort((a, b) => (parseInt(a.qty.replace(/\D/g, "")) || 0) - (parseInt(b.qty.replace(/\D/g, "")) || 0))
    .filter((v, i, arr) => arr.findIndex(u => normalizeQty(u.qty) === normalizeQty(v.qty)) === i);

  return (
    <div className="group flex gap-4 px-4 py-4 border-b last:border-0 transition-colors"
      style={{ borderColor: R.borderFaint }}>

      {/* Image */}
      <BarPhoto name={name}
        className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-2xl ring-1"
        sizes="112px"
        fallbackSize={26} />

      {/* Right side */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <p className="font-semibold text-sm sm:text-base leading-snug mb-3"
          style={{ color: R.ink }}>
          {name}
        </p>

        {/* Size + price chips */}
        <div className="flex flex-wrap gap-2">
          {sorted.map((v) => (
            <div key={v.qty}
              className="flex flex-col items-center rounded-xl px-3 py-2 min-w-[58px] border transition-colors"
              style={{ background: R.redFaint, borderColor: R.redBorder }}>
              <span className="text-[10px] font-bold tracking-wider uppercase mb-0.5"
                style={{ color: R.inkFaint }}>
                {normalizeQty(v.qty)}
              </span>
              <span className="text-sm font-bold" style={{ color: R.redBright }}>
                {v.price}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Single item row ───────────────────────────────────────────
function ItemRow({ item, showPhoto }: { item: BarItem; showPhoto: boolean }) {
  const qty = isValidQty(item.quantity) ? normalizeQty(item.quantity!) : null;

  if (showPhoto) {
    return (
      <div className="group flex gap-4 px-4 py-4 border-b last:border-0 transition-colors"
        style={{ borderColor: R.borderFaint }}>
        <BarPhoto name={item.name}
          className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-2xl ring-1"
          sizes="112px" />
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <p className="font-semibold text-sm sm:text-base leading-snug mb-1" style={{ color: R.ink }}>
              {item.name}
            </p>
            {qty && <p className="text-xs font-medium" style={{ color: R.inkFaint }}>{qty}</p>}
            {item.description && (
              <p className="text-xs mt-1" style={{ color: R.inkFaint }}>{item.description}</p>
            )}
          </div>
          <span className="font-bold text-base sm:text-lg mt-2" style={{ color: R.redBright }}>
            {item.price}
          </span>
        </div>
      </div>
    );
  }

  // Compact text row (Small picks)
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5 border-b last:border-0"
      style={{ borderColor: R.borderFaint }}>
      <div className="min-w-0">
        <p className="font-semibold text-sm sm:text-base" style={{ color: R.ink }}>{item.name}</p>
        {qty && <p className="text-xs mt-0.5" style={{ color: R.inkFaint }}>{qty}</p>}
      </div>
      <span className="font-bold text-base whitespace-nowrap shrink-0" style={{ color: R.redBright }}>
        {item.price}
      </span>
    </div>
  );
}

// ── Category banner ───────────────────────────────────────────
function CategoryBanner({ cat }: { cat: string }) {
  const [err, setErr] = useState(false);
  const src = `/bar_images/category-${slugify(cat)}.jpg`;

  return (
    <>
      {!err ? (
        <>
          <Image src={src} alt={cat} fill className="object-cover" sizes="900px"
            onError={() => setErr(true)} />
          <div className="absolute inset-0"
            style={{ background: "linear-gradient(to right,rgba(0,0,0,0.94),rgba(0,0,0,0.6) 55%,rgba(192,57,43,0.15))" }} />
        </>
      ) : (
        <div className="absolute inset-0"
          style={{ background: `linear-gradient(120deg, #0a0000 0%, #1a0000 50%, rgba(192,57,43,0.25) 100%)` }} />
      )}
      {/* Red accent line at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5"
        style={{ background: `linear-gradient(to right, ${R.red}, transparent)` }} />
    </>
  );
}

// ── Category section ──────────────────────────────────────────
function CategorySection({ cat, items }: { cat: string; items: BarItem[] }) {
  const NO_PHOTO_ITEMS = ["big cigarette", "small cigarette", "moong dal masala" , "ground nut fry" , "ground nut fry masala"];
  const isSmallPicks = cat.toLowerCase() === "small picks";

  const rows = useMemo(() => {
    const grouped = new Map<string, BarItem[]>();
    items.forEach(item => {
      const k = item.name.trim().toLowerCase();
      if (!grouped.has(k)) grouped.set(k, []);
      grouped.get(k)!.push(item);
    });

    const result: Array<
      | { type: "single"; item: BarItem }
      | { type: "multi"; name: string; variants: { qty: string; price: string }[] }
    > = [];
    const emitted = new Set<string>();

    items.forEach(item => {
      const k = item.name.trim().toLowerCase();
      if (emitted.has(k)) return;
      emitted.add(k);

      const group = grouped.get(k)!;
      const withQty = group.filter(i => isValidQty(i.quantity));

      if (group.length > 1 && withQty.length > 1) {
        result.push({ type: "multi", name: item.name.trim(), variants: withQty.map(i => ({ qty: i.quantity!, price: i.price })) });
      } else {
        result.push({ type: "single", item });
      }
    });

    return result;
  }, [items]);

  return (
    <section className="mb-8">
      {/* Banner */}
      <div className="relative rounded-[1.75rem] overflow-hidden h-28 sm:h-36 mb-4 border"
        style={{ borderColor: R.redBorder }}>
        <CategoryBanner cat={cat} />
        <div className="absolute inset-0 flex items-center gap-4 px-7">
          <CatIcon cat={cat} size={32} />
          <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold tracking-wide drop-shadow-lg"
            style={{ color: "#fff" }}>
            {cat}
          </h2>
        </div>
      </div>

      {/* Items card */}
      <div className="rounded-[1.5rem] border overflow-hidden"
        style={{ background: R.bgCard, borderColor: R.border }}>
        {/* Count */}
        <div className="flex items-center justify-between px-5 py-3 border-b"
          style={{ borderColor: R.borderFaint, background: R.redFaint }}>
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase"
            style={{ color: R.inkFaint }}>
            {items.length} {items.length === 1 ? "Pour" : "Pours"}
          </span>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: R.red }} />
        </div>

        {rows.map((row, i) =>
          row.type === "multi"
            ? <MultiQtyRow key={`${row.name}-${i}`} name={row.name} variants={row.variants} />
            : <ItemRow key={row.item.id} item={row.item} showPhoto={!NO_PHOTO_ITEMS.includes(row.item.name.toLowerCase())} />
        )}
      </div>
    </section>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function BarMenuPage() {
  const [items, setItems]           = useState<BarItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [loadError, setLoadError]   = useState(false);
  const [logoError, setLogoError]   = useState(false);
  const [query, setQuery]           = useState("");
  const [activeCategory, setActiveCat] = useState("ALL");
  const [pastHero, setPastHero]     = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);

  useEffect(() => {
    const THRESHOLD = 160;
    const onScroll = () => {
      const past = window.scrollY > THRESHOLD;
      setPastHero(prev => { if (past !== prev) setFiltersOpen(!past); return past; });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const loadMenu = () => {
    setLoading(true); setLoadError(false);
    fetch("/api/admin/bar/menu")
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => { setItems(data); setLoading(false); })
      .catch(() => { setLoadError(true); setLoading(false); });
  };

  useEffect(() => { loadMenu(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const categories = useMemo(() => Array.from(new Set(items.map(i => i.category))), [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(item => {
      if (!item.available) return false;
      if (q && !item.name.toLowerCase().includes(q) && !item.category.toLowerCase().includes(q)) return false;
      if (activeCategory !== "ALL" && item.category !== activeCategory) return false;
      return true;
    });
  }, [items, query, activeCategory]);

  const grouped = useMemo(() => {
    const map = new Map<string, BarItem[]>();
    filtered.forEach(item => {
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category)!.push(item);
    });
    return map;
  }, [filtered]);

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach(i => { if (i.available) map.set(i.category, (map.get(i.category) ?? 0) + 1); });
    return map;
  }, [items]);

  const hasFilters = query !== "" || activeCategory !== "ALL";
  const filterCount = (query.trim() ? 1 : 0) + (activeCategory !== "ALL" ? 1 : 0);

  return (
    <div className="min-h-screen" style={{ background: R.bg }}>

      {/* Subtle red noise texture overlay */}
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: "radial-gradient(ellipse at top,rgba(120,0,0,0.18) 0%,transparent 65%)" }} />

      {/* ── HEADER ── */}
      <header className="relative z-10 px-4 pt-8 pb-6 sm:pt-10 sm:pb-8">
        <div className="max-w-5xl mx-auto rounded-[2.25rem] border backdrop-blur-xl px-6 sm:px-10 py-8 sm:py-10 relative overflow-hidden"
          style={{ background: "rgba(15,0,0,0.7)", borderColor: R.redBorder,
            boxShadow: `0 0 80px rgba(192,57,43,0.12), 0 20px 60px rgba(0,0,0,0.7)` }}>

          {/* Decorative red glow behind logo */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 blur-3xl -z-0 pointer-events-none"
            style={{ background: "rgba(192,57,43,0.14)" }} />

          {/* Logo */}
          <div className="relative z-10 flex justify-center mb-6">
            <div className="relative w-[240px] h-[110px] rounded-2xl overflow-hidden ring-1"
              style={{ background: "#000", ringColor: undefined } as React.CSSProperties}>
              {!logoError ? (
                <Image src="/logo.png" alt="Chandra Hotel & Restaurant" width={240} height={110}
                  priority className="w-full h-full object-cover"
                  onError={() => setLogoError(true)} />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-2xl font-bold" style={{ color: R.red }}>CH</span>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="relative z-10 text-center max-w-2xl mx-auto">
            <p className="text-xs font-bold tracking-[0.35em] uppercase mb-3"
              style={{ color: R.redBright }}>
              BAR MENU
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-6xl mb-3 leading-tight"
              style={{ color: "#fff" }}>
              Chandra{" "}
              <span className="italic" style={{
                color: R.red,
                textShadow: `0 0 40px rgba(192,57,43,0.5)`,
              }}>
                Bar
              </span>
            </h1>
            <p className="text-sm sm:text-base leading-relaxed" style={{ color: R.inkMuted }}>
              All the drinks that we serve.
            </p>

            <a href={`tel:${WAITER_PHONE.replace(/\s+/g, "")}`}
              className="inline-flex items-center gap-2 mt-5 text-xs font-semibold rounded-full px-5 py-2.5 border transition-all hover:brightness-110"
              style={{ color: R.ink, borderColor: R.redBorder, background: R.redFaint }}>
              <Phone size={14} style={{ color: R.redBright }} />
              Call for more info — {WAITER_PHONE}
            </a>
          </div>
        </div>
      </header>

      {/* ── STICKY FILTERS ── */}
      <div className="sticky top-0 z-30 px-4 transition-[padding] duration-300 ease-out"
        style={{
          paddingTop: filtersOpen ? "0.875rem" : "0.5rem",
          paddingBottom: filtersOpen ? "0.875rem" : "0.5rem",
          background: "rgba(8,0,0,0.92)",
          backdropFilter: "blur(20px)",
          borderBottom: filtersOpen ? `1px solid ${R.redBorder}` : "1px solid transparent",
        }}>
        <div className="max-w-5xl mx-auto">

          {/* Collapsed pill */}
          <button onClick={() => setFiltersOpen(true)} aria-hidden={filtersOpen}
            className="w-full flex items-center justify-between gap-3 rounded-full border shadow-sm transition-all duration-300 ease-out overflow-hidden"
            style={{
              borderColor: R.redBorder, background: R.bgCard,
              maxHeight: filtersOpen ? "0px" : "48px",
              opacity: filtersOpen ? 0 : 1,
              padding: filtersOpen ? "0 1.25rem" : "0.75rem 1.25rem",
              pointerEvents: filtersOpen ? "none" : "auto",
            }}>
            <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: R.ink }}>
              <Search size={15} style={{ color: R.red }} />
              {hasFilters ? "Filters applied" : "Search & filter"}
              {filterCount > 0 && (
                <span className="w-5 h-5 grid place-items-center rounded-full text-[10px] font-bold"
                  style={{ background: R.red, color: "#fff" }}>
                  {filterCount}
                </span>
              )}
            </span>
            <span className="text-xs font-semibold" style={{ color: R.red }}>Tap to open</span>
          </button>

          {/* Expanded filters */}
          <div aria-hidden={!filtersOpen}
            className="flex flex-col gap-3 rounded-[1.75rem] border transition-all duration-300 ease-out overflow-hidden"
            style={{
              background: "rgba(15,0,0,0.6)", borderColor: R.border,
              maxHeight: filtersOpen ? "320px" : "0px",
              opacity: filtersOpen ? 1 : 0,
              padding: filtersOpen ? "1rem 1.25rem" : "0 1.25rem",
            }}>

            {pastHero && (
              <button onClick={() => setFiltersOpen(false)}
                className="self-end -mb-1 text-xs font-semibold"
                style={{ color: R.inkFaint }}>
                Collapse ✕
              </button>
            )}

            {/* Search */}
            <div className="relative">
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2"
                style={{ color: R.red }} />
              <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search spirits, cocktails..."
                aria-label="Search bar menu"
                className="w-full rounded-full border text-sm focus:outline-none pl-11 pr-10 py-3 font-medium transition-all"
                style={{
                  background: R.pill, color: R.ink,
                  borderColor: query ? R.redBorder : R.borderFaint,
                }} />
              {query && (
                <button onClick={() => setQuery("")} aria-label="Clear"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 grid place-items-center rounded-full text-xs font-bold"
                  style={{ background: R.redFaint, color: R.inkFaint }}>
                  ✕
                </button>
              )}
            </div>

            {/* Category dropdown */}
            <div className="relative">
              <select id="bar-cat" value={activeCategory}
                onChange={e => setActiveCat(e.target.value)}
                className="w-full appearance-none rounded-full border px-4 py-3 pr-11 font-medium text-sm focus:outline-none transition-all"
                style={{
                  background: R.pill, color: R.ink,
                  borderColor: activeCategory !== "ALL" ? R.redBorder : R.borderFaint,
                }}>
                <option value="ALL" style={{ background: "#0a0000" }}>All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat} style={{ background: "#0a0000" }}>
                    {cat} ({categoryCounts.get(cat) ?? 0})
                  </option>
                ))}
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
                style={{ color: R.inkFaint }} />
            </div>

            {hasFilters && (
              <button onClick={() => { setQuery(""); setActiveCat("ALL"); }}
                className="self-start inline-flex items-center gap-1.5 text-xs font-semibold"
                style={{ color: R.red }}>
                <RotateCcw size={12} /> Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-28">
            <Martini size={44} className="mx-auto mb-4 animate-pulse" style={{ color: R.red }} />
            <p className="text-lg font-semibold" style={{ color: R.inkMuted }}>
              Uncorking the menu…
            </p>
          </div>
        ) : loadError ? (
          <div className="text-center py-24 rounded-2xl" style={{ background: R.redFaint }}>
            <p className="font-[family-name:var(--font-display)] text-2xl font-bold mb-2" style={{ color: R.ink }}>
              Could not load the bar menu
            </p>
            <p className="mb-5" style={{ color: R.inkMuted }}>Check your connection and try again.</p>
            <button onClick={loadMenu}
              className="inline-flex items-center gap-2 font-semibold text-sm px-5 py-2.5 rounded-full text-white"
              style={{ background: R.red }}>
              <RotateCcw size={14} /> Try again
            </button>
          </div>
        ) : grouped.size === 0 ? (
          <div className="text-center py-24 rounded-2xl" style={{ background: R.redFaint }}>
            <p className="font-[family-name:var(--font-display)] text-2xl font-bold mb-2" style={{ color: R.ink }}>
              Nothing found
            </p>
            <p style={{ color: R.inkMuted }}>Try a different search or category.</p>
            {hasFilters && (
              <button onClick={() => { setQuery(""); setActiveCat("ALL"); }}
                className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full mt-5 border"
                style={{ color: R.red, borderColor: R.redBorder, background: R.redFaint }}>
                <RotateCcw size={13} /> Clear filters
              </button>
            )}
          </div>
        ) : (
          <div>
            {Array.from(grouped.entries()).map(([cat, catItems]) => (
              <CategorySection key={cat} cat={cat} items={catItems} />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 rounded-[1.75rem] p-6 text-sm border"
          style={{ background: "rgba(15,0,0,0.6)", borderColor: R.redBorder }}>
          <div className="flex items-center gap-3 mb-4">
            <Martini size={18} style={{ color: R.red }} />
            <p className="font-bold text-base" style={{ color: R.ink }}>Please Note</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" style={{ color: R.inkMuted }}>
            <p>✓ Must be of legal drinking age</p>
            <p>✓ No outside alcohol allowed</p>
            <p>✓ Please drink responsibly</p>
            <p>✓ We reserve the right to refuse service</p>
          </div>
          <p className="pt-4 text-center font-bold" style={{ color: R.red }}>
            🥃 Have fun and drink responsibly
          </p>
        </div>
      </main>
    </div>
  );
}