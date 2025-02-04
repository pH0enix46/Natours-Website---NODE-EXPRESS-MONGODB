// // //

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY); // ⏺ it imports the Stripe library to handle payments in Node.js
const Tour = require("./../models/tourModel");
const Booking = require("./../models/bookingModel");
const catchAsync = require("./../utility/catchAsync");
const factory = require("./handlerFactory");
const User = require("../models/userModel");

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);

  // 2) create checkout session
  const session = await stripe.checkout.sessions.create({
    // ⏺ they are comming from stripe library for creates a checkout session for handling payments
    payment_method_types: ["card"],

    // success_url: `${req.protocol}://${req.get("host")}/my-tours/?tour=${
    //   req.params.tourId
    // }&user=${req.user.id}&price=${tour.price}`,
    success_url: `${req.protocol}://${req.get("host")}/my-tours`,

    cancel_url: `${req.protocol}://${req.get("host")}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://natours.dev/img/tours/${tour.imageCover}`],
          },
          unit_amount: tour.price * 100,
        },
        quantity: 1,
      },
    ],
  });

  // 3) send it to client
  res.status(200).json({
    status: "success",
    session,
  });
});

// // it's unsecure, everyone can make bookings without paying
// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   const { tour, user, price } = req.query;

//   if (!tour && !user && !price) return next();

//   await Booking.create({
//     tour,
//     user,
//     price,
//   });

//   res.redirect(req.originalUrl.split("?")[0]); // ⏺ redirect() is express method/function used to send users to a different URL
// });

const createBookingCheckout = async (session) => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.line_items[0].price_data.unit_amount / 100;

  await Booking.create({
    tour,
    user,
    price,
  });
};

exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    return res.status(400).send(`Webhook error!: ${error.message}`);
  }

  if (event.type === "checkout.session.completed")
    createBookingCheckout(event.data.object);

  res.status(200).json({
    received: true,
  });
};

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
