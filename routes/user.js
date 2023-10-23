const router = require("express").Router();
const fs = require("fs");

const User = require("../models/User");
const auth = require("../middleware/auth");
const { check, validationResult } = require("express-validator");
const upload = require("../utils/multer");
const { USER_PUBLIC_ENTRIES } = require("../constants/entries");

// @route GET api/user
// @desc Get user
// @access Private
router.get("/", auth, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  if (!user) return res.status(400).json({ message: "User not found" });
  res.json(user);
});

// @route PUT api/user
// @desc Edit profile
// @access Private
router.patch(
  "/",
  auth,
  upload.single("avatar"),
  [
    check("username", "Username is required").not().isEmpty(),
    check("phone", "Please include a valid phone number").isMobilePhone(),
    check("name", "Name is required").not().isEmpty(),
    check("bio", "Bio cannot be more than 160 characters").isLength({
      max: 160,
    }),
    check("website", "Please include a valid website").isURL().optional(),
    check("location", "Location cannot be more than 30 characters").isLength({
      max: 30,
    }),
  ],
  async (req, res) => {
    // check for errors
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    // destructure request body
    const { username, phone, name, bio, website, location } = req.body;

    // check if user exists
    let user = await User.findById(req.user._id).select("-password");
    if (!user)
      return res.status(400).json({ errors: [{ message: "User not found" }] });

    const avatar = req.file ? req.file.path : user.avatar;

    // remove old avatar
    if (req.file) {
      if (user.avatar) {
        fs.unlink(user.avatar, (err) => {
          if (err) console.log(err);
        });
      }
    }

    // update user
    user.username = username;
    user.phone = phone;
    user.name = name;
    user.avatar = avatar;
    user.bio = bio;
    user.website = website;
    user.location = location;

    // save new user
    await user.save();

    return res.json({ message: "User updated successfully" });
  }
);

// @route POST api/user/follow/:id
// @desc Follow user
// @access Private
router.post("/follow/:id", auth, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user)
    return res.status(404).json({ message: "User with given id not found" });

  const currentUser = await User.findById(req.user._id);
  if (!currentUser) return res.status(404).json({ message: "User not found" });

  if (user.followers.includes(req.user._id))
    return res.status(400).json({ message: "You already follow this user" });

  user.followers.push(req.user._id);
  currentUser.following.push(req.params.id);

  await user.save();
  await currentUser.save();

  res.json({ message: "User followed successfully" });
});

// @route POST api/user/unfollow/:id
// @desc Unfollow user
// @access Private
router.post("/unfollow/:id", auth, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user)
    return res.status(404).json({ message: "User with given id not found" });

  const currentUser = await User.findById(req.user._id);
  if (!currentUser) return res.status(404).json({ message: "User not found" });

  if (!user.followers.includes(req.user._id))
    return res.status(400).json({ message: "You don't follow this user" });

  user.followers.pull(req.user._id);
  currentUser.following.pull(req.params.id);

  await user.save();
  await currentUser.save();

  res.json({ message: "User unfollowed successfully" });
});

// @route GET api/user/followers
// @desc Get user followers
// @access Private
router.get("/followers", auth, async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("-password")
    .populate("followers", USER_PUBLIC_ENTRIES);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (user.followers.length === 0) return res.json({ message: "No followers" });

  res.json(user.followers);
});

// @route GET api/user/following
// @desc Get user following
// @access Private
router.get("/following", auth, async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("-password")
    .populate("following", USER_PUBLIC_ENTRIES);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (user.following.length === 0) return res.json({ message: "No following" });

  res.json(user.following);
});

// @route GET api/user/:id
// @desc Get user by id
// @access Private
router.get("/details/:id", auth, async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user)
    return res.status(404).json({ message: "User with given id not found" });

  res.json(user);
});

// @route GET api/user/:id/followers
// @desc Get user followers by id
// @access Private
router.get("/:id/followers", auth, async (req, res) => {
  const user = await User.findById(req.params.id)
    .select("-password")
    .populate("followers", USER_PUBLIC_ENTRIES);
  if (!user)
    return res.status(404).json({ message: "User with given id not found" });

  if (user.followers.length === 0) return res.json({ message: "No followers" });

  res.json(user.followers);
});

// @route GET api/user/:id/following
// @desc Get user following by id
// @access Private
router.get("/:id/following", auth, async (req, res) => {
  const user = await User.findById(req.params.id)
    .select("-password")
    .populate("following", USER_PUBLIC_ENTRIES);
  if (!user)
    return res.status(404).json({ message: "User with given id not found" });

  if (user.following.length === 0) return res.json({ message: "No following" });

  res.json(user.following);
});

// @route POST api/user/request/:id
// @desc Send friend request
// @access Private
router.post("/request/:id", auth, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user)
    return res.status(404).json({ message: "User with given id not found" });

  const currentUser = await User.findById(req.user._id);
  if (!currentUser) return res.status(404).json({ message: "User not found" });

  if (user.friendRequests.includes(req.user._id))
    return res
      .status(400)
      .json({ message: "You already sent a friend request to this user" });

  user.friendRequests.push(req.user._id);
  user.followers.push(req.user._id);
  currentUser.following.push(req.params.id);
  await user.save();
  await currentUser.save();

  res.json({ message: "Friend request sent successfully" });
});

// @route POST api/user/accept/:id
// @desc Accept friend request
// @access Private
router.post("/accept/:id", auth, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user)
    return res.status(404).json({ message: "User with given id not found" });

  const currentUser = await User.findById(req.user._id);
  if (!currentUser) return res.status(404).json({ message: "User not found" });

  if (!currentUser.friendRequests.includes(req.params.id))
    return res
      .status(400)
      .json({ message: "You don't have a friend request from this user" });

  currentUser.friendRequests.pull(req.params.id);
  currentUser.friends.push(req.params.id);
  user.friends.push(req.user._id);
  await currentUser.save();
  await user.save();

  res.json({ message: "Friend request accepted successfully" });
});

// @route POST api/user/decline/:id
// @desc Decline friend request
// @access Private
router.post("/decline/:id", auth, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user)
    return res.status(404).json({ message: "User with given id not found" });

  const currentUser = await User.findById(req.user._id);
  if (!currentUser) return res.status(404).json({ message: "User not found" });

  if (!currentUser.friendRequests.includes(req.params.id))
    return res
      .status(400)
      .json({ message: "You don't have a friend request from this user" });

  currentUser.friendRequests.pull(req.params.id);
  user.followers.pull(req.user._id);
  await currentUser.save();
  await user.save();

  res.json({ message: "Friend request declined successfully" });
});

// @route GET api/user/friend-requests
// @desc Get friend requests
// @access Private
router.get("/friend-requests", auth, async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("-password")
    .populate("friendRequests", USER_PUBLIC_ENTRIES);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (user.friendRequests.length === 0)
    return res.json({ message: "No friend requests" });

  res.json(user.friendRequests);
});

// @route GET api/user/friends
// @desc Get friends
// @access Private
router.get("/friends", auth, async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("-password")
    .populate("friends", USER_PUBLIC_ENTRIES);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (user.friends.length === 0) return res.json({ message: "No friends" });

  res.json({ friends: user.friends });
});

module.exports = router;
