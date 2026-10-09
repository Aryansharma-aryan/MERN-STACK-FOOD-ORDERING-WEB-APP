import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { request, money, progressSteps } from "../utils/orders";
export default function OrderPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    let timer;
    async function refresh() {
      try {
        const data = await request(`/orders/${localStorage.getItem("userId")}`, { signal: controller.signal });
        setOrders(data); setError("");
      } catch (e) { if (!controller.signal.aborted) setError(e.message); }
      finally { if (!controller.signal.aborted) { setLoading(false); timer = setTimeout(refresh, 10000); } }
    }
    refresh(); return () => { controller.abort(); clearTimeout(timer); };
  }, []);
  async function action(order, reconcile = false) {
    if (!reconcile && !window.confirm("Cancel this order?")) return;
    setBusy(order._id);
    try {
      const data = await request(reconcile ? `/order-details/${order._id}/reconcile` : `/orders/${order._id}`, { method: reconcile ? "POST" : "DELETE" });
      setOrders(current => current.map(item => item._id === order._id ? data.order : item)); setError("");
    } catch (e) { setError(e.message); } finally { setBusy(""); }
  }
  return <div className="container my-5"><h2>My Orders</h2><p className="text-muted">Order progress and driver location refresh every 10 seconds.</p>
    <p className="alert alert-info">These are demo orders. Progress is updated for demonstration; no real food delivery is arranged.</p>
    {error && <div className="alert alert-warning" role="alert">{error}</div>}
    {loading ? <p>Loading orders…</p> : !orders.length ? <p>No orders yet. <Link to="/home">Browse menu</Link></p> : orders.map(order => <article className="card p-4 mb-4" key={order._id}>
      <div className="d-flex justify-content-between flex-wrap gap-2"><h5>Order #{order._id.slice(-8)}</h5><strong>{order.status}</strong></div>
      <p>{order.restaurant?.name || "Food Mania Demo Kitchen"}</p>
      <p>{new Date(order.createdAt).toLocaleString()} · {money(order.totalAmount)} · {order.paymentStatus === "paid" ? "Paid" : order.paymentMethod === "cod" ? "Pay on delivery" : "Payment pending"}</p>
      <ul>{order.items.map((item, index) => <li key={index}>{item.name} × {item.quantity} — {money(item.price * item.quantity)}</li>)}</ul>
      {!['Cancelled', 'Awaiting Payment'].includes(order.status) && <ol className="d-flex flex-wrap gap-4 ps-3">{progressSteps.map((step, index) => <li key={step} className={index <= progressSteps.indexOf(order.status) ? "text-success fw-bold" : "text-muted"}>{step}</li>)}</ol>}
      <details className="mb-3"><summary>Status history</summary><ul>{order.statusHistory?.map((entry, index) => <li key={index}>{entry.status} — {new Date(entry.timestamp).toLocaleString()}</li>)}</ul></details>
      {order.status === "Out for Delivery" && (order.deliveryPersonLocation ? <>
        <p>Driver location updated: {new Date(order.locationUpdatedAt).toLocaleString()}{Date.now() - new Date(order.locationUpdatedAt).getTime() > 120000 ? " — last known location; waiting for a new update" : ""}</p>
        <iframe title={`Driver location for ${order._id}`} width="100%" height="250" loading="lazy" src={`https://www.google.com/maps?q=${order.deliveryPersonLocation.lat},${order.deliveryPersonLocation.lng}&output=embed`} />
      </> : <p>Waiting for the delivery driver's location. Your delivery address is {order.deliveryAddress}.</p>)}
      <div className="d-flex gap-2 flex-wrap mt-3">
        <Link className="btn btn-outline-primary" to={`/receipt/${order._id}`}>View receipt</Link>
        {order.status === "Awaiting Payment" && <><Link className="btn btn-success" to={`/checkout?orderId=${order._id}`}>Resume payment</Link>{order.razorpayOrderId && <button className="btn btn-outline-secondary" disabled={busy === order._id} onClick={() => action(order, true)}>Refresh payment status</button>}</>}
        {['Pending', 'Awaiting Payment'].includes(order.status) && order.paymentStatus !== "paid" && !order.razorpayOrderId && <button className="btn btn-outline-danger" disabled={busy === order._id} onClick={() => action(order)}>Cancel order</button>}
      </div>
    </article>)}
  </div>;
}
