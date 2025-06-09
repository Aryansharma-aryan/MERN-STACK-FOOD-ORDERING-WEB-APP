import React, { useState, useEffect, useMemo } from "react";

const DisplayData = ({ setCart = () => {} }) => {
  const [foodData, setFoodData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL;
        const response = await fetch(`${API_URL}/api/food`, {
          mode: "cors",
          credentials: "include",
        });
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        const data = await response.json();
        const updatedData = data.map((item) => ({
          ...item,
          quantity: 1,
          price: Number(item.price) || 0,
        }));
        setFoodData(updatedData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Memoize filtered and sorted data to avoid unnecessary recalculations
  const filteredSortedData = useMemo(() => {
    let filtered = foodData.filter((food) =>
      food.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (sortOrder === "asc") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortOrder === "desc") {
      filtered.sort((a, b) => b.price - a.price);
    }
    return filtered;
  }, [foodData, searchTerm, sortOrder]);

  // Pagination slice
  const totalPages = Math.ceil(filteredSortedData.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSortedData.slice(start, start + itemsPerPage);
  }, [filteredSortedData, currentPage]);

  // Quantity handler
  const handleQuantityChange = (id, change) => {
    setFoodData((prev) =>
      prev.map((item) =>
        item._id === id
          ? { ...item, quantity: Math.max(1, item.quantity + change) }
          : item
      )
    );
  };

  const addToCart = (food) => {
    setCart((prevCart) => {
      const exists = prevCart.find((item) => item._id === food._id);
      if (exists) {
        return prevCart.map((item) =>
          item._id === food._id
            ? { ...item, quantity: item.quantity + food.quantity }
            : item
        );
      }
      return [...prevCart, { ...food }];
    });
  };

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className="container-fluid px-0">
      {loading ? (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "60vh" }}
        >
          <div
            className="spinner-border text-danger"
            role="status"
            style={{ width: "5rem", height: "5rem" }}
          >
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Carousel */}
          <div
            id="carouselExampleIndicators"
            className="carousel slide"
            data-bs-ride="carousel"
            data-bs-interval="3000"
          >
            <div className="carousel-inner">
              {[
                "https://i.pinimg.com/736x/ab/e6/57/abe65721a6d06545c99230151aab0177.jpg",
                "https://i.pinimg.com/736x/57/58/8b/57588b32c55b721df9710bfe1093fe1f.jpg",
                "https://i.pinimg.com/736x/2a/07/bb/2a07bb2cdc3048ebd4dfe470bc06d4bb.jpg",
              ].map((src, idx) => (
                <div
                  key={idx}
                  className={`carousel-item ${idx === 0 ? "active" : ""}`}
                >
                  <img
                    loading="lazy"
                    src={src}
                    className="d-block w-100 carousel-img"
                    alt={`Slide ${idx + 1}`}
                    style={{ maxHeight: "400px", objectFit: "cover" }}
                  />
                </div>
              ))}
            </div>
            <button
              className="carousel-control-prev"
              type="button"
              data-bs-target="#carouselExampleIndicators"
              data-bs-slide="prev"
            >
              <span
                className="carousel-control-prev-icon"
                aria-hidden="true"
              ></span>
              <span className="visually-hidden">Previous</span>
            </button>
            <button
              className="carousel-control-next"
              type="button"
              data-bs-target="#carouselExampleIndicators"
              data-bs-slide="next"
            >
              <span
                className="carousel-control-next-icon"
                aria-hidden="true"
              ></span>
              <span className="visually-hidden">Next</span>
            </button>
          </div>

          {/* Search & Sort */}
          <div className="d-flex justify-content-center align-items-center gap-3 my-3 flex-wrap">
            <input
              type="text"
              className="form-control w-50 shadow-lg"
              placeholder="Search for food..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                borderRadius: "10px",
                padding: "10px",
                fontSize: "16px",
                background: "white",
                border: "2px solid #ff0000",
                boxShadow:
                  "0 0 20px 5px #ff0000, 0 0 30px 10px #ff0000, 0 0 40px 15px #ff0000",
              }}
            />
            <select
              className="form-select w-auto shadow-lg"
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                borderRadius: "10px",
                padding: "10px",
                fontSize: "16px",
                border: "2px solid #ff0000",
                boxShadow:
                  "0 0 20px 5px #ff0000, 0 0 30px 10px #ff0000, 0 0 40px 15px #ff0000",
              }}
            >
              <option value="">Sort by Price</option>
              <option value="asc">Price: Low to High</option>
              <option value="desc">Price: High to Low</option>
            </select>
          </div>

          {/* Food Cards */}
          <div
            className="container mt-4"
            style={{
              padding: "20px",
              background: "white",
              borderRadius: "15px",
              boxShadow: "0 0 10px rgba(255,77,0,0.7)",
            }}
          >
            <div className="row">
              {currentItems.length === 0 ? (
                <p className="text-center w-100 mt-4 text-danger">
                  🚨 No matching food items found!
                </p>
              ) : (
                currentItems.map((food) => (
              <div className="col-12 mb-4" key={food._id}>

                    <div
                      className="card shadow-lg"
                      style={{ borderRadius: "15px" }}
                    >
                      <img
                        loading="lazy"
                        src={food.image || "https://via.placeholder.com/200"}
                        alt={food.name}
                        className="card-img-top"
                        style={{
                          height: "200px",
                          objectFit: "cover",
                          borderTopLeftRadius: "15px",
                          borderTopRightRadius: "15px",
                        }}
                      />
                      <div className="card-body">
                        <h5 className="card-title">{food.name}</h5>
                        <p className="card-text text-muted">
                          {food.description}
                        </p>

                        <div className="d-flex justify-content-between align-items-center">
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleQuantityChange(food._id, -1)}
                          >
                            -
                          </button>
                          <span className="mx-2">{food.quantity}</span>
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleQuantityChange(food._id, 1)}
                          >
                            +
                          </button>
                        </div>

                        <p className="mt-2 fw-bold text-center">
                          Total Price: ₹
                          {(food.price * food.quantity).toFixed(2)}
                        </p>

                        <button
                          className="btn btn-warning mt-2 w-100"
                          onClick={() => addToCart(food)}
                        >
                          Add to Cart 🛒
                        </button>

                        <hr />

                        {/* Review Form */}
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            const name = e.target.name.value.trim();
                            const rating = parseInt(e.target.rating.value);
                            const comment = e.target.comment.value.trim();

                            if (!name || !rating) {
                              alert("Please provide name and rating.");
                              return;
                            }

                            try {
                              const res = await fetch(
                                `${import.meta.env.VITE_API_URL}/api/${food._id}/review`,
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  mode: "cors",
                                  credentials: "include",
                                  body: JSON.stringify({ name, rating, comment }),
                                }
                              );
                              const data = await res.json();
                              alert(data.message || "Review submitted!");
                              e.target.reset();
                            } catch (err) {
                              alert("Failed to submit review");
                              console.error(err);
                            }
                          }}
                        >
                          <input
                            name="name"
                            type="text"
                            className="form-control mb-2"
                            placeholder="Your Name"
                            required
                          />
                          <select
                            name="rating"
                            className="form-select mb-2"
                            required
                          >
                            <option value="">⭐ Select Rating</option>
                            {[1, 2, 3, 4, 5].map((r) => (
                              <option key={r} value={r}>
                                {"⭐".repeat(r)}
                              </option>
                            ))}
                          </select>
                          <textarea
                            name="comment"
                            rows="2"
                            className="form-control mb-2"
                            placeholder="Write your review..."
                          />
                          <button
                            type="submit"
                            className="btn btn-outline-primary btn-sm w-100"
                          >
                            Submit Review ✍️
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav aria-label="Page navigation example">
                <ul className="pagination justify-content-center mt-4">
                  <li
                    className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                    onClick={() => goToPage(currentPage - 1)}
                  >
                    <button className="page-link">Previous</button>
                  </li>

                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <li
                        key={pageNum}
                        className={`page-item ${
                          currentPage === pageNum ? "active" : ""
                        }`}
                        onClick={() => goToPage(pageNum)}
                      >
                        <button className="page-link">{pageNum}</button>
                      </li>
                    );
                  })}

                  <li
                    className={`page-item ${
                      currentPage === totalPages ? "disabled" : ""
                    }`}
                    onClick={() => goToPage(currentPage + 1)}
                  >
                    <button className="page-link">Next</button>
                  </li>
                </ul>
              </nav>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DisplayData;
