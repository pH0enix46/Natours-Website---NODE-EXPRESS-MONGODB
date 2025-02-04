// // //

const AppError = require("./../utility/appError");

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.keyValue.name;
  // console.log(value);
  const message = `Duplicate field value: (${value}). Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data! ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const handleJWTError = (err) =>
  new AppError("Invalid token. Please login again!!", 401);

const handleJWTExpiredError = (err) =>
  new AppError("Your token has expired. Please login again!", 401);

const sendErrorDev = (err, req, res) => {
  // For API
  if (req.originalUrl.startsWith("/api")) {
    // ⏺ originalUrl is an Express.js property that gives the full requested URL path
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  // For Rendered Website
  console.error("ERROR ⛔️", err);
  return res.status(err.statusCode).render("error", {
    title: "Something went wrong!",
    message: err.message,
  });
};

// ⏺ for user/client mistake
const sendErrorProd = (err, req, res) => {
  // For API
  if (req.originalUrl.startsWith("/api")) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }

    // ⏺ programmer error but we dont want to leak to the client
    console.error("ERROR ⛔️", err);
    return res.status(500).json({
      status: "error",
      message: "Something went very wrong!!",
    });
  }

  // For Rendered Website
  if (err.isOperational) {
    return res.status(err.statusCode).render("error", {
      title: "Something went wrong!",
      message: err.message,
    });
  }

  // ⏺ programmer error but we dont want to leak to the client
  console.error("ERROR ⛔️", err);
  return res.status(err.statusCode).render("error", {
    title: "Something went wrong!",
    message: "Please try again later!",
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };

    error.name = err.name;
    error.message = err.message;

    if (error.name === "CastError") error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === "ValidationError")
      error = handleValidationErrorDB(error);
    if (error.name === "JsonWebTokenError") error = handleJWTError();
    if (error.name === "TokenExpiredError") error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};
