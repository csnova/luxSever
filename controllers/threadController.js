const Thread = require("../models/thread");
const Message = require("../models/message");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

// Display list of a users threads.
exports.thread_list = asyncHandler(async (req, res, next) => {
  const [threadList1, threadList2] = await Promise.all([
    Thread.find({ user1: req.params.userID }, "_id user1 user2")
      .populate("user1")
      .populate("user2")
      .exec(),
    Thread.find({ user2: req.params.userID }, "_id user1 user2")
      .populate("user1")
      .populate("user2")
      .exec(),
  ]);

  let threadList = threadList1.concat(threadList2);

  res.json({
    threadList: threadList,
  });
});
// curl -X GET  http://localhost:3000/lux/thread/65bacc48067c0c998ee4ac41

// Display Messages in thread.
exports.thread_messages = asyncHandler(async (req, res, next) => {
  const [messageList] = await Promise.all([
    Message.find(
      { thread: req.params.threadID },
      "_id from to text timestamp viewed"
    )
      .sort({ timestamp: 1 })
      .populate("from")
      .populate("to")
      .exec(),
  ]);

  res.json({
    messageList: messageList,
  });
});
// curl -X GET  http://localhost:3000/lux/thread/messages/65bbc9fc054f2f8a3ceb52ec

// Display unviewed message threads
exports.thread_unViewed = asyncHandler(async (req, res, next) => {
  const [messageList] = await Promise.all([
    Message.find({ to: req.params.userID }, "_id from viewed thread")
      .populate("from")
      .exec(),
  ]);

  let unViewed = [];
  for (let i = 0; i < messageList.length; i++) {
    if (!messageList[i].viewed) {
      let isInList = false;
      for (let j = 0; j < unViewed.length; j++) {
        if (String(messageList[i].thread) === String(unViewed[j].thread)) {
          isInList = true;
        }
      }
      if (!isInList) unViewed.push(messageList[i]);
    }
  }

  res.json({
    unViewed: unViewed,
  });
});
// curl -X GET  http://localhost:3000/lux/thread/unviewed/65bacc48067c0c998ee4ac41
