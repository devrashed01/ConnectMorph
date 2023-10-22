const router = require("express").Router();

const User = require("../models/User");

// @route GET api/admin/users
// @desc Get all users
// @access Public (for now)
router.get("/users", async (req, res) => {
  const users = await User.find().select("-password");
  if (!users) return res.status(404).json({ message: "No users found" });

  res.json(users);
});

module.exports = router;
