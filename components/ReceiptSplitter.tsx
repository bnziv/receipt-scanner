"use client";

import { useState, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReceiptItem {
  name: string;
  price: number;
}

interface ReceiptData {
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
}

// ─── Color palette ────────────────────────────────────────────────────────────

const PALETTE = [
  { bg: "#dbeafe", border: "#93c5fd", text: "#1e40af" }, // blue
  { bg: "#d1fae5", border: "#6ee7b7", text: "#065f46" }, // green
  { bg: "#fce7f3", border: "#f9a8d4", text: "#9d174d" }, // pink
  { bg: "#fef3c7", border: "#fcd34d", text: "#92400e" }, // amber
  { bg: "#ede9fe", border: "#c4b5fd", text: "#5b21b6" }, // purple
  { bg: "#ffedd5", border: "#fdba74", text: "#9a3412" }, // orange
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function Avatar({ name, idx, size = 24 }: { name: string; idx: number; size?: number }) {
  const c = PALETTE[idx % PALETTE.length];
  return (
    <span
      style={{
        width: size, height: size, borderRadius: "50%",
        background: c.bg, color: c.text, border: `1px solid ${c.border}`,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.38, fontWeight: 600, flexShrink: 0,
      }}
    >
      {initials(name)}
    </span>
  );
}

function Badge({ children, idx }: { children: React.ReactNode; idx: number }) {
  const c = PALETTE[idx % PALETTE.length];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}
    >
      {children}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReceiptSplitter() {
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState("image/jpeg");

  const [people, setPeople] = useState<string[]>([]);
  const [colorMap, setColorMap] = useState<Record<string, number>>({});
  const [colorCounter, setColorCounter] = useState(0);
  const [personInput, setPersonInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [isError, setIsError] = useState(false);

  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [assignments, setAssignments] = useState<Record<number, string>>({});
  const [tax, setTax] = useState("");
  const [tip, setTip] = useState("");
  const [payer, setPayer] = useState("");
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  // ── File ──────────────────────────────────────────────────────────────────

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaType(file.type || "image/jpeg");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setImageBase64(url.split(",")[1]);
      setImageUrl(url);
    };
    reader.readAsDataURL(file);
  };

  // ── People ────────────────────────────────────────────────────────────────

  const addPerson = () => {
    const name = personInput.trim();
    if (!name || people.includes(name)) return;
    setPeople((p) => [...p, name]);
    setColorMap((m) => ({ ...m, [name]: colorCounter }));
    setColorCounter((n) => n + 1);
    setPersonInput("");
  };

  const removePerson = (name: string) => {
    setPeople((p) => p.filter((x) => x !== name));
    setAssignments((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (next[+k] === name) delete next[+k];
      });
      return next;
    });
    if (payer === name) setPayer("");
  };

  // ── Analyze ───────────────────────────────────────────────────────────────

  const analyze = async () => {
    if (!imageBase64 || !people.length) return;
    setLoading(true);
    setStatus("Reading receipt…");
    setIsError(false);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, mediaType }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data: ReceiptData = await res.json();
      setReceipt(data);
      setAssignments({});
      setTax(data.tax ? data.tax.toFixed(2) : "");
      setTip(data.tip ? data.tip.toFixed(2) : "");
      setStatus(`Found ${data.items.length} item${data.items.length !== 1 ? "s" : ""}. Assign them below.`);
    } catch {
      setIsError(true);
      setStatus("Couldn't read the receipt. Try a clearer photo.");
    } finally {
      setLoading(false);
    }
  };

  // ── Calculations ──────────────────────────────────────────────────────────

  const subtotal = receipt ? receipt.items.reduce((s, i) => s + i.price, 0) : 0;
  const taxVal = parseFloat(tax) || 0;
  const tipVal = parseFloat(tip) || 0;
  const total = subtotal + taxVal + tipVal;
  const ratio = subtotal > 0 ? total / subtotal : 1;

  const personTotals: Record<string, number> = {};
  people.forEach((p) => (personTotals[p] = 0));
  receipt?.items.forEach((item, i) => {
    const p = assignments[i];
    if (p && p in personTotals) personTotals[p] += item.price;
  });

  const canAnalyze = !!imageBase64 && people.length > 0 && !loading;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-xl mx-auto" onClick={() => setOpenDropdown(null)}>

      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-stone-800 flex items-center gap-2">
          🧾 Receipt Splitter
        </h1>
      </div>

      {/* Upload */}
      <div
        onClick={() => fileRef.current?.click()}
        className={`rounded-xl border-2 p-6 text-center cursor-pointer transition-colors mb-5 ${
          imageUrl
            ? "border-stone-400 bg-white"
            : "border-dashed border-stone-300 bg-white hover:border-stone-400 hover:bg-stone-50"
        }`}
      >
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt="Receipt preview"
              className="max-h-52 mx-auto rounded-lg object-contain mb-2"
            />
            <p className="text-xs text-stone-400">Click to change photo</p>
          </>
        ) : (
          <>
            <div className="text-4xl mb-2">📷</div>
            <p className="text-sm font-medium text-stone-600">Click to upload receipt photo</p>
            <p className="text-xs text-stone-400 mt-1">JPG, PNG, HEIC supported</p>
          </>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>

      {/* People */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
          People splitting the bill
        </label>
        {people.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {people.map((p) => (
              <Badge key={p} idx={colorMap[p] ?? 0}>
                <Avatar name={p} idx={colorMap[p] ?? 0} size={18} />
                {p}
                <button
                  onClick={(e) => { e.stopPropagation(); removePerson(p); }}
                  className="opacity-50 hover:opacity-100 text-base leading-none ml-0.5"
                  aria-label={`Remove ${p}`}
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={personInput}
            onChange={(e) => setPersonInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addPerson()}
            placeholder="Add a name…"
            maxLength={24}
          />
          <button
            onClick={addPerson}
            className="px-4 py-2 rounded-lg bg-stone-800 text-white text-sm font-medium hover:bg-stone-700 transition-colors whitespace-nowrap"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Analyze */}
      <button
        onClick={analyze}
        disabled={!canAnalyze}
        className="w-full py-2.5 rounded-lg border border-stone-300 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-2"
      >
        {loading ? (
          <><span className="animate-spin inline-block">⏳</span> Analyzing…</>
        ) : (
          <>✨ Analyze Receipt</>
        )}
      </button>
      {status && (
        <p className={`text-xs text-center mb-1 ${isError ? "text-red-500" : "text-stone-400"}`}>
          {status}
        </p>
      )}

      {/* ── Results ── */}
      {receipt && (
        <>
          <hr className="my-7 border-stone-200" />

          {/* Payer + tax/tip */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">
                Who paid the full bill?
              </label>
              <select value={payer} onChange={(e) => setPayer(e.target.value)}>
                <option value="">Select payer…</option>
                {people.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Tax ($)</label>
              <input
                type="number" value={tax} min="0" step="0.01" placeholder="0.00"
                onChange={(e) => setTax(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Tip ($)</label>
              <input
                type="number" value={tip} min="0" step="0.01" placeholder="0.00"
                onChange={(e) => setTip(e.target.value)}
              />
            </div>
          </div>

          {/* Items */}
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
            Items — tap to assign
          </p>
          <div className="rounded-xl border border-stone-200 bg-white overflow-visible mb-6">
            {/* Header row */}
            <div className="grid grid-cols-[1fr_72px_110px] gap-2 px-4 py-2 bg-stone-50 text-xs font-medium text-stone-400 uppercase tracking-wide">
              <span>Item</span>
              <span className="text-right">Price</span>
              <span className="text-right">Who</span>
            </div>

            {/* Item rows */}
            {receipt.items.map((item, i) => {
              const assigned = assignments[i];
              const c = assigned ? PALETTE[(colorMap[assigned] ?? 0) % PALETTE.length] : null;
              return (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_72px_110px] gap-2 px-4 py-3 border-t border-stone-100 items-center"
                >
                  <span className="text-sm text-stone-700">{item.name}</span>
                  <span className="text-sm text-stone-700 text-right">${item.price.toFixed(2)}</span>
                  <div
                    className="relative text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setOpenDropdown(openDropdown === i ? null : i)}
                      className="text-xs px-2.5 py-1 rounded-full border inline-flex items-center gap-1 transition-colors"
                      style={
                        assigned && c
                          ? { background: c.bg, borderColor: c.border, color: c.text }
                          : { background: "#f5f4f0", borderColor: "#d4d2c8", color: "#78716c" }
                      }
                    >
                      {assigned || "Assign"} ▾
                    </button>
                    {openDropdown === i && (
                      <div className="absolute right-0 top-[calc(100%+4px)] bg-white border border-stone-200 rounded-lg z-10 min-w-[140px] overflow-hidden shadow-sm">
                        <button
                          onClick={() => {
                            const next = { ...assignments };
                            delete next[i];
                            setAssignments(next);
                            setOpenDropdown(null);
                          }}
                          className="block w-full text-left px-3 py-2 text-xs text-stone-400 hover:bg-stone-50"
                        >
                          Unassigned
                        </button>
                        {people.map((p) => (
                          <button
                            key={p}
                            onClick={() => {
                              setAssignments((prev) => ({ ...prev, [i]: p }));
                              setOpenDropdown(null);
                            }}
                            className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm border-t border-stone-100 hover:bg-stone-50"
                            style={assignments[i] === p ? { color: "#1d4ed8", fontWeight: 500 } : { color: "#1a1a18" }}
                          >
                            <Avatar name={p} idx={colorMap[p] ?? 0} size={18} />
                            {p}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Totals */}
            <div className="px-4 py-2.5 border-t border-stone-200 flex justify-between text-xs text-stone-400">
              <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
            </div>
            {taxVal > 0 && (
              <div className="px-4 py-2 flex justify-between text-xs text-stone-400">
                <span>Tax</span><span>${taxVal.toFixed(2)}</span>
              </div>
            )}
            {tipVal > 0 && (
              <div className="px-4 py-2 flex justify-between text-xs text-stone-400">
                <span>Tip</span><span>${tipVal.toFixed(2)}</span>
              </div>
            )}
            <div className="px-4 py-3 border-t border-stone-200 flex justify-between text-sm font-semibold text-stone-700">
              <span>Total</span><span>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Split cards */}
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">
            What each person owes
          </p>
          <div className="grid grid-cols-2 gap-3">
            {people.map((p) => {
              const sub = personTotals[p];
              const due = sub * ratio;
              const taxShare = subtotal > 0 ? (sub / subtotal) * taxVal : 0;
              const tipShare = subtotal > 0 ? (sub / subtotal) * tipVal : 0;
              const isPayer = p === payer;
              const c = PALETTE[(colorMap[p] ?? 0) % PALETTE.length];
              return (
                <div
                  key={p}
                  className="rounded-xl p-4 bg-white border"
                  style={{ borderColor: isPayer ? c.border : "#e7e5e4", borderWidth: isPayer ? 2 : 1 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar name={p} idx={colorMap[p] ?? 0} size={24} />
                    <span className="text-xs text-stone-500 font-medium truncate">{p}</span>
                    {isPayer && (
                      <span
                        className="ml-auto text-xs px-2 py-0.5 rounded-full whitespace-nowrap"
                        style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
                      >
                        paid
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-semibold" style={{ color: isPayer ? c.text : "#1a1a18" }}>
                    ${due.toFixed(2)}
                  </div>
                  <div className="text-xs text-stone-400 mt-1.5 space-y-0.5">
                    <div>Items ${sub.toFixed(2)}</div>
                    <div>Tax ${taxShare.toFixed(2)}</div>
                    <div>Tip ${tipShare.toFixed(2)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
