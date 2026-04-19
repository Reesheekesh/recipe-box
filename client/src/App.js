import { useEffect, useState } from "react";
import "./App.css";
import Auth from "./Auth";

const API = "https://recipebox-backend-5i70.onrender.com";

function App() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState({});
const [newComment, setNewComment] = useState("");

  const [title, setTitle] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  const [showFavorites, setShowFavorites] = useState(false);
  const [showExplore, setShowExplore] = useState(false);
  const [showFeed, setShowFeed] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("token")
  );

  const userId = localStorage.getItem("userId");

  // 🔥 FETCH RECIPES
  const fetchRecipes = async () => {
    try {
      setLoading(true);

      const url = showFeed
        ? `${API}/api/recipes/feed`
        : showExplore
        ? `${API}/api/recipes/all`
        : `${API}/api/recipes/my`;

      const res = await fetch(url, {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      });

      const data = await res.json();
      setRecipes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("FETCH ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) fetchRecipes();
  }, [isLoggedIn, showExplore, showFeed]);

  // ➕ ADD / UPDATE
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", title);
    formData.append("ingredients", ingredients);
    formData.append("instructions", instructions);
    if (image) formData.append("image", image);

    try {
      if (editingId) {
        await fetch(`${API}/api/recipes/${editingId}`, {
          method: "PUT",
          headers: {
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
          body: formData,
        });
      } else {
        await fetch(`${API}/api/recipes/create`, {
          method: "POST",
          headers: {
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
          body: formData,
        });
      }

      fetchRecipes();

      setTitle("");
      setIngredients("");
      setInstructions("");
      setImage(null);
      setPreview(null);
      setEditingId(null);
    } catch (err) {
      console.log("SUBMIT ERROR:", err);
    }
  };

  // ❤️ FAVORITE
  const handleFavorite = async (id) => {
    await fetch(`${API}/api/recipes/favorite/${id}`, {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    });

    fetchRecipes();
  };

  // 🗑 DELETE
  const handleDelete = async (id) => {
    await fetch(`${API}/api/recipes/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    });

    fetchRecipes();
  };

  // 🔥 COMMENT FUNCTION (NEW)
  const handleComment = async (recipeId, text) => {
  if (!text || !text.trim()) return;

  try {
    await fetch(`${API}/api/recipes/comment/${recipeId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify({ text }),
    });

    // clear input for that recipe
    //redeploy
    const updated = recipes.map(r =>
      r._id === recipeId ? { ...r, newComment: "" } : r
    );
    setRecipes(updated);

    fetchRecipes();
  } catch (err) {
    console.log("COMMENT ERROR:", err);
  }
};
//just add a space

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <Auth setIsLoggedIn={setIsLoggedIn} />;
  }

  const filteredRecipes = recipes
    .filter((r) =>
      r.title.toLowerCase().includes(search.toLowerCase())
    )
    .filter((r) =>
      !showFavorites ? true : (r.favorites || []).includes(userId)
    );

  return (
    <div className="container">

      {/* HEADER */}
      <div className="header">
        <h1>🍜 RecipeBox</h1>
        <button className="btn delete" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* FORM */}
      {!showExplore && !showFeed && (
        <div className="form-box">
          <h2>{editingId ? "Edit Recipe" : "Add Recipe"}</h2>

          <form onSubmit={handleSubmit}>
            <input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              placeholder="Ingredients"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
            />
            <input
              placeholder="Instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />

            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files[0];
                setImage(file);
                if (file) setPreview(URL.createObjectURL(file));
              }}
            />

            {preview && <img src={preview} className="preview" alt="" />}

            <button className="submit-btn">
              {editingId ? "Update" : "Add"}
            </button>
          </form>
        </div>
      )}

      <div className="filter-buttons">

        <button
          onClick={() => {
            setShowExplore(false);
            setShowFeed(false);
          }}
          className={`filter-btn ${!showExplore && !showFeed ? "active" : ""}`}
        >
          👤 My
        </button>

        <button
          onClick={() => {
            setShowExplore(true);
            setShowFeed(false);
          }}
          className={`filter-btn ${showExplore ? "active" : ""}`}
        >
          🌍 Explore
        </button>

        <button
          onClick={() => {
            setShowFeed(true);
            setShowExplore(false);
          }}
          className={`filter-btn ${showFeed ? "active" : ""}`}
        >
          🔥 Feed
        </button>

        <button
          onClick={() => setShowFavorites(!showFavorites)}
          className={`filter-btn ${showFavorites ? "active" : ""}`}
        >
          ❤️
        </button>

      </div>

      {/* SEARCH */}
      <input
        className="search"
        placeholder="🔍 Search recipes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* RECIPES */}
      <div className="grid">
        {!loading &&
          filteredRecipes.map((recipe) => (
            <div key={recipe._id} className="card">

              <h3>{recipe.title}</h3>

              <p><b>Ingredients:</b> {recipe.ingredients}</p>
              <p><b>Instructions:</b> {recipe.instructions}</p>

            {recipe.image ? (
  <div className="image-box">
    <img
      src={`${API}/uploads/${recipe.image}`}
      alt="recipe"
      onError={(e) => {
        e.target.src = "https://via.placeholder.com/150";
      }}
    />
  </div>
) : (
  <div className="image-box">
    <span style={{ opacity: 0.5 }}>No Image</span>
  </div>
)}

              <div className="btn-group">

                <button
                  className={`btn fav ${(recipe.favorites || []).includes(userId) ? "active" : ""}`}
                  onClick={() => handleFavorite(recipe._id)}
                >
                  ❤️ {recipe.favorites?.length || 0}
                </button>

                <button
                  className="btn edit"
                  onClick={() => {
                    setEditingId(recipe._id);
                    setTitle(recipe.title);
                    setIngredients(recipe.ingredients);
                    setInstructions(recipe.instructions);

                    if (recipe.image) {
                      setPreview(`${API}/uploads/${recipe.image}`);
                    }
                  }}
                >
                  ✏️ Edit
                </button>

                <button
                  className="btn delete"
                  onClick={() => handleDelete(recipe._id)}
                >
                  🗑 Delete
                </button>

              </div>

              {/* 🔥 COMMENT UI (NEW) */}
              <div className="comment-box">

                <div className="comment-input">
                  <input
                    placeholder="Add comment..."
                    value={recipe.newComment || ""}
                    onChange={(e) => {
                      const updated = recipes.map(r =>
                        r._id === recipe._id
                          ? { ...r, newComment: e.target.value }
                          : r
                      );
                      setRecipes(updated);
                    }}
                  />

                  <button
                    onClick={() => handleComment(recipe._id, recipe.newComment)}
                  >
                    ➤
                  </button>
                </div>

                <div className="comment-list">
                  {(recipe.comments || []).map((c, i) => (
                    <div key={i} className="comment-item">
                      <span className="comment-user">{typeof c.user === "object" ? c.user.username : "user"}</span>
                      <span className="comment-text">{c.text}</span>
                    </div>
                  ))}
                </div>

              </div>

            </div>
          ))}
      </div>
    </div>
  );
}

export default App;