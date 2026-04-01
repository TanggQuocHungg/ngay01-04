const express = require("express");
const router = express.Router();
const Message = require("../schemas/message");
const mongoose = require("mongoose");

// Helper to get current user ID (for easier testing without full auth module hooked up)
const getCurrentUserId = (req, res) => {
  // If your app uses auth middleware that sets req.user
  if (req.user && req.user._id) return req.user._id;
  
  // Otherwise, fallback to a header 'current-user-id'
  const userId = req.headers['current-user-id'];
  if (!userId) {
    res.status(401).json({ success: false, message: "Unauthorized. Please provide current-user-id in headers." });
    return null;
  }
  return userId;
};

// 1. GET "/:userID"
// Lấy toàn bộ message from: user hiện tại, to: userID và from: userID và to: user hiện tại
router.get("/:userID", async (req, res) => {
  const currentUserId = getCurrentUserId(req, res);
  if (!currentUserId) return;

  const { userID } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        { from: currentUserId, to: userID },
        { from: userID, to: currentUserId }
      ]
    }).sort({ createdAt: 1 }); // Sắp xếp từ cũ tới mới

    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. POST "/"
// Gửi tin nhắn chứa nội dung file hoặc text
router.post("/", async (req, res) => {
  const currentUserId = getCurrentUserId(req, res);
  if (!currentUserId) return;

  const { to, type, text } = req.body;

  if (!to || !type || !text) {
    return res.status(400).json({ success: false, message: "Missing required fields (to, type, text)" });
  }

  if (!["file", "text"].includes(type)) {
    return res.status(400).json({ success: false, message: "Type must be either 'file' or 'text'" });
  }

  try {
    const newMessage = new Message({
      from: currentUserId,
      to,
      messageContent: {
        type,
        text
      }
    });

    await newMessage.save();

    res.status(201).json({
      success: true,
      data: newMessage
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. GET "/"
// Lấy message cuối cùng của mỗi user mà user hiện tại nhắn tin hoặc user khác nhắn cho user hiện tại
router.get("/", async (req, res) => {
  const currentUserId = getCurrentUserId(req, res);
  if (!currentUserId) return;

  try {
    const userObjId = new mongoose.Types.ObjectId(currentUserId);

    const latestMessages = await Message.aggregate([
      {
        $match: {
          $or: [{ from: userObjId }, { to: userObjId }]
        }
      },
      {
        $sort: { createdAt: -1 } // Xếp mới nhất lên đầu
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$from", userObjId] },
              "$to", // Nếu mình là người gửi, nhóm theo người nhận
              "$from" // Nếu mình là người nhận, nhóm theo người gửi
            ]
          },
          lastMessage: { $first: "$$ROOT" } // Chọn document đầu tiên mỗi group
        }
      },
      {
        $replaceRoot: { newRoot: "$lastMessage" } // Flatten field
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: latestMessages
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
