const Message = require("../models/Message");
const User = require("../models/User");

module.exports = function (io) {
  // socket.io connection
  io.on("connection", (socket) => {
    // listen for a message from the client
    socket.on("message", async (message) => {
      const userId = socket.user?._id;
      if (userId) {
        const user = await User.findById(userId);
        const newMessage = new Message({
          content: message,
          sender: userId,
        });
        await newMessage.save();
        socket.broadcast.emit("message", {
          _id: newMessage._id,
          content: message,
          sender: {
            _id: user._id,
            username: user.username,
            avatar: user.avatar,
          },
        });
      }
    });

    console.log("New socket connection");

    // disconnect event
    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });
};
