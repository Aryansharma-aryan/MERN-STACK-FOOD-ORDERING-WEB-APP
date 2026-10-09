import { useCallback, useEffect, useState } from "react";
import { request, money } from "../../utils/orders";
const nextStatus = { Pending: "Preparing", Preparing: "Out for Delivery", "Out for Delivery": "Delivered" };
export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [sharing, setSharing] = useState("");
  const refresh = useCallback(async () => {
    try { setOrders(await request("/admin/orders")); setError(""); } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { refresh(); const timer = setInterval(refresh, 15000); return () => clearInterval(timer); }, [refresh]);
  useEffect(() => {
    if (!sharing) return;
    if (!navigator.geolocation) { setError("Geolocation is unavailable."); return; }
    let lastSent = 0;
    const watch = navigator.geolocation.watchPosition(async position => {
      if (Date.now() - lastSent < 5000) return;
      lastSent = Date.now();
      try {
        await request(`/admin/orders/${sharing}/location`, { method: "PATCH", body: JSON.stringify({ lat: position.coords.latitude, lng: position.coords.longitude }) });
      } catch (e) { setError(e.message); }
    }, () => setError("Location permission denied or unavailable."), { enableHighAccuracy: true, timeout: 15000 });
    return () => navigator.geolocation.clearWatch(watch);
  }, [sharing]);
  async function update(order) {
    if (nextStatus[order.status] === "Delivered" && order.paymentMethod === "cod" && !window.confirm("Confirm demo delivery and simulated cash payment?")) return;
    setBusy(order._id);
    try {
      await request(`/admin/orders/${order._id}/status`, { method: "PATCH", body: JSON.stringify({ status: nextStatus[order.status] }) });
      if (sharing === order._id) setSharing("");
      await refresh();
    } catch (e) { setError(e.message); } finally { setBusy(""); }
  }
  async function location(event, order) {
    event.preventDefault(); setBusy(order._id);
    const fields = new FormData(event.currentTarget);
    try {
      await request(`/admin/orders/${order._id}/location`, { method: "PATCH", body: JSON.stringify({ lat: Number(fields.get("lat")), lng: Number(fields.get("lng")) }) });
      await refresh();
    } catch (e) { setError(e.message); } finally { setBusy(""); }
  }
  return <section className="my-4"><h3>Manage orders</h3>
    {error && <div className="alert alert-danger">{error}</div>}
    <button className="btn btn-outline-secondary mb-3" onClick={refresh}>Refresh orders</button>
    {!orders.length && <p>No orders yet.</p>}
    {orders.map(order => <div className="card p-3 mb-3" key={order._id}>
      <strong>#{order._id.slice(-8)} · {order.status} · {money(order.totalAmount)}</strong>
      <p>{order.restaurant?.name || "Food Mania Demo Kitchen"} · Demo order</p>
      <p>{order.items.map(item => `${item.name} × ${item.quantity}`).join(", ")}</p>
      <p>{order.deliveryAddress} · {order.phone}<br />{order.paymentMethod === "cod" ? "Cash on delivery" : "Online"} — {order.paymentStatus}</p>
      {nextStatus[order.status] && <button className="btn btn-primary" disabled={busy === order._id} onClick={() => update(order)}>Mark {nextStatus[order.status]}</button>}
      {order.status === "Out for Delivery" && <>
        <form className="d-flex gap-2 flex-wrap mt-3" onSubmit={event => location(event, order)}>
          <input className="form-control" style={{ maxWidth: 200 }} name="lat" type="number" step="any" min="-90" max="90" required placeholder="Driver latitude" aria-label="Driver latitude" />
          <input className="form-control" style={{ maxWidth: 200 }} name="lng" type="number" step="any" min="-180" max="180" required placeholder="Driver longitude" aria-label="Driver longitude" />
          <button className="btn btn-outline-primary" disabled={busy === order._id}>Update driver location</button>
        </form>
        <button className="btn btn-outline-secondary mt-2" onClick={() => setSharing(sharing === order._id ? "" : order._id)}>{sharing === order._id ? "Stop sharing my location" : "Share this device's location for this delivery"}</button>
        <small className="text-muted">Use device sharing only when this device is travelling with the delivery.</small>
      </>}
    </div>)}
  </section>;
}
