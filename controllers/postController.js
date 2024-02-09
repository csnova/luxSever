const Post = require("../models/post");
const Comment = require("../models/comment");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const { json } = require("express");

// Display list of all posts.
exports.post_list = asyncHandler(async (req, res, next) => {
  const allPosts = await Post.find({}, "user title text timestamp likes")
    .populate("user")
    .sort({ timestamp: 1 })
    .exec();

  if (allPosts === null) {
    // No results.
    allPosts = "No Posts";
  }

  res.json({
    post_list: allPosts,
  });
});
// curl -X GET  http://localhost:3000/lux/post/all

// Display detail page for a specific post.
exports.post_detail = asyncHandler(async (req, res, next) => {
  const [post, allComments] = await Promise.all([
    Post.findById(req.params.postID).populate("user").exec(),
    Comment.find({ post: req.params.postID }, "text timestamp user likes")
      .populate("user")
      .exec(),
  ]);

  if (post === null) {
    // No results.
    const err = new Error("Post not found");
    err.status = 404;
    return next(err);
  }

  res.json({
    post: post,
    comments: allComments,
  });
});
// curl -X GET  http://localhost:3000/lux/post/65baed7e8430c643de59d580

// Handle post create on POST.
exports.post_create = [
  // // Validate and sanitize fields.
  body("title").trim().isLength({ min: 1 }),
  body("text").trim().isLength({ min: 1 }),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    jwt.verify(
      req.body.token,
      process.env.JWT_SECRET,
      async function (err, decoded) {
        if (err) {
          console.log(err);
          res.status(401).send();
        } else {
          // Create post object with escaped and trimmed data
          const dateTime = new Date();
          const post = new Post({
            user: req.body.userID,
            title: req.body.title,
            text: req.body.text,
            timestamp: dateTime,
            likes: [],
          });

          if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/errors messages.
            res.json({
              errors: errors.array(),
            });
            return;
          } else {
            // Data from form is valid.

            // Save post.
            await post.save();
            //Send Back Post id
            res.json({
              post: {
                _id: post._id,
              },
            });
          }
        }
      }
    );
  }),
];
// curl -X POST http://localhost:3000/lux/post/create -H "Content-Type: application/json" -d '{"userID":"65bbdb1d0d66214a11cd176d", "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NWJiZGIxZDBkNjYyMTRhMTFjZDE3NmQiLCJlbWFpbCI6ImNzbm92YUBlbWFpbC5jb20iLCJpYXQiOjE3MDY4MTAxNDF9.QobAq_W_KCgwUmESVBYkgQp4Wc2L06sRl7ESmjWJWeM", "title" : "Blueberry Lemon Cake", "text" : "Okay I have made a blueberry lemon cake i am really proud of! Ill post the recipe and maybe a picture soon!"}'

// Handle post like on POST.
exports.post_like = asyncHandler(async (req, res, next) => {
  const post = await Post.find(
    { _id: req.body.postID },
    "user title text timestamp likes"
  ).exec();

  let alreadyLiked = false;
  const userID = String(req.body.userID);

  for (let i = 0; i < post[0].likes.length; i++) {
    const currentLike = String(post[0].likes[i]);
    if (currentLike === userID) alreadyLiked = true;
  }

  if (alreadyLiked) {
    res.json("already liked");
  } else {
    let newLikes = post[0].likes;
    newLikes.push(req.body.userID);

    const updatedPost = new Post({
      user: post[0].user,
      title: post[0].title,
      text: post[0].text,
      timestamp: post[0].timestamp,
      likes: newLikes,
      _id: post[0]._id,
    });

    const withLike = await Post.findByIdAndUpdate(req.body.postID, updatedPost);

    res.json({ updatedPost });
  }
});
// curl -X POST http://localhost:3000/lux/post/like -H "Content-Type: application/json" -d '{"userID":"65bad1aace6afee055d3345a", "postID": "65baed7e8430c643de59d580"}'
