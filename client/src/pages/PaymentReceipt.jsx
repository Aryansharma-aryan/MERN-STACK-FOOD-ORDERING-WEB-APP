import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css"; // Import Bootstrap CSS

const PaymentReceipt = () => {
  const { paymentId } = useParams(); // Get the paymentId from URL
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:3100/api/payment/${paymentId}`);
        setPaymentDetails(response.data);
      } catch (err) {
        setError("Error fetching payment details.",err);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [paymentId]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger text-center">{error}</div>;
  }

  if (!paymentDetails) {
    return <div className="alert alert-warning text-center">Payment details not found</div>;
  }

  // Format the payment date if it's available
  const formattedDate = paymentDetails.paymentDate
    ? new Date(paymentDetails.paymentDate).toLocaleDateString()
    : "Invalid Date";

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow-lg border-0">
            <div className="card-header text-center bg-primary text-white">
              <h2>Payment Receipt</h2>
            </div>
            <div className="card-body">
              <div className="text-center mb-4">
                <h4 className="text-muted">Payment Details</h4>
              </div>
              <div className="row mb-3">
                <div className="col-6 text-end">
                  <strong>Payment ID:</strong>
                </div>
                <div className="col-6">
                  {paymentDetails.paymentId || "Not Available"}
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-6 text-end">
                  <strong>Amount Paid:</strong>
                </div>
                <div className="col-6">
                  ₹{paymentDetails.amount}
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-6 text-end">
                  <strong>Status:</strong>
                </div>
                <div className="col-6">
                  {paymentDetails.status}
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-6 text-end">
                  <strong>Payment Date:</strong>
                </div>
                <div className="col-6">
                  {formattedDate}
                </div>
              </div>
              <div className="text-center mt-4">
                <a href="/" className="btn btn-outline-primary">Back to Home</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentReceipt;
