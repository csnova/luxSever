const Follow = require("../models/follow");
const Post = require("../models/post");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

// Display list of who a user is following.
exports.following_list = asyncHandler(async (req, res, next) => {
  const followingList = await Follow.find(
    { user: req.params.userID },
    "following"
  ).exec();
  res.json(followingList);
});
// curl -X GET  http://localhost:3000/lux/following/65bbdb4e0d66214a11cd1774

// Display list posts from who a user is following.
exports.following_posts = asyncHandler(async (req, res, next) => {
  const followingList = await Follow.find(
    { user: req.params.userID },
    "following"
  ).exec();

  let posts = [];
  for (let i = 0; i < followingList[0].following.length; i++) {
    const currentUser = String(followingList[0].following[i]);
    const postList = await Post.find(
      { user: currentUser },
      "title text user timestamp likes"
    )
      .populate("user")
      .sort({ timestamp: 1 })
      .exec();
    for (let j = 0; j < postList.length; j++) {
      posts.push(postList[j]);
    }
  }

  posts.sort((a, b) => b.timestamp - a.timestamp);

  res.json(posts);
});
// curl -X GET  http://localhost:3000/lux/following/posts/65bbdb4e0d66214a11cd1774

// Display list of who is following a user.
exports.followers_list = asyncHandler(async (req, res, next) => {
  const followerList = await Follow.find(
    { user: req.params.userID },
    "followers"
  ).exec();
  res.json(followerList);
});
// curl -X GET  http://localhost:3000/lux/followers/65bbdb4e0d66214a11cd1774

// Handle add to follow list.
exports.follow_add = asyncHandler(async (req, res, next) => {
  const currentFollowingList = await Follow.find({
    user: req.body.currentUser,
  }).exec();
  const userFollowed = await Follow.find({
    user: req.body.userFollowed,
  }).exec();

  // Check if already following
  let alreadyFollowing = false;
  for (let i = 0; i < currentFollowingList[0].following.length; i++) {
    let currentFriend = String(currentFollowingList[0].following[i]);
    if (currentFriend === req.body.userFollowed) alreadyFollowing = true;
  }

  if (alreadyFollowing) {
    res.json("already following ");
  } else {
    // Updated Following list for Current User
    let currentUserFollowing = currentFollowingList[0].following;
    currentUserFollowing.push(req.body.userFollowed);
    // Create Follow object with new addition
    const currentUserFollow = new Follow({
      user: currentFollowingList[0].user,
      following: currentUserFollowing,
      followers: currentFollowingList[0].followers,
      _id: currentFollowingList[0]._id,
    });
    const updateUserFollowing = await Follow.findByIdAndUpdate(
      currentFollowingList[0]._id,
      currentUserFollow
    );
    // Updated followed list for followed User
    let followedUserList = userFollowed[0].followers;
    followedUserList.push(req.body.currentUser);
    // Create Follow object with new addition
    const followedUser = new Follow({
      user: userFollowed[0].user,
      following: userFollowed[0].following,
      followers: followedUserList,
      _id: userFollowed[0]._id,
    });
    const updateFollowedUser = await Follow.findByIdAndUpdate(
      userFollowed[0]._id,
      followedUser
    );
    res.json("Success");
  }
});
// curl -X POST http://localhost:3000/lux/follow/add -H "Content-Type: application/json" -d '{"currentUser":"65bbdb4e0d66214a11cd1774", "userFollowed": "65bbdadfd91c1ec4f2cf51f7"}'
