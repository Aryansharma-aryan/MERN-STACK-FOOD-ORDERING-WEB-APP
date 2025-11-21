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
        const token = localStorage.getItem("authToken");
        if (!token) {
          setError("Unauthorized! Please log in.");
          setLoading(false);
          return;
        }

        const response = await axios.get(
          `https://mern-stack-food-ordering-web-app-2.onrender.com/api/payment/${paymentId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Use `payment` key if backend wraps response
        setPayment(response.data.payment || response.data);
      } catch (err) {
        console.error("Error fetching payment:", err);
        setError("❌ No payment found or unauthorized.");
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();
  }, [paymentId]);

  const downloadInvoice = () => {
    if (!payment) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("🧾 Food Mania - Payment Receipt", 20, 20);

    doc.setFontSize(12);

    // Dynamically add all payment fields
    let y = 40;
    Object.entries(payment).forEach(([key, value]) => {
      if (value instanceof Object && !(value instanceof Date)) {
        value = JSON.stringify(value, null, 2);
      } else if (key === "paidAt" && value) {
        value = new Date(value).toLocaleString();
      }
      doc.text(`${key}: ${value ?? "N/A"}`, 20, y);
      y += 10;
    });

    doc.save("invoice.pdf");
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3">Loading payment details...</p>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="text-center mt-5 text-danger fw-bold">{error}</div>
    );
  }

  return (
    <div className="container my-5">
      <div className="card shadow-lg border-0">
        <div className="card-header bg-success text-white text-center">
          <h3>✅ Payment Successful</h3>
        </div>
        <div className="card-body">
          {Object.entries(payment).map(([key, value]) => {
            if (value instanceof Object && !(value instanceof Date)) {
              value = JSON.stringify(value, null, 2);
            } else if (key === "paidAt" && value) {
              value = new Date(value).toLocaleString();
            }
            return (
              <p key={key}>
                <strong>{key}:</strong> {value ?? "N/A"}
              </p>
            );
          })}

          <div className="text-end mt-4">
            <button className="btn btn-outline-primary" onClick={downloadInvoice}>
              🧾 Download Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
