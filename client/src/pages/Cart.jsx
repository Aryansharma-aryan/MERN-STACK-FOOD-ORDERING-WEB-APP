import { Link, useNavigate } from "react-router-dom";
import { hasSession } from "../utils/cart";
export default function Cart({ cart, setCart }) {
  const navigate = useNavigate();
  const subtotal = cart.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
  const tax = Math.round(subtotal * 5) / 100;
  return <div className="container my-5"><h2>Your cart</h2>
    <p>{cart[0]?.restaurantName || "Food Mania Demo Kitchen"} · Demo order — no real food delivery.</p>
    {!cart.length ? <p>Your cart is empty. <Link to="/home">Browse the menu</Link></p> : <>
      {cart.map(item => <div className="card p-3 mb-3" key={item._id}><div className="d-flex align-items-center gap-3 flex-wrap">
        <img src={item.image} alt={item.name} width="90" height="75" style={{ objectFit: "cover" }} />
        <div className="flex-grow-1"><h5>{item.name}</h5><span>₹{Number(item.price).toFixed(2)}</span></div>
        <button aria-label={`Decrease ${item.name}`} className="btn btn-outline-secondary" disabled={item.quantity <= 1} onClick={() => setCart(items => items.map(i => i._id === item._id ? { ...i, quantity: i.quantity - 1 } : i))}>−</button>
        <span>{item.quantity}</span>
        <button aria-label={`Increase ${item.name}`} className="btn btn-outline-secondary" disabled={item.quantity >= 99} onClick={() => setCart(items => items.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i))}>+</button>
        <button className="btn btn-outline-danger" onClick={() => setCart(items => items.filter(i => i._id !== item._id))}>Remove</button>
      </div></div>)}
      <div className="card p-4"><p>Subtotal: ₹{subtotal.toFixed(2)}</p><p>Tax (5%): ₹{tax.toFixed(2)}</p><h4>Total: ₹{(subtotal + tax).toFixed(2)}</h4>
        <button className="btn btn-success mt-3" onClick={() => navigate(hasSession() ? "/checkout" : "/login", { state: { from: "/checkout" } })}>Place Order</button>
        {!hasSession() && <small className="mt-2 text-muted">Sign in at the next step. Your cart will be saved.</small>}
      </div>
    </>}
  </div>;
}
