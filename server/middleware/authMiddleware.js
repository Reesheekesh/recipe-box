const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      return res.status(401).json({ message: "No token, access denied" });
    }

    // 🔥 Extract token
    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, "secretkey");

    // ✅ FIX: always send clean user object
    req.user = {
      id: decoded.id,
      username: decoded.username   // 🔥 REQUIRED for comments
    };

    next();
  } catch (error) {
    console.log("AUTH ERROR:", error);
    res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = authMiddleware;