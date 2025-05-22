import React, { useState, useEffect } from "react";

const DisplayData = ({ setCart = () => {} }) => {
  const [foodData, setFoodData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
       const API_URL = import.meta.env.VITE_API_URL; // Ensure this is set correctly in your environment

const response = await fetch(`${API_URL}/food`); // Use the API_URL variable

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        const updatedData = data.map((item) => ({
          ...item,
          quantity: 1,
          price: Number(item.price) || 0,
          imageLoaded: false,
        }));
        setFoodData(updatedData);
      } catch (error) {
        console.error("Error fetching food data:", error);
      }
    };

    fetchData();
  }, []);

  const handleQuantityChange = (index, change) => {
    setFoodData((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, quantity: Math.max(1, item.quantity + change) }
          : item
      )
    );
  };

  const addToCart = (food) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item._id === food._id);
      if (existingItem) {
        return prevCart.map((item) =>
          item._id === food._id
            ? { ...item, quantity: item.quantity + food.quantity }
            : item
        );
      } else {
        return [...prevCart, { ...food }];
      }
    });
  };

  const handleImageLoad = (index) => {
    setFoodData((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, imageLoaded: true } : item
      )
    );
  };

  const filteredFood = foodData.filter((food) =>
    food.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container-fluid px-0">
      {/* 🔥 Carousel */}
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
                className="d-block w-100 carousel-img"
                src={src}
                alt={`Slide ${idx + 1}`}
              />
            </div>
          ))}
        </div>
        <a
          className="carousel-control-prev"
          href="#carouselExampleIndicators"
          role="button"
          data-bs-slide="prev"
        >
          <span className="carousel-control-prev-icon" aria-hidden="true"></span>
        </a>
        <a
          className="carousel-control-next"
          href="#carouselExampleIndicators"
          role="button"
          data-bs-slide="next"
        >
          <span className="carousel-control-next-icon" aria-hidden="true"></span>
        </a>
      </div>

      {/* 🔍 Search */}
      <div
        className="d-flex justify-content-center position-relative"
        style={{ marginTop: "-50px" }}
      >
        <input
          type="text"
          className="form-control w-50 shadow-lg"
          placeholder="Search for food..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            borderRadius: "10px",
            padding: "10px",
            fontSize: "16px",
            zIndex: "10",
            background: "white",
            border: "2px solid #ff0000",
            boxShadow:
              "0 0 20px 5px #ff0000, 0 0 30px 10px #ff0000, 0 0 40px 15px #ff0000",
          }}
        />
      </div>

      {/* 🍽️ Food Cards */}
      <div
        className="container mt-4"
        style={{
          borderRadius: "15px",
          padding: "20px",
          background: "white",
          boxShadow: "0 0 10px rgba(255, 77, 0, 0.7)",
          transition: "0.3s ease-in-out",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 0 30px 15px rgba(255, 77, 0, 1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "0 0 20px rgba(222, 77, 0, 0.7)";
        }}
      >
        <div className="row">
          {filteredFood.length > 0 ? (
            filteredFood.map((food, index) => (
              <div className="col-md-4 mb-4" key={food._id}>
                <div
                  className="card shadow-lg"
                  style={{ width: "100%", borderRadius: "15px" }}
                >
                  <img
                    loading="lazy"
                    src={food.image || "https://via.placeholder.com/200"}
                    alt={food.name}
                    onLoad={() => handleImageLoad(index)}
                    className={`card-img-top lazy-image ${
                      food.imageLoaded ? "lazy-image-loaded" : ""
                    }`}
                    style={{
                      height: "200px",
                      objectFit: "cover",
                      borderTopLeftRadius: "15px",
                      borderTopRightRadius: "15px",
                    }}
                  />
                  <div className="card-body">
                    <h5 className="card-title">{food.name}</h5>
                    <p className="card-text text-muted">{food.description}</p>

                    <div className="d-flex justify-content-between align-items-center">
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleQuantityChange(index, -1)}
                      >
                        -
                      </button>
                      <span className="mx-2">{food.quantity}</span>
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => handleQuantityChange(index, 1)}
                      >
                        +
                      </button>
                    </div>

                    <p className="mt-2 fw-bold text-center">
                      Total Price: ₹{(food.price * food.quantity).toFixed(2)}
                    </p>

                    <button
                      className="btn btn-warning mt-2 w-100"
                      onClick={() => addToCart(food)}
                    >
                      Add to Cart 🛒
                    </button>

                    {/* ⭐ Review Form */}
                    <hr />
                    <form
  onSubmit={async (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const rating = parseInt(e.target.rating.value);
    const comment = e.target.comment.value;

    try {
      const res = await fetch(
       `http://localhost:3100/api/${food._id}/review`, // Corrected URL with /api prefix
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
 <select name="rating" className="form-select mb-2" required>
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
  ></textarea>
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
          ) : (
            <p className="text-center w-100 mt-4 text-danger">
              🚨 No matching food items found!
            </p>
          )}
        </div>
      </div>

      {/* CSS */}
      <style>
        {`
          .carousel-img {
            height: 300px;
            object-fit: cover;
            filter: blur(3px) brightness(80%);
            transition: filter 0.5s ease-in-out;
          }

          .carousel-item.active .carousel-img {
            filter: blur(1px) brightness(100%);
          }

          .lazy-image {
            filter: blur(10px);
            transition: filter 0.5s ease-out;
          }

          .lazy-image-loaded {
            filter: blur(0);
          }
        `}
      </style>
    </div>
  );
};

export default DisplayData;
