import { useState } from "react";

function Auth({ setIsLoggedIn }) {
  const [isLogin, setIsLogin] = useState(true);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ FIXED URL (NO http://https://)
    const BASE_URL = "https://recipebox-backend-5i70.onrender.com";

    const url = isLogin
      ? `${BASE_URL}/api/auth/login`
      : `${BASE_URL}/api/auth/register`;

    const body = isLogin
      ? { email, password }
      : { username, email, password };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.token) {
        // 🔐 Save token
        localStorage.setItem("token", data.token);

        // 👤 Save user ID
        if (data.user && data.user.id) {
          localStorage.setItem("userId", data.user.id);
        }

        // 💾 Save full user data
        localStorage.setItem("userData", JSON.stringify(data.user));

        setIsLoggedIn(true);
      } else {
        alert(data.message || "Error");
      }
    } catch (error) {
      console.log("AUTH ERROR:", error);
      alert("Server not responding or network error");
    }
  };

  return (
    <div className="form-box">
      <h2>{isLogin ? "Login" : "Register"}</h2>

      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        )}

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="submit-btn">
          {isLogin ? "Login" : "Register"}
        </button>
      </form>

      <p
        style={{ cursor: "pointer", marginTop: "10px" }}
        onClick={() => setIsLogin(!isLogin)}
      >
        {isLogin
          ? "Don't have an account? Register"
          : "Already have an account? Login"}
      </p>
    </div>
  );
}

export default Auth;