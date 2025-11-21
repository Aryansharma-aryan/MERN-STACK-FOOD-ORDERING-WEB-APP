import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [foods, setFoods] = useState([]);
  const [newFood, setNewFood] = useState({
    name: "",
    price: "",
    description: "",
    image: "",
  });
  const [editingFood, setEditingFood] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const token = localStorage.getItem("authToken");
  const isAdmin = localStorage.getItem("isAdmin") === "true";

  // Redirect non-admin users
  useEffect(() => {
    if (!token || !isAdmin) {
      alert("Unauthorized! Admin access required.");
      navigate("/login", { replace: true });
    }
  }, [token, isAdmin, navigate]);

  // Create axios instance with token
  const axiosInstance = axios.create({
    baseURL: "https://mern-stack-food-ordering-web-app-2.onrender.com/api",
    headers: { Authorization: `Bearer ${token}` },
  });

  // Axios interceptor for 401/403
  useEffect(() => {
    const interceptor = axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          if (error.response.status === 401) {
            alert("Unauthorized! Please log in again.");
            localStorage.clear();
            navigate("/login", { replace: true });
          } else if (error.response.status === 403) {
            alert(error.response.data.message || "Access Denied! Admins only.");
          }
        }
        return Promise.reject(error);
      }
    );
    return () => axiosInstance.interceptors.response.eject(interceptor);
  }, [axiosInstance, navigate]);

  // Fetch all foods
  const fetchFoods = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await axiosInstance.get("/food");
      setFoods(res.data);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to fetch food.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && isAdmin) fetchFoods();
  }, [token, isAdmin]);

  // Add or update food
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    const foodData = { ...newFood, price: parseFloat(newFood.price) };

    try {
      if (editingFood) {
        const res = await axiosInstance.put(`/updateFood/${editingFood._id}`, foodData);
        alert(res.data.message || "Food updated!");
      } else {
        const res = await axiosInstance.post("/addFood", foodData);
        alert(res.data.message || "Food added!");
      }
      setNewFood({ name: "", price: "", description: "", image: "" });
      setEditingFood(null);
      fetchFoods();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Error saving food.");
      alert(err.response?.data?.message || "Error saving food.");
    }
  };

  const handleEditFood = (food) => {
    setEditingFood(food);
    setNewFood({
      name: food.name,
      price: food.price,
      description: food.description,
      image: food.image,
    });
  };

  const handleDeleteFood = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      const res = await axiosInstance.delete(`/deleteFood/${id}`);
      alert(res.data.message || "Deleted!");
      fetchFoods();
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="container mt-4">
      <h2>Admin Dashboard</h2>
      {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

      {/* Add/Edit Food */}
      <div className="mb-4">
        <h3>{editingFood ? "Edit Food" : "Add Food"}</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="form-control mb-2"
            placeholder="Food Name"
            value={newFood.name}
            onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
            required
          />
          <input
            type="number"
            className="form-control mb-2"
            placeholder="Price"
            value={newFood.price}
            onChange={(e) => setNewFood({ ...newFood, price: e.target.value })}
            required
          />
          <textarea
            className="form-control mb-2"
            placeholder="Description"
            value={newFood.description}
            onChange={(e) => setNewFood({ ...newFood, description: e.target.value })}
            required
          />
          <input
            type="text"
            className="form-control mb-2"
            placeholder="Image URL"
            value={newFood.image}
            onChange={(e) => setNewFood({ ...newFood, image: e.target.value })}
            required
          />
          <button className="btn btn-primary">{editingFood ? "Update" : "Add"}</button>
          {editingFood && (
            <button
              type="button"
              className="btn btn-secondary ms-2"
              onClick={() => {
                setEditingFood(null);
                setNewFood({ name: "", price: "", description: "", image: "" });
              }}
            >
              Cancel
            </button>
          )}
        </form>
      </div>

      {/* Food List */}
      <h3>Food Items</h3>
      {loading ? (
        <p>Loading...</p>
      ) : foods.length === 0 ? (
        <p>No foods found.</p>
      ) : (
        <ul className="list-group">
          {foods.map((food) => (
            <li
              key={food._id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <div>
                <img
                  src={food.image || "https://via.placeholder.com/50"}
                  alt={food.name}
                  width="50"
                  className="me-2"
                />
                <strong>{food.name}</strong> - ${food.price}
              </div>
              <div>
                <button
                  className="btn btn-warning me-2"
                  onClick={() => handleEditFood(food)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDeleteFood(food._id, food.name)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdminDashboard;
