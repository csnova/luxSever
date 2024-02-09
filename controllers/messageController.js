const Message = require("../models/message");
const Thread = require("../models/thread");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

// Display Message Details.
exports.message_details = asyncHandler(async (req, res, next) => {
  const [message] = await Promise.all([
    Message.find(
      { _id: req.params.messageID },
      "from to text timestamp thread viewed "
    )
      .populate("from")
      .populate("to")
      .exec(),
  ]);
  res.json({
    message: message,
  });
});
// curl -X GET  http://localhost:3000/lux/message/fakeMessage

// Handle create message.
exports.message_create = asyncHandler(async (req, res, next) => {
  // Check if thread exists
  const [thread1, thread2] = await Promise.all([
    Thread.find({ user1: req.body.from, user2: req.body.to }, "_id").exec(),
    Thread.find({ user1: req.body.to, user2: req.body.from }, "_id").exec(),
  ]);

  let thread = thread1.concat(thread2);

  // If Thread Get ID
  let threadID;
  if (thread[0]) {
    threadID = thread[0]._id;
  } else {
    // If Not Thread Create One
    const thread = new Thread({
      user1: req.body.from,
      user2: req.body.to,
    });
    await thread.save();
    const [thread3] = await Promise.all([
      Thread.find({ user1: req.body.from, user2: req.body.to }, "_id").exec(),
    ]);
    threadID = thread3[0]._id;
  }
  threadID = String(threadID);

  // Create Message with Thread ID
  const dateTime = new Date();
  const message = new Message({
    from: req.body.from,
    to: req.body.to,
    text: req.body.text,
    timestamp: dateTime,
    thread: threadID,
    viewed: false,
  });
  await message.save();

  // Send back Thread ID
  res.json(threadID);
});
// curl -X POST http://localhost:3000/lux/message/create -H "Content-Type: application/json" -d '{"from":"65bbcc0260dba9df713444a8", "to": "65bacc48067c0c998ee4ac41", "text": "What are you two doing on Sunday?"}'

// Handle marking message as viewed
exports.message_viewed = asyncHandler(async (req, res, next) => {
  const [message] = await Promise.all([
    Message.find({ _id: req.body.messageID }).exec(),
  ]);

  // Create a new message object
  const newMessage = new Message({
    from: message[0].from,
    to: message[0].to,
    text: message[0].text,
    timestamp: message[0].timestamp,
    thread: message[0].thread,
    viewed: true,
    _id: message[0]._id,
  });

  const updateMessage = await Message.findByIdAndUpdate(
    message[0]._id,
    newMessage
  );

  //Send back Success Message
  res.json("Success");
});
// curl -X POST http://localhost:3000/lux/message/viewed -H "Content-Type: application/json" -d '{"messageID": "65bbc9fc054f2f8a3ceb52ef"}'

// Handle marking all messages in a thread as viewed
exports.message_viewed_all = asyncHandler(async (req, res, next) => {
  const [messageList] = await Promise.all([
    Message.find(
      { thread: req.body.threadID },
      "from to text timestamp thread viewed _id"
    ).exec(),
  ]);

  for (let i = 0; i < messageList.length; i++) {
    let toId = String(messageList[i].to);
    if (toId === req.body.currentUser) {
      // Create a new message object
      const newMessage = new Message({
        from: messageList[i].from,
        to: messageList[i].to,
        text: messageList[i].text,
        timestamp: messageList[i].timestamp,
        thread: messageList[i].thread,
        viewed: true,
        _id: messageList[i]._id,
      });

      const updateMessage = await Message.findByIdAndUpdate(
        messageList[i]._id,
        newMessage
      );
    }
  }

  //Send back Thread ID
  res.json("Success");
});
// curl -X POST http://localhost:3000/lux/message/viewed/all -H "Content-Type: application/json" -d '{"threadID": "65bbc9fc054f2f8a3ceb52ec", "currentUser" : "65bacc48067c0c998ee4ac41"}'
