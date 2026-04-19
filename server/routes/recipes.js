const express = require("express");
const router = express.Router();

const Recipe = require("../models/Recipe");
const User = require("../models/User");
const upload = require("../middleware/upload");
const authMiddleware = require("../middleware/authMiddleware");


// 🔥 FOLLOW / UNFOLLOW (SAFE VERSION)
router.put("/follow/:userId", authMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const targetUser = await User.findById(req.params.userId);

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (currentUser._id.toString() === targetUser._id.toString()) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }

    const isFollowing = currentUser.following.some(
      (id) => id.toString() === targetUser._id.toString()
    );

    if (isFollowing) {
      // 🔻 UNFOLLOW
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== targetUser._id.toString()
      );

      targetUser.followers = targetUser.followers.filter(
        (id) => id.toString() !== currentUser._id.toString()
      );

    } else {
      // 🔺 FOLLOW
      currentUser.following.push(targetUser._id);
      targetUser.followers.push(currentUser._id);
    }

    await currentUser.save();
    await targetUser.save();

    res.json({
      message: isFollowing ? "Unfollowed" : "Followed",
      following: currentUser.following.map((id) => id.toString())
    });

  } catch (error) {
    console.log("FOLLOW ERROR:", error);
    res.status(500).json({ message: error.message });
  }
});


// 🔥 FEED (LATEST FIRST 🔥)
router.get("/feed", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    const recipes = await Recipe.find({
      user: { $in: user.following }
    })
      .populate("user", "username")
      .sort({ createdAt: -1 }); // 🔥 latest first

    const fixed = recipes.map((r) => ({
      _id: r._id.toString(),
      title: r.title,
      ingredients: r.ingredients,
      instructions: r.instructions,
      image: r.image,

      user: {
        _id: r.user?._id?.toString(),
        username: r.user?.username || "User"
      },

      favorites: (r.favorites || []).map((f) => f.toString()),

      comments: (r.comments || []).map((c) => ({
        text: c.text,
        username: c.username || "User",
        user: c.user?.toString()
      }))
    }));

    res.json(fixed);

  } catch (error) {
    console.log("FEED ERROR:", error);
    res.status(500).json({ message: error.message });
  }
});


// 🔥 CREATE
router.post(
  "/create",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      const { title, ingredients, instructions } = req.body;

      const newRecipe = new Recipe({
        title,
        ingredients,
        instructions,
        image: req.file ? req.file.filename : null,
        user: req.user.id,
        favorites: [],
        comments: []
      });

      await newRecipe.save();
      res.status(201).json(newRecipe);

    } catch (error) {
      console.log("CREATE ERROR:", error);
      res.status(500).json({ message: error.message });
    }
  }
);


// 🔥 MY RECIPES
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const recipes = await Recipe.find({ user: req.user.id });

    const fixed = recipes.map((r) => ({
      _id: r._id.toString(),
      title: r.title,
      ingredients: r.ingredients,
      instructions: r.instructions,
      image: r.image,

      user: {
        _id: r.user.toString(),
        username: "You"
      },

      favorites: (r.favorites || []).map((f) => f.toString()),

      comments: (r.comments || []).map((c) => ({
        text: c.text,
        username: c.username || "User",
        user: c.user?.toString()
      }))
    }));

    res.json(fixed);

  } catch (error) {
    console.log("MY RECIPES ERROR:", error);
    res.status(500).json({ message: error.message });
  }
});


// 🌍 EXPLORE
router.get("/all", authMiddleware, async (req, res) => {
  try {
    const recipes = await Recipe.find()
      .populate("user", "username")
      .sort({ createdAt: -1 }); // 🔥 latest first

    const fixed = recipes.map((r) => ({
      _id: r._id.toString(),
      title: r.title,
      ingredients: r.ingredients,
      instructions: r.instructions,
      image: r.image,

      user: {
        _id: r.user?._id?.toString(),
        username: r.user?.username || "User"
      },

      favorites: (r.favorites || []).map((f) => f.toString()),

      comments: (r.comments || []).map((c) => ({
        text: c.text,
        username: c.username || "User",
        user: c.user?.toString()
      }))
    }));

    res.json(fixed);

  } catch (error) {
    console.log("EXPLORE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
});


// ❤️ FAVORITE
router.put("/favorite/:id", authMiddleware, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    const userId = req.user.id.toString();

    const isFav = recipe.favorites.some(
      (fav) => fav.toString() === userId
    );

    if (isFav) {
      recipe.favorites = recipe.favorites.filter(
        (fav) => fav.toString() !== userId
      );
    } else {
      recipe.favorites.push(userId);
    }

    await recipe.save();

    res.json({
      ...recipe._doc,
      favorites: recipe.favorites.map((f) => f.toString())
    });

  } catch (error) {
    console.log("FAVORITE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
});


// 💬 COMMENT
router.post("/comment/:id", authMiddleware, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!req.body.text || req.body.text.trim() === "") {
      return res.status(400).json({ message: "Comment cannot be empty" });
    }

    const newComment = {
      text: req.body.text,
      user: req.user.id,
      username: req.user.username || "User"
    };

    recipe.comments.push(newComment);

    await recipe.save();

    res.json({
      comments: recipe.comments.map((c) => ({
        text: c.text,
        username: c.username,
        user: c.user?.toString()
      }))
    });

  } catch (error) {
    console.log("COMMENT ERROR:", error);
    res.status(500).json({ message: error.message });
  }
});


// 🔥 UPDATE
router.put("/:id", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    if (recipe.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { title, ingredients, instructions } = req.body;

    recipe.title = title || recipe.title;
    recipe.ingredients = ingredients || recipe.ingredients;
    recipe.instructions = instructions || recipe.instructions;

    if (req.file) recipe.image = req.file.filename;

    await recipe.save();
    res.json(recipe);

  } catch (error) {
    console.log("UPDATE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
});


// 🔥 DELETE
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    if (recipe.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    await recipe.deleteOne();

    res.json({ message: "Deleted successfully" });

  } catch (error) {
    console.log("DELETE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;