// // //

const mongoose = require("mongoose");
const Tour = require("./tourModel");

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "Review can't be empty!"],
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
    },

    createdAt: {
      type: Date,
      default: Date.now(),
    },

    // ⏺ parent referencing
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "Review must belong to a tour!"],
    },

    // ⏺ parent referencing
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user!"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true }); // ⏺ It ensures each user can review a tour only once by making the tour and user combination unique

// ⏺ populate pipe
reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: "tour",
  //   select: "name",
  // }).populate({
  //   path: "user",
  //   select: "name photo",
  // });

  this.populate({
    path: "user",
    select: "name photo",
  });

  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // ⏺ statics method in Mongoose lets you add custom methods(calcAverageRatings) to the model directly. These methods can be used to modify what we want for specific fields

  // ⏺ remember `this` point to the current model
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: "$tour",
        numRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);
  // console.log(stats);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].numRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.post("save", function () {
  // ⏺ here `this` point to the current review
  this.constructor.calcAverageRatings(this.tour); // ⏺ this.constructor refers to the class or function that created the current object, used to access static methods
});

// ⏺ We use this._doc in the pre middleware to retrieve the document before the query is executed, and store it temporarily. Then, in the post middleware, we access the document (doc) to perform actions like recalculating the average ratings, using doc.constructor to call the static method. This ensures we have the correct document for processing after the query is complete
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this._doc = await this.model.findOne(this.getQuery());
  next();
});
reviewSchema.post(/^findOneAnd/, async function (doc, next) {
  await doc.constructor.calcAverageRatings(doc.tour);
  next();
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
