import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import jsPDF from "jspdf";
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
    const pdf = new jsPDF(); let y = 20;
    function line(text) {
      const lines = pdf.splitTextToSize(String(text), 175);
      for (const row of lines) { if (y > 275) { pdf.addPage(); y = 20; } pdf.text(row, 18, y); y += 7; }
    }
    pdf.setFontSize(16); line("Food Mania - Order Receipt"); pdf.setFontSize(11);
    line(`Order: ${order._id}`); line(`Placed: ${new Date(order.createdAt).toLocaleString()}`);
    line(`Status: ${order.status}`); line(`Payment: ${order.paymentStatus === "paid" ? "Paid" : order.paymentMethod === "cod" ? "Due on delivery" : "Pending"}`);
    if (order.paymentId) line(`Payment reference: ${order.paymentId}`);
    if (order.paidAt) line(`Paid at: ${new Date(order.paidAt).toLocaleString()}`);
    line(`Delivery: ${order.deliveryAddress || "Not recorded"}`); line(`Phone: ${order.phone || "Not recorded"}`); y += 5;
    order.items.forEach(item => line(`${item.name} x ${item.quantity} @ INR ${Number(item.price).toFixed(2)} = INR ${(item.price * item.quantity).toFixed(2)}`));
    y += 5; line(`Subtotal: INR ${Number(order.subtotal ?? order.totalAmount).toFixed(2)}`); line(`Tax: INR ${Number(order.tax || 0).toFixed(2)}`); line(`Total: INR ${Number(order.totalAmount).toFixed(2)}`);
    pdf.save(`Food-Mania-${order._id}.pdf`);
  }
  if (error) return <div className="container my-5 alert alert-danger">{error} <Link to="/myOrders">Back to orders</Link></div>;
  if (!order) return <p className="container my-5">Loading receipt…</p>;
  return <div className="container my-5" style={{ maxWidth: 850 }}><div className="card p-4">
    <h2>Food Mania — Order receipt</h2><p>Order #{order._id}</p><p>{new Date(order.createdAt).toLocaleString()}</p>
    <p><strong>{order.status}</strong> · {order.paymentStatus === "paid" ? "Paid" : order.paymentMethod === "cod" ? "Payment due on delivery" : "Payment pending"}</p>
    <p>Delivery: {order.deliveryAddress || "Address not recorded"}<br />Phone: {order.phone || "Not recorded"}</p>
    {order.paymentId && <p>Payment reference: {order.paymentId}</p>}
    <div className="table-responsive"><table className="table"><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Amount</th></tr></thead><tbody>{order.items.map((item, i) => <tr key={i}><td>{item.name}</td><td>{item.quantity}</td><td>{money(item.price)}</td><td>{money(item.price * item.quantity)}</td></tr>)}</tbody></table></div>
    <p>Subtotal: {money(order.subtotal ?? order.totalAmount)}<br />Tax: {money(order.tax)}</p><h4>Total: {money(order.totalAmount)}</h4>
    <div className="d-flex gap-2 mt-3 flex-wrap"><button className="btn btn-outline-primary" onClick={download}>Download receipt PDF</button><Link className="btn btn-success" to="/myOrders">Track order progress</Link><Link className="btn btn-outline-secondary" to="/home">Continue shopping</Link></div>
  </div></div>;
}
