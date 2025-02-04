// // //

const path = require("path"); // ⏺ imports Node.js’s Path module to work with file and folder paths easily
const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const compression = require("compression"); // compression is a middleware in Node.js that compresses HTTP responses to reduce the size of data sent to clients, improving performance and loading speed
const cors = require("cors"); // CORS(Cross-Origin Resource Sharing) is a security feature that controls how web pages can make requests to other websites to protect against harmful activities. I mean other can easily use our api

const AppError = require("./utility/appError");
const globalErrorHandler = require("./controllers/errorController");
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const bookingRouter = require("./routes/bookingRoutes");
const bookingController = require("./controllers/bookingController");
const viewRouter = require("./routes/viewRoutes");

const app = express();

app.enable("trust proxy"); // ⏺ on platforms like Railway to ensure your app correctly handles secure requests when it’s behind a proxy

// SETUP FOR PUG ✅ ✅ ✅
app.set("view engine", "pug"); // ⏺ tells Express to use Pug for rendering HTML views
app.set("views", path.join(__dirname, "views")); // ⏺ tells Express to find view files in the “views” folder inside the current folder
// ⛔️ ⛔️ ⛔️

// GLOBAL MIDDLEWARE ✅ ✅ ✅
app.use(cors()); // for real API, allowing requests from any domain to access our API
// app.use(
//   cors({
//     origin: "https://www.natours.com",
//   })
// );

app.options("*", cors()); // options() is used to handle HTTP OPTIONS (GET, POST, etc) requests, typically for CORS pre-flight checks, to specify allowed methods and headers for a resource. * measn all the route
// app.options("/api/v1/tours/:id", cors()); // specific for this routes

// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, "public")));

app.use(helmet());

// console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP. Please try again in an hour!",
  keyGenerator: (req) => req.ip, // Ensures rate-limiting uses the real IP
});
app.use("/api", limiter);

// webhooks
app.post(
  "/webhook-checkout",
  express.raw({ type: "application/json" }), // raw() parses raw request body (Buffer) without modifying it, useful for Stripe webhooks
  bookingController.webhookCheckout
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" })); // ⏺ urlencoded() is an Express middleware that parses `form` data from HTML `forms` into req.body. extended: true means it's allow to send complex data (like objects or arrays)
app.use(cookieParser());

app.use(mongoSanitize());
app.use(xss());

app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsQuantity",
      "ratingsAverage",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  })
);

app.use(compression());

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  next();
});
// ⛔️ ⛔️ ⛔️

// Set Content Security Policy
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      scriptSrc: [
        "'self'",
        "https://unpkg.com",
        "https://cdnjs.cloudflare.com",
      ],
    },
  })
);

// FOR FU**ING SECURITY ✅ ✅ ✅
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "script-src 'self' https://js.stripe.com https://unpkg.com/leaflet@1.9.4/dist/leaflet.js https://cdnjs.cloudflare.com/ajax/libs/axios/1.7.8/axios.min.js;"
  );
  next();
});
// ⛔️ ⛔️ ⛔️

// MOUNTING ROUTERS ✅ ✅ ✅
app.use("/", viewRouter);

// ⏺ API
// app.use("/api/v1/tours", cors(), tourRouter); // specefic routes for cors
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/bookings", bookingRouter);
// ⛔️ ⛔️ ⛔️

app.all("*", (req, res, next) => {
  // ⏺ create an error ⛔️
  next(new AppError(`Can't find ${req.originalUrl} on the server!`, 404));
});

// ⏺ GLOBAL ERROR HANDLING MIDDLEWARE EXPRESS
app.use(globalErrorHandler);
// ⛔️ ⛔️ ⛔️

module.exports = app;

// console.log(Y);
