const Comment = require("../models/comment");
const Post = require("../models/comment");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

// Display detail page for a specific comment.
exports.comment_detail = asyncHandler(async (req, res, next) => {
  const [comment] = await Promise.all([
    Comment.findById(req.params.commentID)
      .populate("post")
      .populate("user")
      .exec(),
  ]);

  if (comment === null) {
    // No results.
    const err = new Error("Comment not found");
    err.status = 404;
    return next(err);
  }

  res.json({
    comment: comment,
  });
});
// curl -X GET  http://localhost:3000/lux/comment/65bbc601243cef2f5f0eb240

// Handle comment create on POST.
exports.comment_create = [
  // // Validate and sanitize fields.
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
          // Create comment object with escaped and trimmed data
          const dateTime = new Date();
          const comment = new Comment({
            post: req.body.postID,
            user: req.body.userID,
            text: req.body.text,
            timestamp: dateTime,
          });

          if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/errors messages.
            res.json({
              errors: errors.array(),
            });
            return;
          } else {
            // Data from form is valid.

            // Save Comment.
            await comment.save();
            // Send Back success
            res.json({ comment: comment });
          }
        }
      }
    );
  }),
];

// curl -X POST http://localhost:3000/lux/comment/create -H "Content-Type: application/json" -d '{"userID":"65bacc48067c0c998ee4ac41", "token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NWJhY2M0ODA2N2MwYzk5OGVlNGFjNDEiLCJlbWFpbCI6ImNzbm92YUBlbWFpbC5jb20iLCJpYXQiOjE3MDY3NDI4Njl9.7ixIYDo9PjubkxhBWiu6R-uBmbaGcW1Rkyr7CjROcqo", "postID": "65baed7e8430c643de59d580", "text" : "I also get to be my first comment :)"}'
