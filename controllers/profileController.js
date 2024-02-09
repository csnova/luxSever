const Profile = require("../models/profile");
const User = require("../models/user");
const Follow = require("../models/follow");
const Post = require("../models/post");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const multer = require("multer");

// Display detail page for a profile.
exports.profile_details = asyncHandler(async (req, res, next) => {
  const [profile, follow, allPosts] = await Promise.all([
    Profile.find({ user: req.params.userID }, "user first_name last_name bio ")
      .populate("user")
      .exec(),
    Follow.find({ user: req.params.userID }).exec(),
    Post.find({ user: req.params.userID }).populate("user").exec(),
  ]);

  if (profile === null) {
    // No results.
    const err = new Error("Profile not found");
    err.status = 404;
    return next(err);
  }

  let followingList = [];
  for (let i = 0; i < follow[0].following.length; i++) {
    const currentFriend = await User.find(
      { _id: follow[0].following[i] },
      "_id username"
    ).exec();
    followingList.push(currentFriend[0]);
  }

  let followersList = [];
  for (let i = 0; i < follow[0].followers.length; i++) {
    const currentFriend = await User.find(
      { _id: follow[0].followers[i] },
      "_id username"
    ).exec();
    followersList.push(currentFriend[0]);
  }

  res.json({
    profile: profile,
    following: followingList,
    followed: followersList,
    posts: allPosts,
  });
});
// curl -X GET  http://localhost:3000/lux/profile/65bbdb4e0d66214a11cd1774

// Display user profile picture
exports.profile_image = asyncHandler(async (req, res, next) => {
  const [picture] = await Promise.all([
    Profile.find({ user: req.params.userID }, "picture ").exec(),
  ]);

  if (picture.length === 0) {
    const err = new Error("Picture not found");
    err.status = 404;
    return next(err);
  }

  const imageDataBuffer = Buffer.from(picture[0].picture.data.buffer);

  res.contentType(picture[0].picture.contentType);
  res.end(imageDataBuffer);
});

// curl -X GET  http://localhost:3000/lux/profile/65bbdb4e0d66214a11cd1774/image

// Handle profile update on POST.
exports.profile_update = [
  // Validate and sanitize fields.
  body("first_name").trim(),
  body("last_name").trim(),
  body("bio").trim(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    const [oldProfileData] = await Promise.all([
      Profile.find({ user: req.body.userID }, "_id picture").exec(),
    ]);
    let profileId = oldProfileData[0]._id;
    profileId = String(profileId);
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
          // Create Profile object with escaped and trimmed data
          const profile = new Profile({
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            bio: req.body.bio,
            picture: oldProfileData.picture,
            _id: profileId,
          });

          if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/errors messages.
            res.json({
              errors: errors.array(),
            });
            return;
          } else {
            // Data from form is valid. Save Profile Update.
            const updateProfile = await Profile.findByIdAndUpdate(
              profileId,
              profile
            );
            //Send Back Profile
            res.json({
              profile: {
                first_name: profile.first_name,
                last_name: profile.last_name,
                bio: profile.bio,
              },
            });
          }
        }
      }
    );
  }),
];

// curl -X POST http://localhost:3000/lux/profile/update -H "Content-Type: application/json" -d '{"userID":"65bacc48067c0c998ee4ac41", "token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NWJhY2M0ODA2N2MwYzk5OGVlNGFjNDEiLCJlbWFpbCI6ImNzbm92YUBlbWFpbC5jb20iLCJpYXQiOjE3MDY3NDI4Njl9.7ixIYDo9PjubkxhBWiu6R-uBmbaGcW1Rkyr7CjROcqo","first_name":"Chandler","last_name":"Nova","bio":"fake stuff"}'

// Server route to handle photo upload
exports.profile_update_picture = asyncHandler(async (req, res, next) => {
  const profile = await Profile.findOne({ user: req.params.userID });

  console.log("files: ", req.files[0]);
  // let picture = req.body.formData.get("photo");
  // console.log("picture", picture);

  if (!profile) {
    const err = new Error("Profile not found");
    err.status = 404;
    return next(err);
  }

  if (!req.files || !req.files[0]) {
    console.log("No Photo");
    const err = new Error("No photo uploaded");
    err.status = 400;
    return next(err);
  }

  const photo = req.files[0];
  const imageContentType = photo.mimetype;
  const imageData = photo.buffer;

  profile.picture = {
    data: imageData,
    contentType: imageContentType,
  };

  await profile.save();

  res.json({ message: "Photo uploaded successfully" });
});
