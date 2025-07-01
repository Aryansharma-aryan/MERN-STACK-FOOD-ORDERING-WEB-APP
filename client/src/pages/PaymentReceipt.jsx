import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import jsPDF from "jspdf";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";

export default function PaymentReceipt() {
  const { paymentId } = useParams();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        const response = await axios.get(
          `https://mern-stack-food-ordering-web-app-2.onrender.com/api/payment/${paymentId}`
        );
        setPayment(response.data.payment);
      } catch (err) {
        console.error("Error fetching payment:", err);
        setError("Failed to load payment details.");
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();
  }, [paymentId]);

  const downloadInvoice = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("🧾 Payment Receipt - Food Mania", 20, 20);
    doc.setFontSize(12);

    doc.text(
      `Order ID: ${
        payment?.orderId
          ? payment.orderId
          : payment?.paidAt
          ? new Date(payment.paidAt).toLocaleString()
          : "N/A"
      }`,
      20,
      40
    );
    doc.text(`Payment ID: ${payment?.paymentId || "N/A"}`, 20, 50);
    doc.text(`User: ${payment?.user || "N/A"}`, 20, 60);
    doc.text(
      `Amount Paid: ₹${typeof payment?.totalAmount === "number" ? payment.totalAmount.toFixed(2) : "N/A"}`,
      20,
      70
    );
    doc.text(
      `Payment Date: ${
        payment?.paidAt ? new Date(payment.paidAt).toLocaleString() : "N/A"
      }`,
      20,
      80
    );
    doc.text(
      `Payment Method: ${payment?.paymentMethod || "PhonePe / GPay / UPI"}`,
      20,
      90
    );

    doc.save("invoice.pdf");
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p>Loading payment details...</p>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="text-center mt-5 text-danger fw-bold">
        {error || "No payment found."}
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="card shadow border-0">
        <div className="card-header bg-success text-white text-center">
          <h3>✅ Payment Successful!</h3>
        </div>
        <div className="card-body text-center">
          <h5>
            <strong>Order ID:</strong>{" "}
            {payment.orderId
              ? payment.orderId
              : payment?.paidAt
              ? new Date(payment.paidAt).toLocaleString()
              : "N/A"}
          </h5>
          <p>
            <strong>Payment ID:</strong> {payment.paymentId}
          </p>
          <p>
            <strong>User:</strong> {payment.user}
          </p>
          <p>
            <strong>Amount Paid:</strong>{" "}
            ₹
            {typeof payment.totalAmount === "number"
              ? payment.totalAmount.toFixed(2)
              : "N/A"}
          </p>
          <p>
            <strong>Paid At:</strong>{" "}
            {payment.paidAt
              ? new Date(payment.paidAt).toLocaleString()
              : "N/A"}
          </p>
          <p>
            <strong>Payment Method:</strong>{" "}
            {payment.paymentMethod || "PhonePe / GPay / UPI"}
          </p>

          <button
            className="btn btn-outline-primary mt-3"
            onClick={downloadInvoice}
          >
            🧾 Download Invoice
          </button>
        </div>
      </div>
    </div>
  );
}
