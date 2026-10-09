import { API_URL } from "../config/api";
import { useEffect } from "react";
import { io } from "socket.io-client";

const socket = io(API_URL, { withCredentials: true });

const DeliveryLocationUpdater = ({ deliveryPersonId }) => {
  useEffect(() => {
    const sendLocationUpdate = (lat, lng) => {
      socket.emit("updateLocation", { deliveryPersonId, lat, lng });
    };

    const updateLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          sendLocationUpdate(latitude, longitude);
        },
        (error) => console.error("❌ Location error:", error),
        { enableHighAccuracy: true }
      );
    };

    const interval = setInterval(updateLocation, 5000);

    return () => clearInterval(interval);
  }, [deliveryPersonId]);

  return <p>📡 Sending live location updates...</p>;
};

export default DeliveryLocationUpdater;
