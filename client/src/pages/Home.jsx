import React, { memo, useState } from "react";
import DisplayData from "./DisplayData";
import RestaurantBrowser from "../components/RestaurantBrowser";

const Home = ({ cart, setCart }) => {
  const [restaurant, setRestaurant] = useState(() => {
    try { const saved = JSON.parse(localStorage.getItem("demoRestaurant")); if (saved?.id?.startsWith("demo-") && saved?.name) return saved; } catch { /* Use default demo */ }
    return { id: "demo-food-mania", name: "Food Mania Demo Kitchen", isDemo: true };
  });
  function selectRestaurant(value) { setRestaurant(value); localStorage.setItem("demoRestaurant", JSON.stringify(value)); }
  return (
    <div>
      <RestaurantBrowser selected={restaurant} onSelect={selectRestaurant} />
      <div className="container"><h2 className="h4">{restaurant.name} — sample menu</h2></div>
      <DisplayData cart={cart} setCart={setCart} restaurant={restaurant} />
    </div>
  );
};

export default memo(Home);
