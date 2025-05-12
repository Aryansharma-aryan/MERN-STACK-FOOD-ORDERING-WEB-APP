import React from "react";
import DisplayData from "./DisplayData";

const Home = ({ cart, setCart }) => {
  return (
    <div>
      <DisplayData cart={cart} setCart={setCart} />
    </div>
  );
};

export default Home;
