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
       const token = localStorage.getItem("authToken"); // or sessionStorage

const response = await axios.get(
  `https://mern-stack-food-ordering-web-app-2.onrender.com/api/payment/${paymentId}`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

        setPayment(response.data);
      } catch (err) {
        console.error("Error fetching payment:", err);
        setError("❌ No payment found.");
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();
  }, [paymentId]);

  const downloadInvoice = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("🧾 Food Mania - Payment Receipt", 20, 20);
    doc.setFontSize(12);
    doc.text(`Payment ID: ${payment?.paymentId || "N/A"}`, 20, 40);
    doc.text(`Status: ${payment?.status || "N/A"}`, 20, 50);
    doc.text(`Amount Paid: ₹${payment?.amount || "N/A"}`, 20, 60);
    doc.text(`Date: ${payment?.paymentDate || "N/A"}`, 20, 70);
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
      <div className="text-center mt-5 text-danger fw-bold">
        ❌ No payment found.
      </div>
    );
  }

  return (
    <div className="container my-5">
      <div className="card shadow-lg border-0">
        <div className="card-header bg-success text-white text-center">
          <h3>✅ Payment Successful</h3>
        </div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-6">
              <p><strong>Payment ID:</strong> {payment.paymentId}</p>
              <p><strong>Status:</strong> {payment.status}</p>
            </div>
            <div className="col-md-6 text-md-end">
              <p><strong>Date:</strong> {payment.paymentDate}</p>
              <p><strong>Amount Paid:</strong> ₹{payment.amount}</p>
            </div>
          </div>

          <div className="text-end mt-4">
            <button
              className="btn btn-outline-primary"
              onClick={downloadInvoice}
            >
              🧾 Download Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
