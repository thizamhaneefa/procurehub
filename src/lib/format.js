export function fmtMoney(n, currency = "AED") {
  const v = Number(n) || 0;
  return `${currency} ${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fmtMoneyShort(n, currency = "AED") {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1000000) return `${currency} ${(v / 1000000).toFixed(2)}M`;
  if (Math.abs(v) >= 1000) return `${currency} ${(v / 1000).toFixed(1)}K`;
  return fmtMoney(v, currency);
}

export function fmtDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function toInputDate(d) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return fmtDate(d);
}
