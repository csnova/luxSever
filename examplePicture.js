//Example to save to database
const Profile = require("./models/profile");

// Assuming you have an Express route for updating a profile with an image
app.post("/update-profile/:profileId", async (req, res) => {
  try {
    const profileId = req.params.profileId;
    const profile = await Profile.findById(profileId);

    // Assuming 'imageData' is the binary data of the image and 'imageContentType' is the MIME type
    profile.picture.data = Buffer.from(imageData, "base64");
    profile.picture.contentType = imageContentType;

    await profile.save();

    res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//Example route to get out of database
const express = require("express");
const router = express.Router();
const Profile = require('./models/profile"'); // Replace with the actual path to your Profile model

router.get("/profile/:profileId/image", async (req, res) => {
  try {
    const userID = req.params.userID;
    const profile = await Profile.findById(userID);

    if (!profile || !profile.picture) {
      return res.status(404).send("Image not found");
    }

    res.set("Content-Type", profile.picture.contentType);
    res.send(profile.picture.data.buffer);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;


// Front end code
<!-- Example HTML to display the image -->
<img src="/lux/profile/your_profile_id/image" alt="Profile Image">
