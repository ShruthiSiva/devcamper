const express = require("express");

const {
  getUser,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/users");

const User = require("../models/User");
const { protect, authorize } = require("../middleware/auth");
const advancedResults = require("../middleware/advancedResults");

const router = express.Router();

// any route below this uses the protect, authorize middlewares
router.use(protect);
router.use(authorize("admin"));

router.route("/").get(advancedResults(User), getUsers).post(createUser);
router.route("/:id").get(getUser).put(updateUser).delete(deleteUser);

module.exports = router;
