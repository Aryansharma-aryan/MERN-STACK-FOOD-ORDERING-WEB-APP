import React, { useState, useEffect } from "react";
import axios from "axios";

const AdminDashboard = () => {
  const [foods, setFoods] = useState([]);
  const [newFood, setNewFood] = useState({
    name: "",
    price: "",
    description: "",
    image: "",
  });
  const [editingFood, setEditingFood] = useState(null);

  // Fetch all food items when the component mounts
  useEffect(() => {
    fetchFoods();
  }, []);

  // Fetch food items from the backend
  const fetchFoods = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3102/api/food"
      );
      setFoods(response.data);
    } catch (error) {
      console.error("Error fetching food items", error);
    }
  };

  // Handle adding a new food item
  const handleAddFood = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:3102/api/addFood",
        newFood
      );
      alert(response.data.message);
      fetchFoods(); // Refresh list after adding
      setNewFood({ name: "", price: "", description: "", image: "" });
    } catch (error) {
      console.error("Error adding food item", error);
    }
  };

  // Handle deleting a food item
  const handleDeleteFood = async (foodId) => {
    console.log("Deleting Food ID:", foodId);
    try {
      const response = await axios.delete(
        `http://localhost:3102/api/deleteFood/${foodId}`
      );
      alert(response.data.message);
      fetchFoods();
    } catch (error) {
      console.error(
        "Error deleting food item",
        error.response?.data || error.message
      );
    }
  };

  // Handle editing a food item
  const handleEditFood = (food) => {
    setEditingFood(food);
    setNewFood({
      name: food.name || "",
      price: food.price || "",
      description: food.description || "",
      image: food.image || "",
    }); // populate form with current data
  };

  // Handle updating food item
  const handleUpdateFood = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `http://localhost:3102/api/updateFood/${editingFood._id}`,
        newFood
      );
      alert("successfully updated",response);
      fetchFoods();
      setEditingFood(null);
      setNewFood({ name: "", price: "", description: "", image: "" });
    } catch (error) {
      console.error("Error updating food item", error);
    }
  };

  return (
    <div className="container">
      <h2>Admin Dashboard</h2>

      {/* Add or Edit Food Form */}
      <div className="mb-4">
        <h3>{editingFood ? "Edit Food Item" : "Add New Food Item"}</h3>
        <form onSubmit={editingFood ? handleUpdateFood : handleAddFood}>
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
            onChange={(e) =>
              setNewFood({ ...newFood, description: e.target.value })
            }
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
          <button type="submit" className="btn btn-primary">
            {editingFood ? "Update Food Item" : "Add Food Item"}
          </button>
          {editingFood && (
            <button
              type="button"
              className="btn btn-secondary ml-2"
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

      {/* List of Food Items */}
      <h3>Food Items</h3>
      <ul className="list-group">
        {foods.map((food) => (
          <li key={food._id} className="list-group-item">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <img
                  src={food.image || "https://via.placeholder.com/50"}
                  alt={food.name}
                  width="50"
                />
                <strong> {food.name}</strong> - ${food.price}
              </div>
              <div>
                <button
                  className="btn btn-warning mr-2"
                  onClick={() => handleEditFood(food)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDeleteFood(food._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminDashboard;
