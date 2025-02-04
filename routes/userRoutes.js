// // //

const express = require("express");
const userController = require("./../controllers/userController");
const authController = require("./../controllers/authController");

const router = express.Router();

router.post("/signup", authController.signup); // ⏺ anyone can use our API(no protect, no restrict)
router.post("/login", authController.login); // ⏺ anyone can use our API(no protect, no restrict)
router.get("/logout", authController.logout); // ⏺ anyone can use our API(no protect, no restrict)
router.post("/forgotPassword", authController.forgotPassword); // ⏺ anyone can use our API(no protect, no restrict)
router.patch("/resetPassword/:token", authController.resetPassword); // ⏺ anyone can use our API(no protect, no restrict)

router.use(authController.protect); // ⏺ all routes after this middleware will be automatically protected because middleware works in sequence. Just think how js work!
router.patch("/updateMyPassword", authController.updatePassword);
router.get("/me", userController.getMe, userController.getUser);
router.patch(
  "/updateMe",
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete("/deleteMe", userController.deleteMe);

router.use(authController.restrictTo("admin")); // ⏺ same logic, mind that it's also protected. So after this middleware the code only work when it's protected and also for only admin
router
  .route("/")
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
