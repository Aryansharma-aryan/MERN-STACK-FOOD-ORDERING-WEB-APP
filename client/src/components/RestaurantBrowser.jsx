const demos = [
  { id: "demo-food-mania", name: "Food Mania Demo Kitchen", cuisine: "Indian, pizza and comfort food", isDemo: true },
  { id: "demo-pizza-house", name: "Demo Pizza House", cuisine: "Pizza, burgers and pasta", isDemo: true },
  { id: "demo-spice-table", name: "Demo Spice Table", cuisine: "Indian favourites and desserts", isDemo: true },
];

export default function RestaurantBrowser({ selected, onSelect }) {
  return <section className="container py-4">
    <h1 className="h3">Find your next meal</h1>
    <h2 className="h4 mt-4">Try a demo restaurant</h2>
    <p className="text-muted">Fictional restaurants with a shared sample menu. Test orders and payments do not create a real food delivery.</p>
    <div className="row g-3">{demos.map(restaurant => <div className="col-md-4" key={restaurant.id}>
      <article className={`card h-100 p-3 ${selected.id === restaurant.id ? "border-success border-2" : ""}`}>
        <span className="badge bg-warning text-dark align-self-start mb-2">Demo restaurant</span>
        <h3 className="h5">{restaurant.name}</h3><p>{restaurant.cuisine}</p>
        <button className={`btn mt-auto ${selected.id === restaurant.id ? "btn-success" : "btn-outline-success"}`} onClick={() => onSelect(restaurant)}>
          {selected.id === restaurant.id ? "Selected - browse menu below" : "Explore demo menu"}
        </button>
      </article>
    </div>)}</div>
  </section>;
}
