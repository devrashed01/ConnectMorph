const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {
  let token = req.header("Authorization");
  token = token ? token.replace("Bearer ", "") : token;
  if (!token) {
    return res
      .status(400)
      .json({ message: "Please provide a valid token", success: false });
  }

  const decoded = await jwt.verify(token, process.env.JWT_SECRET);
  req.user = decoded;
  return next();
};
