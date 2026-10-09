import { API_BASE } from "../config/api.js";
export async function request(path, options = {}) {
  const token = localStorage.getItem("authToken");
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    signal: options.signal || AbortSignal.timeout(65000),
  });
  const content = await response.text();
  let data;
  try { data = content ? JSON.parse(content) : {}; }
  catch { throw new Error("The service returned an unexpected response. Please retry shortly."); }
  if (response.status === 401 && token) window.dispatchEvent(new Event("session-expired"));
  if (!response.ok) throw Object.assign(new Error(data.message || data.error || "Request failed."), { status: response.status });
  return data;
}
let checkoutScript;
export async function payForOrder(order) {
  if (order.razorpayOrderId) {
    try { return await request(`/order-details/${order._id}/reconcile`, { method: "POST" }); }
    catch (error) { if (error.status !== 409) throw error; }
  }
  if (!window.Razorpay) {
    if (!checkoutScript) checkoutScript = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      const timer = setTimeout(() => { checkoutScript = null; script.remove(); reject(new Error("Payment checkout timed out. Please retry.")); }, 20000);
      script.onload = () => { clearTimeout(timer); if (window.Razorpay) resolve(); else { checkoutScript = null; reject(new Error("Payment checkout did not load. Please retry.")); } };
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
