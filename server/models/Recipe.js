const mongoose = require("mongoose");

const recipeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    ingredients: {
      type: String,
      required: true
    },

    instructions: {
      type: String,
      required: true
    },

    image: {
      type: String
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // ❤️ FAVORITES
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    // 💬 COMMENTS
    comments: [
      {
        text: {
          type: String,
          required: true,
          trim: true
        },

        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        },

        username: {
          type: String,
          default: "User"
        },

        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true // 🔥 adds createdAt + updatedAt automatically
  }
);

module.exports = mongoose.model("Recipe", recipeSchema);