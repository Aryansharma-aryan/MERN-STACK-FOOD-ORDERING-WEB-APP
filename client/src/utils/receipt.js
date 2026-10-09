import { jsPDF } from "jspdf";
export function makeReceiptPdf(order) {
    const pdf = new jsPDF(); let y = 20;
    function line(text) {
      const lines = pdf.splitTextToSize(String(text), 175);
      for (const row of lines) { if (y > 275) { pdf.addPage(); y = 20; } pdf.text(row, 18, y); y += 7; }
    }
    pdf.setFontSize(16); line("Food Mania - Order Receipt"); pdf.setFontSize(11);
    line("DEMO / TEST RECEIPT - NOT A TAX INVOICE");
    line("No real payment or food delivery is created.");
    line(`Restaurant: ${order.restaurant?.name || "Food Mania Demo Kitchen"}`);
    line(`Order: ${order._id}`); line(`Placed: ${new Date(order.createdAt).toLocaleString()}`);
    line(`Status: ${order.status}`); line(`Payment: ${order.paymentStatus === "paid" ? "Paid" : order.paymentMethod === "cod" ? "Due on delivery" : "Pending"}`);
    if (order.paymentId) line(`Payment reference: ${order.paymentId}`);
    if (order.paidAt) line(`Paid at: ${new Date(order.paidAt).toLocaleString()}`);
    line(`Delivery: ${order.deliveryAddress || "Not recorded"}`); line(`Phone: ${order.phone || "Not recorded"}`); y += 5;
    order.items.forEach(item => line(`${item.name} x ${item.quantity} @ INR ${Number(item.price).toFixed(2)} = INR ${(item.price * item.quantity).toFixed(2)}`));
    y += 5; line(`Subtotal: INR ${Number(order.subtotal ?? order.totalAmount).toFixed(2)}`); line(`Tax: INR ${Number(order.tax || 0).toFixed(2)}`); line(`Total: INR ${Number(order.totalAmount).toFixed(2)}`);
    return pdf;
}
