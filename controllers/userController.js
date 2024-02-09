const User = require("../models/user");
const Profile = require("../models/profile");
const Follow = require("../models/follow");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

// Display detail page for a specific User.
exports.user_detail = asyncHandler(async (req, res, next) => {
  const specificUser = await User.find(
    { _id: req.params.userID },
    "username _id"
  )
    .sort({ username: 1 })
    .exec();

  if (specificUser === null) {
    // No results.
    const err = new Error("User not found");
    err.status = 404;
    return next(err);
  }
  res.json({
    user: specificUser,
  });
});
// curl -X GET  http://localhost:3000/lux/user/details/65bbdadfd91c1ec4f2cf51f7

// Display a list of all Users
exports.user_all = asyncHandler(async (req, res, next) => {
  const allUsers = await User.find({}, "username _id")
    .sort({ username: 1 })
    .exec();
  res.json(allUsers);
});
// curl -X GET  http://localhost:3000/lux/user/all

exports.user_sign_up = [
  // Validate and sanitize fields.
  body("first_name").trim().isLength({ min: 1 }).escape(),
  body("last_name").trim().isLength({ min: 1 }).escape(),
  body("email").trim().isLength({ min: 5 }).escape(),
  body("username")
    .trim()
    .isLength({ min: 4 })
    .withMessage("Username must be at least 4 characters long.")
    .custom(async (value) => {
      const existingUser = await User.findByUsername(value);
      if (existingUser) {
        // Will use the below as the error message
        throw new Error("A user already exists with this username");
      }
    })
    .isAlphanumeric()
    .withMessage("Username has non-alphanumeric characters.")
    .escape(),
  body("password")
    .trim()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long.")
    .escape(),
  body("confirm_password")
    .custom((value, { req }) => {
      return value === req.body.password;
    })
    .withMessage("Passwords Do Not Match"),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
      // Create Users object with escaped and trimmed data
      const user = new User({
        email: req.body.email,
        username: req.body.username.toLowerCase(), // Convert to lowercase
        password: hashedPassword,
      });

      const follow = new Follow({
        user: user._id,
        following: [],
        followers: [],
      });

      const path = require("path");
      const imagePath = path.join(__dirname, "../public/images/user.png");
      if (fs.existsSync(imagePath)) {
        console.log("path exists");
      }
      const imageData = fs.readFileSync(imagePath);

      const imageContentType = "image/png";
      const profile = new Profile({
        user: user._id,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        bio: " ",
        picture: {
          data: imageData,
          contentType: imageContentType,
        },
      });

      jwt.sign(
        { _id: user._id, email: user.email },
        process.env.JWT_SECRET,
        (err, token) => {
          if (err) return res.status(400).json(err);
          res.json({
            token: token,
            user: {
              _id: user._id,
              username: user.username,
            },
          });
        }
      );

      if (!errors.isEmpty()) {
        // There are errors. Render form again with sanitized values/errors messages.
        res.json({
          errors: errors.array(),
        });
        return;
      } else {
        // Data from form is valid.

        // Save user.
        await user.save();
        await follow.save();
        await profile.save();
      }
    });
  }),
];
// curl -X POST http://localhost:3000/lux/user/sign-up -H "Content-Type: application/json" -d '{"first_name":"Flannery", "last_name":"Hope", "email":"flan@email.com", "username":"flan","password": "cannonrocks", "confirm_password":"cannonrocks"}'

// Handle User sign in on POST.
exports.user_sign_in = (req, res, next) => {
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.status(400).json({
        message: "Could not authenticate",
        user,
      });
    }
    if (err) res.send(err);
    jwt.sign(
      { _id: user._id, email: user.email },
      process.env.JWT_SECRET,
      (err, token) => {
        if (err) return res.status(400).json(err);
        res.json({
          token: token,
          user: {
            _id: user._id,
            username: user.username,
          },
        });
      }
    );
  })(req, res);
};
// curl -X POST http://localhost:3000/lux/user/sign-in -H "Content-Type: application/json" -d '{"username":"csnova", "password": "hellothere"}'
// token : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NWJiZGIxZDBkNjYyMTRhMTFjZDE3NmQiLCJlbWFpbCI6ImNzbm92YUBlbWFpbC5jb20iLCJpYXQiOjE3MDY4MTAxNDF9.QobAq_W_KCgwUmESVBYkgQp4Wc2L06sRl7ESmjWJWeM
// userID : 65bbdb1d0d66214a11cd176d

// curl -X POST http://localhost:3000/lux/user/sign-in -H "Content-Type: application/json" -d '{"username":"knova", "password": "hellothere"}'
// token : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NWJiZGI0ZTBkNjYyMTRhMTFjZDE3NzQiLCJlbWFpbCI6Imtub3ZhQGVtYWlsLmNvbSIsImlhdCI6MTcwNjgxMDE5MH0.D8fsnjUAO-1uy5TnlA8d0EXZFh535bVJ1ihknppjwVA
// userID : 65bbdb4e0d66214a11cd1774

// curl -X POST http://localhost:3000/lux/user/sign-in -H "Content-Type: application/json" -d '{"username":"patches", "password": "flatdisc"}'
// token : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NWJiZGFkZmQ5MWMxZWM0ZjJjZjUxZjciLCJlbWFpbCI6InBhY3RoZXNAZW1haWwuY29tIiwiaWF0IjoxNzA2ODEwMDc5fQ.PTJm4SYOIDtFHG0E7AVCf1EXt0rTqjzvXF-kmtBVhGI
// userID : 65bbdadfd91c1ec4f2cf51f7

// curl -X POST http://localhost:3000/lux/user/sign-in -H "Content-Type: application/json" -d '{"username":"flan", "password": "cannonrocks"}'
// token : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NWJiZGJhNzA2MGY2ZDMwZjU2ZThhNWQiLCJlbWFpbCI6ImZsYW5AZW1haWwuY29tIiwiaWF0IjoxNzA2ODEwMjc5fQ.Xb8a3fqbCzdYD-hdrH58fDQwu40vWk_Zy3gsaZnTAwc
// userID : 65bbdba7060f6d30f56e8a5d

// Handle User sign out on POST.
exports.user_sign_out = asyncHandler(async (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.json("Success");
  });
});
// curl -X POST http://localhost:3000/lux/user/sign-out
