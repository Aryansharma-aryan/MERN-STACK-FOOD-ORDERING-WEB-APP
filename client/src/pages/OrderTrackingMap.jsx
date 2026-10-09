import { API_URL } from "../config/api";
import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io(API_URL, { withCredentials: true });

const OrderTrackingMap = ({ latitude, longitude }) => {
  const [liveLocation, setLiveLocation] = useState({ lat: latitude, lng: longitude });

  useEffect(() => {
    // Listen for live location updates
    socket.on("locationUpdate", ({ deliveryPersonId, lat, lng }) => {
      console.log(`📍 Delivery Person (${deliveryPersonId}) is now at: ${lat}, ${lng}`);
      setLiveLocation({ lat, lng });
    });
    

    return () => socket.off("locationUpdate");
  }, []);

  return (
    <div>
      <h5>📍 Live Order Tracking</h5>
      <iframe
        title="Live Tracking"
        width="100%"
        height="400"
        src={`https://www.google.com/maps?q=${liveLocation.lat},${liveLocation.lng}&output=embed`}
        allowFullScreen
      ></iframe>
    </div>
  );
};

export default OrderTrackingMap;
