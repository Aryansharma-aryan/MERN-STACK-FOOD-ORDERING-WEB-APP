import React, { useState, useEffect, useMemo } from "react";

const DisplayData = ({ setCart = () => {} }) => {
  const [foodData, setFoodData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 6;

  // ----------------------------
  //   🔥 FETCH DATA SUPER FAST
  // ----------------------------
  useEffect(() => {
    const cached = sessionStorage.getItem("foodCache");

    if (cached) {
      setFoodData(JSON.parse(cached));
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 7000);

        const res = await fetch(
          "https://mern-stack-food-ordering-web-app-2.onrender.com/api/food",
          {
            credentials: "include",
            mode: "cors",
            cache: "force-cache",
            signal: controller.signal,
          }
        );

        clearTimeout(timeout);

        if (!res.ok) throw new Error(`Error: ${res.status}`);

        const data = await res.json();

        const finalData = data.map((item) => ({
          ...item,
          quantity: 1,
          price: Number(item.price) || 0,
        }));

        sessionStorage.setItem("foodCache", JSON.stringify(finalData));
        setFoodData(finalData);
      } catch (err) {
        console.error("FETCH ERROR:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ----------------------------
  //   🔥 DEBOUNCE SEARCH
  // ----------------------------
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // ----------------------------
  //   🔥 FILTERED DATA
  // ----------------------------
  const filteredData = useMemo(() => {
    const search = debouncedSearch.toLowerCase();
    return foodData.filter((f) => f.name.toLowerCase().includes(search));
  }, [foodData, debouncedSearch]);

  // ----------------------------
  //   🔥 SORTED DATA
  // ----------------------------
  const sortedData = useMemo(() => {
    const sorted = [...filteredData];
    if (sortOrder === "asc") sorted.sort((a, b) => a.price - b.price);
    if (sortOrder === "desc") sorted.sort((a, b) => b.price - a.price);
    return sorted;
  }, [filteredData, sortOrder]);

  // ----------------------------
  //   🔥 PAGINATION
  // ----------------------------
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, currentPage]);

  // ----------------------------
  //   🔥 QUANTITY UPDATE
  // ----------------------------
  const handleQuantityChange = (id, change) => {
    setFoodData((prev) =>
      prev.map((item) =>
        item._id === id
          ? { ...item, quantity: Math.max(1, item.quantity + change) }
          : item
      )
    );
  };

  // ----------------------------
  //   🔥 CART HANDLER
  // ----------------------------
  const addToCart = (food) => {
    const token = localStorage.getItem("authToken");
    if (!token) return alert("⚠️ Please login to add items to cart.");

    setCart((prev) => {
      const existing = prev.find((i) => i._id === food._id);
      if (existing) {
        alert(`Updated ${food.name} quantity!`);
        return prev.map((i) =>
          i._id === food._id
            ? { ...i, quantity: i.quantity + food.quantity }
            : i
        );
      }
      alert(`${food.name} added to cart!`);
      return [...prev, food];
    });
  };

  const goToPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setCurrentPage(p);
  };

  // ----------------------------
  //   🔥 UI SECTION
  // ----------------------------
  return (
    <div className="container-fluid px-0">

      {/* LOADING */}
      {loading ? (
        <div className="text-center mt-5">
          <div className="spinner-border text-danger" style={{ width: "5rem", height: "5rem" }} />
          <p className="mt-3 fw-bold text-danger">Loading menu...</p>
        </div>
      ) : (
        <>
          {/* Carousel */}
          <div id="carouselExampleIndicators" className="carousel slide" data-bs-ride="carousel">
            <div className="carousel-inner">
              {[
                "https://i.pinimg.com/736x/ab/e6/57/abe65721a6d06545c99230151aab0177.jpg",
                "https://i.pinimg.com/736x/57/58/8b/57588b32c55b721df9710bfe1093fe1f.jpg",
                "https://i.pinimg.com/736x/2a/07/bb/2a07bb2cdc3048ebd4dfe470bc06d4bb.jpg",
              ].map((src, i) => (
                <div key={i} className={`carousel-item ${i === 0 ? "active" : ""}`}>
                  <img src={src} className="d-block w-100" style={{ maxHeight: "400px", objectFit: "cover" }} />
                </div>
              ))}
            </div>

            <button className="carousel-control-prev" type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide="prev">
              <span className="carousel-control-prev-icon"></span>
            </button>
            <button className="carousel-control-next" type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide="next">
              <span className="carousel-control-next-icon"></span>
            </button>
          </div>

          {/* Search + Sort */}
          <div className="d-flex justify-content-center gap-3 my-3 flex-wrap">
            <input
              className="form-control w-50 shadow-lg"
              placeholder="Search food..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ borderRadius: "10px", padding: "10px" }}
            />

            <select
              className="form-select w-auto shadow-lg"
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value);
                setCurrentPage(1);
              }}
              style={{ borderRadius: "10px", padding: "10px" }}
            >
              <option value="">Sort by Price</option>
              <option value="asc">Low → High</option>
              <option value="desc">High → Low</option>
            </select>
          </div>

          {/* Food Cards */}
          <div className="container mt-4">
            <div className="row">
              {currentItems.length === 0 ? (
                <p className="text-center mt-4 text-danger">No items found!</p>
              ) : (
                currentItems.map((food) => (
                  <div className="col-md-4 mb-4" key={food._id}>
                    <div className="card shadow-lg" style={{ borderRadius: "15px" }}>
                      <img
                        src={food.image || "https://via.placeholder.com/200"}
                        className="card-img-top"
                        style={{ height: "200px", objectFit: "cover" }}
                      />

                      <div className="card-body">
                        <h5>{food.name}</h5>
                        <p className="text-muted">{food.description}</p>

                        <div className="d-flex justify-content-between align-items-center">
                          <button className="btn btn-danger btn-sm" onClick={() => handleQuantityChange(food._id, -1)}>
                            -
                          </button>
                          <span>{food.quantity}</span>
                          <button className="btn btn-success btn-sm" onClick={() => handleQuantityChange(food._id, 1)}>
                            +
                          </button>
                        </div>

                        <p className="fw-bold text-center mt-2">₹{(food.price * food.quantity).toFixed(2)}</p>

                        <button className="btn btn-warning w-100 mt-2" onClick={() => addToCart(food)}>
                          Add to Cart 🛒
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <ul className="pagination justify-content-center mt-3">
                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => goToPage(currentPage - 1)}>Previous</button>
                </li>

                {[...Array(totalPages)].map((_, i) => (
                  <li key={i} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                    <button className="page-link" onClick={() => goToPage(i + 1)}>{i + 1}</button>
                  </li>
                ))}

                <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => goToPage(currentPage + 1)}>Next</button>
                </li>
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DisplayData;
