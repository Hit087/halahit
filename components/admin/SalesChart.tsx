"use client";

import { useMemo, useState } from "react";
import { formatPrice } from "@/lib/utils";

type SalesDay = {
  date: string;
  total: number;
  orders: number;
};

const RANGES = [
  { days: 7, label: "7 أيام" },
  { days: 30, label: "30 يوم" },
  { days: 90, label: "90 يوم" },
];

function shortDate(date: string) {
  const [, m, d] = date.split("-");
  return `${d}/${m}`;
}

export function SalesChart({ days }: { days: SalesDay[] }) {
  const [range, setRange] = useState(30);
  const [selected, setSelected] = useState<number | null>(null);

  const data = useMemo(() => days.slice(-range), [days, range]);
  const max = useMemo(() => Math.max(0, ...data.map((d) => d.total)), [data]);
  const rangeTotal = useMemo(
    () => data.reduce((sum, d) => sum + d.total, 0),
    [data]
  );
  const rangeOrders = useMemo(
    () => data.reduce((sum, d) => sum + d.orders, 0),
    [data]
  );

  const picked = selected !== null ? data[selected] : null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              onClick={() => {
                setRange(r.days);
                setSelected(null);
              }}
              className={`rounded-luxury px-4 py-2 text-sm transition ${
                range === r.days
                  ? "bg-primary font-medium text-text"
                  : "bg-cream text-text/70 hover:bg-beige/60"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <p className="text-sm text-text/70">
          <span className="font-bold text-accent">{formatPrice(rangeTotal)}</span>
          {" — "}
          {rangeOrders} طلب
        </p>
      </div>

      <div className="mt-4 min-h-[2.5rem] text-sm">
        {picked ? (
          <p>
            <span className="font-medium">{shortDate(picked.date)}</span>
            {": "}
            <span className="font-bold text-accent">{formatPrice(picked.total)}</span>
            {" — "}
            {picked.orders} طلب
          </p>
        ) : (
          <p className="text-text/50">اضغط على أي عمود لعرض مبيعات اليوم</p>
        )}
      </div>

      {rangeOrders === 0 ? (
        <p className="py-12 text-center text-text/50">
          لا توجد مبيعات بهذي الفترة
        </p>
      ) : (
        <>
          <div
            dir="ltr"
            className="flex h-48 items-end gap-[2px] border-b border-beige"
          >
            {data.map((d, i) => {
              const pct = max > 0 ? (d.total / max) * 100 : 0;
              const isSelected = selected === i;
              return (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => setSelected(isSelected ? null : i)}
                  aria-label={`${shortDate(d.date)}: ${formatPrice(d.total)}`}
                  className="flex h-full min-w-0 flex-1 items-end focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                >
                  <span
                    className={`block w-full rounded-t-sm transition-colors ${
                      d.total === 0
                        ? "bg-beige"
                        : isSelected
                        ? "bg-text"
                        : "bg-accent/80"
                    }`}
                    style={{ height: d.total > 0 ? `${Math.max(pct, 3)}%` : "2px" }}
                  />
                </button>
              );
            })}
          </div>
          <div
            dir="ltr"
            className="mt-2 flex justify-between text-xs text-text/50"
          >
            <span>{shortDate(data[0].date)}</span>
            <span>{shortDate(data[data.length - 1].date)}</span>
          </div>
        </>
      )}
    </div>
  );
}
