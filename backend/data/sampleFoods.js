const photos = {
  pizza: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=640&auto=format&fit=crop",
  burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=640&auto=format&fit=crop",
  curry: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=640&auto=format&fit=crop",
  pasta: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=640&auto=format&fit=crop",
  dessert: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=640&auto=format&fit=crop",
};

// Sample menu; prices are in INR and photos are illustrative.
module.exports = [
  ["Margherita Pizza", 249, "Tomato sauce, mozzarella and basil on a crisp pizza base.", "pizza"],
  ["Farmhouse Pizza", 329, "Pizza with peppers, onions, mushrooms and mozzarella.", "pizza"],
  ["Paneer Tikka Pizza", 349, "Spiced paneer, peppers and onions with melted cheese.", "pizza"],
  ["Classic Veg Burger", 129, "Vegetable patty with lettuce, tomato and house sauce.", "burger"],
  ["Cheese Burger", 159, "Vegetable patty, cheese, onions and creamy sauce.", "burger"],
  ["Crispy Chicken Burger", 199, "Crispy chicken, lettuce and mayonnaise in a toasted bun.", "burger"],
  ["Paneer Butter Masala", 229, "Paneer cubes in a creamy tomato and butter gravy.", "curry"],
  ["Dal Makhani", 189, "Slow-cooked black lentils with butter and cream.", "curry"],
  ["Chole Masala", 169, "Chickpeas simmered in a spiced onion and tomato gravy.", "curry"],
  ["Butter Chicken", 289, "Chicken in a creamy, lightly spiced tomato gravy.", "curry"],
  ["Kadai Paneer", 239, "Paneer and bell peppers cooked with kadai spices.", "curry"],
  ["Mixed Vegetable Curry", 179, "Seasonal vegetables in a fragrant tomato gravy.", "curry"],
  ["Arrabbiata Pasta", 219, "Pasta tossed in a spicy tomato and garlic sauce.", "pasta"],
  ["Creamy Alfredo Pasta", 249, "Pasta in a creamy cheese sauce with herbs.", "pasta"],
  ["Pesto Pasta", 259, "Pasta with basil pesto and vegetables.", "pasta"],
  ["Vanilla Ice Cream", 89, "Two scoops of classic vanilla ice cream.", "dessert"],
  ["Chocolate Ice Cream", 99, "Two scoops of rich chocolate ice cream.", "dessert"],
  ["Chocolate Sundae", 149, "Ice cream with chocolate sauce and crunchy toppings.", "dessert"],
].map(([name, price, description, photo]) => ({ name, price, description, image: photos[photo] }));
