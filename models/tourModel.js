// // //

const mongoose = require("mongoose");
const slugify = require("slugify");
const validator = require("validator");
// const User = require("./userModel");

// ⏺ create simple schema(mongoose makes our life easy)
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A tour must have a name!"],
      unique: true,
      trim: true,
      maxlength: [
        40,
        "A tour name must have less or equal then 40 characters!",
      ],
      minlength: [
        10,
        "A tour name must have more or equal then 10 characters!",
      ],
    },

    slug: String,

    duration: {
      type: Number,
      required: [true, "A tour must have a duration!"],
    },

    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a group size!"],
    },

    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty!"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Difficulty is either: easy, medium, difficult",
      },
    },

    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be above 1.0!"],
      max: [5, "Rating must be below 5.0!"],
      set: (val) => Math.round(val * 10) / 10, // ⏺ 4.666667 *10 -> 46.6666 -> 47/10 -> 4.7
    },

    ratingsQuantity: {
      type: Number,
      default: 0,
    },

    price: {
      type: Number,
      required: [true, "A tour must have a price!"],
    },

    priceDiscount: {
      type: Number,

      // ⏺ our own custom validotor
      validate: {
        validator: function (value) {
          return value < this.price;
        },
        message: "Discount price ({VALUE}) should be below regular price!",
      },
    },

    summary: {
      type: String,
      trim: true,
      required: [true, "A tour must have a summary!"],
    },

    description: {
      type: String,
      trim: true,
    },

    imageCover: {
      type: String,
      required: [true, "A tour must have a cover image!"],
    },

    images: [String],

    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },

    startDates: [Date],

    secretTour: {
      type: Boolean,
      default: false,
    },

    // ⏺ embedded data
    startLocation: {
      // ⏺ geoJSON: geospatial is storing and querying location-based data like coordinates (longitude, latitude) for maps, distance or proximity searches in databases like MongoDB
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: [Number],
      adress: String,
      description: String,
    },

    // ⏺ embedded data
    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: [Number],
        adress: String,
        description: String,
        day: Number,
      },
    ],

    // ⏺ embedded data
    // guides: Array,

    // ⏺ child referencing
    guides: [{ type: mongoose.Schema.ObjectId, ref: "User" }], // ⏺ it's reference the User documents

    // ⏺ child referencing
    // reviews: [{ type: mongoose.Schema.ObjectId, ref: "Review" }], // ⏺ it's reference the Review documents
  },

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// tourSchema.index({ price: 1 }); // ⏺ index() in Mongoose method/function makes searching and querying data faster for optimizing specific one fields. 1 means ascending and -1 means descending
tourSchema.index({ price: 1, ratingsAverage: -1 }); // ⏺ compound indexes in Mongoose method/function makes searching and querying data faster for optimizing multiple fields

tourSchema.index({ slug: 1 });

tourSchema.index({ startLocation: "2dsphere" }); // ⏺ We use the 2dsphere index to enable fast geospatial queries like finding locations within a certain distance

// ⏺ Finally, we use indexes/compound indexes to speed up database searches, improve query performance and optimize filtering or sorting

tourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

// ⏺ virtual populate: connects documents without storing IDs and retrieves related data when needed
// ⏺ it is referencing
tourSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "tour", // ⏺ "foreignField: tour" in the Review collection, it looks for the tour field, which holds the reference to the Tour document (the parent)
  localField: "_id", // ⏺ this document all the Tour collection, it uses the _id field (the unique ID of each tour) to match the tour field in the Review collection
});

// ⏺ DOCUMENT MIDDLEWARE(ONLY FOR SAVE AND CREATE)
tourSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// ⏺ it's for embedded data
// tourSchema.pre("save", async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// ⏺ QUERY MIDDLEWARE
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    // ⏺ populate() mongoose method/function that gets the full data from another collection
    path: "guides",
    select: "-__v -passwordChangedAt", // ⏺ - mane exclude
  });
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds!!`);
  next();
});

// ⏺ AGGREGATION MIDDLEWARE
// tourSchema.pre("aggregate", function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });

const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;
