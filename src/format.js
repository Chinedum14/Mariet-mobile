import { colors } from "./theme";

// Colour + arrow + text for a change value (string or number).
export function changeInfo(raw) {
  const n = parseFloat(raw);
  if (raw === "" || raw == null || isNaN(n)) {
    return { color: colors.flat, arrow: "—", pct: "" };
  }
  const pct = (n > 0 ? "+" : "") + n + "%";
  const color = n > 0 ? colors.up : n < 0 ? colors.down : colors.flat;
  const arrow = n > 0 ? "↗" : n < 0 ? "↘" : "—";
  return { color, arrow, pct };
}

export function priceLabel(raw) {
  if (!raw) return "";
  const p = String(raw).replace(/^\$/, "").trim();
  return p ? "$" + p : "";
}

export function aboveTarget(m) {
  const price = parseFloat(m.price);
  const target = parseFloat(m.target);
  return !isNaN(price) && !isNaN(target) && m.target !== "" && price > target;
}
