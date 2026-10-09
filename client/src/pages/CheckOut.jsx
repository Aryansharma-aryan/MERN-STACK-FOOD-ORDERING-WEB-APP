import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { request, payForOrder, money } from "../utils/orders";

export default function Checkout({ cart, setCart }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const orderId = params.get("orderId");
  const [order, setOrder] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [onlineAvailable, setOnlineAvailable] = useState(false);
  const [orderLoading, setOrderLoading] = useState(Boolean(orderId));
  const locked = useRef(false);
  const draftKey = `checkout_${localStorage.getItem("userId")}`;
  const [form, setForm] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(draftKey)) || { deliveryAddress: "", phone: "", paymentMethod: "cod" }; }
    catch { return { deliveryAddress: "", phone: "", paymentMethod: "cod" }; }
  });
  useEffect(() => { sessionStorage.setItem(draftKey, JSON.stringify(form)); }, [form, draftKey]);
  useEffect(() => {
    const controller = new AbortController();
    request("/payment-config", { signal: controller.signal }).then(data => setOnlineAvailable(data.onlineAvailable)).catch(() => setOnlineAvailable(false));
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!orderId) { setOrder(null); return; }
    const controller = new AbortController();
    setOrderLoading(true);
    request(`/order-details/${orderId}`, { signal: controller.signal }).then(data => setOrder(data.order)).catch(e => { if (e.name !== "AbortError") setError(e.message); }).finally(() => { if (!controller.signal.aborted) setOrderLoading(false); });
    return () => controller.abort();
  }, [orderId]);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = order?.totalAmount ?? (subtotal + Math.round(subtotal * 5) / 100);
  function locate() {
    if (!navigator.geolocation) { setLocationMessage("Location unavailable. Use your delivery address."); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(position => {
      setForm(current => ({ ...current, customerLocation: { lat: position.coords.latitude, lng: position.coords.longitude } }));
      setLocationMessage("Delivery location added."); setLocating(false);
    }, () => { setLocationMessage("Location unavailable. Your written address will be used."); setLocating(false); }, { timeout: 10000 });
  }
  async function submit(event) {
    event.preventDefault();
    if (locked.current) return;
    locked.current = true; setBusy(true); setError("");
    try {
      let current = order;
      if (current?.status === "Cancelled") throw new Error("This order was cancelled. Start a new order from your cart.");
      if (!current) {
        if (form.paymentMethod === "online" && !onlineAvailable) throw new Error("Online payment is unavailable. Choose cash on delivery.");
        const restaurantId = cart[0]?.restaurantId || "demo-food-mania";
        const fingerprint = JSON.stringify({ items: cart.map(item => [item._id, item.quantity]), ...form, restaurantId });
        let reference;
        try { reference = JSON.parse(sessionStorage.getItem(`${draftKey}_reference`)); } catch { /* New checkout */ }
        if (reference?.fingerprint !== fingerprint) reference = { fingerprint, id: crypto.randomUUID() };
        sessionStorage.setItem(`${draftKey}_reference`, JSON.stringify(reference));
        const data = await request("/orders", { method: "POST", body: JSON.stringify({ ...form, restaurantId, items: cart.map(({ _id, quantity }) => ({ _id, quantity })), requestId: reference.id }) });
        current = data.order; setOrder(current);
        // The saved order can be resumed without removing items added later.
        setCart([]);
        navigate(`/checkout?orderId=${current._id}`, { replace: true });
      }
      if (current.paymentMethod === "online" && current.paymentStatus !== "paid") {
        await payForOrder(current);
      }
      sessionStorage.removeItem(draftKey);
      sessionStorage.removeItem(`${draftKey}_reference`);
      navigate(`/receipt/${current._id}`, { replace: true });
    } catch (e) {
      setError(e.message);
      if (e.status === 409 && !order) sessionStorage.removeItem(`${draftKey}_reference`);
      if ([401, 403].includes(e.status)) navigate("/login", { state: { from: `/checkout${orderId ? `?orderId=${orderId}` : ""}` } });
    } finally { locked.current = false; setBusy(false); }
  }
  if (!cart.length && !orderId && !order) return <div className="container my-5"><p>Your cart is empty. <Link to="/home">Browse menu</Link></p></div>;
  return <div className="container my-5" style={{ maxWidth: 720 }}><h2>Complete your order</h2>
    <div className="alert alert-info">Demo checkout for {order?.restaurant?.name || cart[0]?.restaurantName || "Food Mania Demo Kitchen"}. Razorpay uses test mode. No real charge or food delivery is created.</div>
    {error && <div className="alert alert-danger" role="alert">{error} <Link to="/myOrders">My Orders</Link></div>}
    {orderId && !order ? <p>{orderLoading ? "Loading saved order…" : "Order unavailable. Return to My Orders or your cart."}</p> : <form onSubmit={submit} className="card p-4">
      {order ? <><p>Order: {order._id}</p><p>{order.deliveryAddress}</p><p>Payment: {order.paymentMethod === "cod" ? "Cash on delivery" : "Online"}</p></> : <>
        <label htmlFor="address">Delivery address</label><textarea id="address" className="form-control mb-3" minLength={10} maxLength={500} required value={form.deliveryAddress} onChange={e => setForm({ ...form, deliveryAddress: e.target.value })} placeholder="House, street, area, city and postal code" />
        <label htmlFor="phone">Contact phone</label><input id="phone" className="form-control mb-3" type="tel" required minLength={10} maxLength={20} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        <button type="button" className="btn btn-outline-secondary mb-2" disabled={locating} onClick={locate}>{locating ? "Finding location…" : "Add current delivery location (optional)"}</button>
        {locationMessage && <p role="status">{locationMessage}</p>}
        <label htmlFor="method">Payment method</label><select id="method" className="form-select mb-3" value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}><option value="cod">Cash on delivery</option><option value="online" disabled={!onlineAvailable}>Pay online{!onlineAvailable ? " (unavailable)" : ""}</option></select>
      </>}
      <h4>Total: {money(total)}</h4><p className="text-muted">Includes 5% tax. Final prices are confirmed when the order is saved.</p>
      <button className="btn btn-success" disabled={busy || order?.status === "Cancelled"}>{busy ? "Processing…" : (order?.paymentMethod || form.paymentMethod) === "online" ? "Pay and confirm order" : "Confirm order — pay on delivery"}</button>
    </form>}
  </div>;
}
