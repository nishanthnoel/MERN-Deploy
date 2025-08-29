const express = require("express");
const { fetchUserById, updateUser } = require("../controller/User");

const router = express.Router();

// router.get("/:id", fetchUserById)
router.get("/own", fetchUserById) // because the api call in the frontend has been changed due to jwt tokens
.patch("/:id", updateUser);
exports.router = router;
