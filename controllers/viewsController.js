// // //

const Tour = require("./../models/tourModel");
const User = require("./../models/userModel");
const Booking = require("./../models/bookingModel");
const catchAsync = require("./../utility/catchAsync");
const AppError = require("./../utility/appError");

exports.getOverview = catchAsync(async (req, res, next) => {
  // ⏺ 1) get tour data from collections
  const tours = await Tour.find();
  // console.log(tours);

  // ⏺ 2) build template on overview.pug

  res.status(200).render("overview", { title: "All Tours", tours });
  // ⏺ render() method/function in Express is used to generate an HTML page from a template and send it to the user form `views` folder
});

exports.getTour = catchAsync(async (req, res, next) => {
  // ⏺ 1) get the data, for the requested tour (including reviews and guides)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: "reviews",
    fields: "review rating user",
  }); // ⏺ guides is coming (auto polulated) from tourModel
  if (!tour) return next(new AppError("There is no tour with that name!", 404));

  // ⏺ 2) build template on tour.pug

  res.status(200).render("tour", { title: `${tour.name}`, tour });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render("login", { title: "Log into your account" });
};

exports.getSignupForm = (req, res) => {
  res.status(200).render("signup", { title: "Join with us" });
};

exports.getAccount = (req, res) => {
  res.status(200).render("account", { title: "Your account" });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1) find all bookings
  const bookings = await Booking.find({ user: req.user.id });

  // 2) find tours with the returned id
  const tourIds = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIds } }); // ⏺ $in operator in MongoDB checks if a field’s value exists in a given array(tourIds)

  res.status(200).render("overview", {
    title: "My Tours",
    tours,
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  // console.log(req.body);
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res
    .status(200)
    .render("account", { title: "Your account", user: updatedUser });
});
