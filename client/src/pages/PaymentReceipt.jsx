import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { makeReceiptPdf } from "../utils/receipt";
import { request, money } from "../utils/orders";
export default function PaymentReceipt() {
  const { orderId, paymentId } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setOrder(null); setError("");
    request(orderId ? `/order-details/${orderId}` : `/payment/${paymentId}`, { signal: controller.signal }).then(data => setOrder(data.order)).catch(e => { if (e.name !== "AbortError") setError(e.message); });
    return () => controller.abort();
  }, [orderId, paymentId]);
  function download() {
    const pdf = makeReceiptPdf(order);
    pdf.save(`Food-Mania-${order._id}.pdf`);
  }
  if (error) return <div className="container my-5 alert alert-danger">{error} <Link to="/myOrders">Back to orders</Link></div>;
  if (!order) return <p className="container my-5">Loading receipt…</p>;
  return <div className="container my-5" style={{ maxWidth: 850 }}><div className="card p-4">
    <h2>Food Mania — Order receipt</h2><p>Order #{order._id}</p><p>{new Date(order.createdAt).toLocaleString()}</p>
    <div className="alert alert-info">Demo receipt — Razorpay test mode. No real payment or delivery. This is not a tax invoice.</div>
    <p>Restaurant: {order.restaurant?.name || "Food Mania Demo Kitchen"}</p>
    <p><strong>{order.status}</strong> · {order.paymentStatus === "paid" ? "Paid" : order.paymentMethod === "cod" ? "Payment due on delivery" : "Payment pending"}</p>
    <p>Delivery: {order.deliveryAddress || "Address not recorded"}<br />Phone: {order.phone || "Not recorded"}</p>
    {order.paymentId && <p>Payment reference: {order.paymentId}</p>}
    <div className="table-responsive"><table className="table"><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Amount</th></tr></thead><tbody>{order.items.map((item, i) => <tr key={i}><td>{item.name}</td><td>{item.quantity}</td><td>{money(item.price)}</td><td>{money(item.price * item.quantity)}</td></tr>)}</tbody></table></div>
    <p>Subtotal: {money(order.subtotal ?? order.totalAmount)}<br />Tax: {money(order.tax)}</p><h4>Total: {money(order.totalAmount)}</h4>
    <div className="d-flex gap-2 mt-3 flex-wrap"><button className="btn btn-outline-primary" onClick={download}>Download receipt PDF</button><Link className="btn btn-success" to="/myOrders">Track order progress</Link><Link className="btn btn-outline-secondary" to="/home">Continue shopping</Link></div>
  </div></div>;
}
