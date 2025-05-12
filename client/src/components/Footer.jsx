import React from "react";
import { FaInstagram, FaEnvelope, FaMapMarkerAlt, FaPhone } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="text-white py-4" style={{ background: "linear-gradient(45deg, #ff4d00, #ff7300)" }}>
      <div className="container">
        <div className="row text-center text-md-left">
          {/* Brand Section */}
          <div className="col-md-4 mb-3">
            <h4 className="fw-bold">Food Mania 🍔</h4>
            <p>Your favorite food, delivered fast and fresh! Order now and satisfy your cravings.</p>
          </div>

          {/* Contact Section */}
          <div className="col-md-4 mb-3">
            <h5 className="fw-bold">Contact Us</h5>
            <p><FaPhone className="me-2" /> +91 9518403808</p>
            <p><FaEnvelope className="me-2" /> arsharma2951@gmail.com</p>
            <p><FaMapMarkerAlt className="me-2" /> Gharaunda, Karnal, Haryana, 132114</p>
          </div>

          {/* Quick Links Section */}
          <div className="col-md-4 mb-3">
            <h5 className="fw-bold">Follow Us</h5>
            <a href="https://www.instagram.com/aryan_sharma_07?igsh=MW56em5naHhjbGdtOQ==" 
               className="text-white me-3 fs-4" target="_blank" rel="noopener noreferrer">
              <FaInstagram />
            </a>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="text-center mt-3">
          <p className="mb-0">&copy; {new Date().getFullYear()} Food Mania. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
