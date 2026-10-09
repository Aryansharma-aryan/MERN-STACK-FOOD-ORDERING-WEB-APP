export function readCart(key) {
  try {
    const items = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(items) ? items.filter(item => item?._id && Number(item.quantity) > 0) : [];
  } catch { return []; }
}
export function mergeCarts(saved, guest) {
  if (guest.length && saved.length && (guest[0].restaurantId || "demo-food-mania") !== (saved[0].restaurantId || "demo-food-mania")) return guest;
  const merged = new Map(saved.map(item => [item._id, { ...item }]));
  for (const item of guest) {
    const existing = merged.get(item._id);
    merged.set(item._id, { ...item, quantity: Math.min(99, Number(item.quantity) + Number(existing?.quantity || 0)) });
  }
  return [...merged.values()];
}
export function hasSession() {
  try {
    const token = localStorage.getItem("authToken");
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.exp * 1000 > Date.now();
  } catch { return false; }
}
