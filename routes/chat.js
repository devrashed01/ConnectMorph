const route = require("express").Router();
const { USER_PUBLIC_ENTRIES } = require("../constants/entries");
const auth = require("../middleware/auth");

const Chat = require("../models/Chat");
const Message = require("../models/Message");
const User = require("../models/User");

// @route GET api/chat
// @desc Get all chats
// @access Private
route.get("/", auth, async (req, res) => {
  const chats = await Chat.find({
    participants: req.user._id,
  })
    .select("participants")
    .populate({
      path: "participants",
      select: USER_PUBLIC_ENTRIES,
    });

  res.json(chats);
});

// @route GET api/chat/:id
// @desc Get a chat
// @access Private
route.get("/:id", auth, async (req, res) => {
  let query = null;
  const { id } = req.params;

  if (id) {
    query = {
      _id: id,
      participants: req.user._id,
    };
  }

  const chat = await Chat.find(query).select("messages").populate("messages");

  if (!chat) {
    return res.status(404).json({ error: "Chat not found" });
  }

  res.json(chat);
});

// @route POST api/chat
// @desc Create a chat
// @access Private
route.post("/", auth, async (req, res) => {
  const { recipient } = req.body;

  if (!recipient) {
    return res.status(400).json({ error: "Recipient is required" });
  }

  const recipientUser = await User.findById(recipient);

  if (!recipientUser) {
    return res.status(404).json({ error: "Recipient not found" });
  }

  const chat = await Chat.findOne({
    participants: { $all: [req.user._id, recipient] },
  });

  if (chat) {
    return res.status(400).json({ error: "Chat already exists", chat });
  }

  const newChat = new Chat({
    participants: [req.user._id, recipient],
  });

  const savedChat = await newChat.save();

  res.json(savedChat);
});

// @route POST api/chat/:id/message
// @desc Create a message
// @access Private
route.post("/:id/message", auth, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: "Content is required" });
  }

  const chat = await Chat.findOne({
    _id: id,
    participants: req.user._id,
  });

  if (!chat) {
    return res.status(404).json({ error: "Chat not found" });
  }

  const newMessage = new Message({
    content,
    sender: req.user._id,
  });

  const savedMessage = await newMessage.save();

  chat.messages.push(savedMessage._id);

  await chat.save();

  res.json(savedMessage);
});

module.exports = route;
