import { API_BASE } from "../config/api";
export async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("authToken")}`, ...options.headers },
    signal: options.signal || AbortSignal.timeout(65000),
  });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.message || data.error || "Request failed."), { status: response.status });
  return data;
}
let checkoutScript;
export async function payForOrder(order) {
  if (!window.Razorpay) {
    if (!checkoutScript) checkoutScript = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      const timer = setTimeout(() => { checkoutScript = null; script.remove(); reject(new Error("Payment checkout timed out. Please retry.")); }, 20000);
      script.onload = () => { clearTimeout(timer); resolve(); };
      script.onerror = () => { clearTimeout(timer); checkoutScript = null; script.remove(); reject(new Error("Unable to load payment checkout. Please retry.")); };
      document.body.appendChild(script);
    });
    await checkoutScript;
  }
  const data = await request("/create-order", { method: "POST", body: JSON.stringify({ orderId: order._id }) });
  if (!data.keyId) throw new Error("Online payment is not configured.");
  return new Promise((resolve, reject) => {
    let submitted = false;
    const checkout = new window.Razorpay({
      key: data.keyId, amount: data.order.amount, currency: data.order.currency,
      name: "Food Mania", description: `Order ${order._id}`, order_id: data.order.id,
      prefill: { contact: order.phone },
      handler: async details => {
        submitted = true;
        try { resolve(await request("/verify-payment", { method: "POST", body: JSON.stringify({ ...details, orderId: order._id }) })); }
        catch (error) { reject(new Error(`${error.message} Use Refresh payment status in My Orders before paying again.`)); }
      },
      modal: { ondismiss: () => { if (!submitted) reject(new Error("Payment checkout closed. Your order is saved; resume from My Orders.")); } },
      theme: { color: "#198754" },
    });
    checkout.on("payment.failed", () => { checkout.close(); reject(new Error("Payment failed. Your order is saved in My Orders.")); });
    checkout.open();
  });
}
export const money = value => `₹${Number(value || 0).toFixed(2)}`;
export const progressSteps = ["Pending", "Preparing", "Out for Delivery", "Delivered"];
