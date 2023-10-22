const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const auth = require("../middleware/auth");
const { body, validationResult } = require("express-validator");

// @route POST api/post
// @desc Create post
// @access Private
router.post("/", auth, [body("content").notEmpty()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const post = new Post({
    content: req.body.content,
    author: req.user._id,
  });
  await post.save();
  res.status(201).json({ message: "Post created successfully", post });
});

// @route GET api/post
// @desc Get all own posts
// @access Private
router.get("/", auth, async (req, res) => {
  const { search } = req.query;
  const query = {};
  query.author = req.user._id;
  if (search) {
    query.$or = [{ content: { $regex: search, $options: "i" } }];
  }
  const posts = await Post.find(query).populate("likes").populate("comments");
  res.json(posts);
});

// @route GET api/post/timeline
// @desc Get all timeline posts
// @access Private
router.get("/timeline", auth, async (req, res) => {
  const { search } = req.query;
  const query = {};
  if (search) {
    query.$or = [{ content: { $regex: search, $options: "i" } }];
  }
  const posts = await Post.find(query)
    .populate("author", "username name avatar")
    .populate("likes")
    .populate("comments")
    .sort({ createdAt: -1 });
  res.json(posts);
});

// @route PATCH api/post/:id
// @desc Edit post
// @access Private
router.patch("/:id", auth, [body("content").notEmpty()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const post = await Post.findByIdAndUpdate(
    req.params.id,
    {
      content: req.body.content,
    },
    {
      new: true,
    }
  );
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }
  res.json({ message: "Post updated successfully", post });
});

// @route DELETE api/post/:id
// @desc Delete post
// @access Private
router.delete("/:id", auth, async (req, res) => {
  const post = await Post.findByIdAndDelete(req.params.id);
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }
  return res.json({ message: "Post deleted successfully" });
});

module.exports = router;
