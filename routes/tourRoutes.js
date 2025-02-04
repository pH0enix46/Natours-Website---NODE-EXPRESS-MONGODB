// // //

const express = require("express");
const tourController = require("./../controllers/tourController");
const authController = require("./../controllers/authController");
// const reviewController = require("./../controllers/reviewController");
const reviewRouter = require("./reviewRoutes");

const router = express.Router();

// ⏺ nested routes
// router
//   .route("/:tourId/reviews")
//   .post(
//     authController.protect,
//     authController.restrictTo("user"),
//     reviewController.createReview
//   );

// ⏺ nested routes with express (MOUNTING)
router.use("/:tourId/reviews", reviewRouter);

router
  .route("/top-5-cheap")
  .get(tourController.aliasTopTours, tourController.getAllTours); // ⏺ anyone can use our API(no protect, no restrict)
router.route("/tour-stats").get(tourController.getTourStats); // ⏺ anyone can use our API(no protect, no restrict)

router
  .route("/monthly-plan/:year")
  .get(
    authController.protect,
    authController.restrictTo("admin", "lead-guide", "guide"),
    tourController.getMonthlyPlan
  );

router
  .route("/tours-within/:distance/center/:latlng/unit/:unit")
  .get(tourController.getToursWithin);

router.route("/distances/:latlng/unit/:unit").get(tourController.getDistances);

router
  .route("/")
  .get(tourController.getAllTours) // ⏺ anyone can use our API(no protect, no restrict)
  .post(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.createTour
  );
router
  .route("/:id/:cat?")
  .get(tourController.getTour) // ⏺ anyone can use our API(no protect, no restrict)
  .patch(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.deleteTour
  );

module.exports = router;
