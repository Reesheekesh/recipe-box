const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("RecipeBox API running...");
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// Routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const recipeRoutes = require("./routes/recipes");
app.use("/api/recipes", recipeRoutes);

// Static folder for images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Server start
const PORT = process.env.PORT || 5000; // 🔥 IMPORTANT FOR RENDER
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});