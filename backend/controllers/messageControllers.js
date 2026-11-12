import Chat from '../models/chatModel.js';
import Message from '../models/messageModel.js';
import User from '../models/userModel.js';
import TryCatch from '../utils/TryCatch.js';

// List every conversation the logged-in user takes part in, along with the
// other participant, the last message and how many messages are still unread.
export const getAllChats = TryCatch(async (req, res) => {
  const chats = await Chat.find({ users: req.user._id })
    .populate("users", "name avatar role department batch")
    .sort({ updatedAt: -1 })
    .lean();

  const withMeta = await Promise.all(
    chats.map(async (chat) => {
      const participant = (chat.users || []).find(
        (u) => u._id.toString() !== req.user._id.toString()
      );
      const unreadCount = await Message.countDocuments({
        chat: chat._id,
        sender: { $ne: req.user._id },
        seen: false
      });
      return { ...chat, participant, unreadCount };
    })
  );

  res.json(withMeta);
});

// Fetch all messages for a chat and mark the ones addressed to me as seen.
export const getMessages = TryCatch(async (req, res) => {
  const chat = await Chat.findById(req.params.chatId);
  if (!chat) {
    return res.status(404).json({ message: "Chat not found" });
  }
  if (!chat.users.some((u) => u.toString() === req.user._id.toString())) {
    return res.status(403).json({ message: "You are not part of this chat" });
  }

  await Message.updateMany(
    { chat: chat._id, sender: { $ne: req.user._id }, seen: false },
    { $set: { seen: true } }
  );

  const messages = await Message.find({ chat: chat._id })
    .sort({ createdAt: 1 })
    .lean();

  res.json(messages);
});

// Send a message to another user. Reuses the existing conversation when one is
// already open, otherwise creates a fresh chat between the two users.
export const sendMessage = TryCatch(async (req, res) => {
  const { recipientId, text } = req.body;

  if (!recipientId || !text || !text.trim()) {
    return res.status(400).json({ message: "Recipient and text are required" });
  }
  if (recipientId === req.user._id.toString()) {
    return res.status(400).json({ message: "You cannot message yourself" });
  }

  const recipient = await User.findById(recipientId).select("_id");
  if (!recipient) {
    return res.status(404).json({ message: "Recipient not found" });
  }

  let chat = await Chat.findOne({
    users: { $all: [req.user._id, recipientId], $size: 2 }
  });
  if (!chat) {
    chat = await Chat.create({ users: [req.user._id, recipientId] });
  }

  const message = await Message.create({
    chat: chat._id,
    sender: req.user._id,
    text: text.trim()
  });

  chat.latestMessage = { text: text.trim(), sender: req.user._id };
  await chat.save();

  // Push the new message live to the recipient. The sender already renders it
  // optimistically, so echoing it back would duplicate it on their screen.
  const io = req.app.get("io");
  if (io) {
    const payload = { message, chatId: chat._id.toString() };
    io.to(`user:${recipientId}`).emit("newMessage", payload);
  }

  res.status(201).json({ message, chatId: chat._id });
});
