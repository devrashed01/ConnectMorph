const router = require("express").Router();
const bcrypt = require("bcryptjs");
const { check, validationResult } = require("express-validator");

const User = require("../models/User");

// @route POST api/auth/register
// @desc Register user
// @access Public
router.post(
  "/register",
  [
    check("username", "Username is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check("phone", "Please include a valid phone number").isMobilePhone(),
    check("name", "Name is required").not().isEmpty(),
    check("password", "Password must be at least 6 characters").isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    // check for errors
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    // destructure request body
    const { username, email, phone, name, password } = req.body;

    // check if user exists
    let user = await User.findOne({ email });
    if (user)
      return res
        .status(400)
        .json({ errors: [{ message: "User already exists" }] });

    // create new user
    user = new User({ username, email, phone, name });

    // hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // save new user
    await user.save();

    // return jsonwebtoken
    const token = user.generateAuthToken();
    res.json({ token });
  }
);

// @route POST api/auth/login
// @desc Login user
// @access Public
router.post(
  "/login",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password must be at least 6 characters").isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    // check for errors
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res
        .status(400)
        .json({ errors: errors.array(), message: "Invalid credentials" });

    // destructure request body
    const { email, password } = req.body;

    // check if user exists
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    // return jsonwebtoken
    const token = user.generateAuthToken();
    res.json({ token, message: "Login successful" });
  }
);

module.exports = router;
