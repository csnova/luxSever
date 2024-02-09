const express = require("express");
const router = express.Router();
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage })

// Require controller modules.
const user_controller = require("../controllers/userController");
const profile_controller = require("../controllers/profileController");
const post_controller = require("../controllers/postController");
const comment_controller = require("../controllers/commentController");
const message_controller = require("../controllers/messageController");
const thread_controller = require("../controllers/threadController");
const follower_controller = require("../controllers/followerController");

// User Routes
router.get("/user/details/:userID", user_controller.user_detail);
router.get("/user/all", user_controller.user_all);
router.post("/user/sign-up", user_controller.user_sign_up);
router.post("/user/sign-in", user_controller.user_sign_in);
router.post("/user/sign-out", user_controller.user_sign_out);

// Profile Routers
router.get("/profile/:userID/image", profile_controller.profile_image);
router.get("/profile/:userID", profile_controller.profile_details);
router.post("/profile/update", profile_controller.profile_update);
router.post("/profile/picture/:userID", upload.any(), profile_controller.profile_update_picture);

// Post Routers
router.get("/post/all", post_controller.post_list);
router.get("/post/:postID", post_controller.post_detail);
router.post("/post/create", post_controller.post_create);
router.post("/post/like", post_controller.post_like);

// Comment Routers
router.get("/comment/:commentID", comment_controller.comment_detail);
router.post("/comment/create", comment_controller.comment_create);

// Follow Routers
router.get("/following/posts/:userID", follower_controller.following_posts);
router.get("/following/:userID", follower_controller.following_list);
router.get("/followers/:userID", follower_controller.followers_list);
router.post("/follow/add", follower_controller.follow_add);

// Message Routers
router.get("/message/:messageID", message_controller.message_details);
router.post("/message/create", message_controller.message_create);
router.post("/message/viewed", message_controller.message_viewed);
router.post("/message/viewed/all", message_controller.message_viewed_all);

// Thread Routers
router.get("/thread/messages/:threadID", thread_controller.thread_messages);
router.get("/thread/unviewed/:userID", thread_controller.thread_unViewed);
router.get("/thread/:userID", thread_controller.thread_list);

module.exports = router;

// Example for curl request with a "body"
// curl -X POST http://localhost:3000/lux/post/like -H "Content-Type: application/json" -d '{"userID":"fakeUser", "postID": "PostID123"}'
// curl -X GET  http://localhost:3000/lux/post/all
