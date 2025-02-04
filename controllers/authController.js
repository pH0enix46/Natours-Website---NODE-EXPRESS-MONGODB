// // //

const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("./../models/userModel");
const catchAsync = require("./../utility/catchAsync");
const AppError = require("./../utility/appError");
const Email = require("./../utility/email");

const signToken = (id) => {
  return jwt.sign(
    {
      // ⏺ payload
      id,
    },
    // ⏺ signature
    process.env.JWT_SECRET,
    {
      // ⏺ option. after 100d days the whole system will be invalid
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  // if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  if (req.secure || req.headers["x-forwarded-proto"] === "https")
    cookieOptions.secure = true; // ⏺ req.secure is a property in Express.js that checks if the request is being made over HTTPS. It returns true if the connection is secure (HTTPS) and false if it’s not (HTTP)

  res.cookie("jwt", token, cookieOptions);

  // ⏺ remove password from the output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });

  const url = `${req.protocol}://${req.get("host")}/me`;
  // console.log(url);
  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res); // ⏺ 201 for created
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // ⏺ 1) check if email and password exist
  if (!email || !password)
    return next(new AppError("Please provide email and password!!", 400));

  // ⏺ 2) check if user exist && password is correct
  const user = await User.findOne({ email }).select("+password");

  // ⏺ user is document here, so all the document ei kintu instance method avaliable
  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError("Incorrect email or password!", 401));

  // ⏺ 3) check if everything is ok then send token to client
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie("jwt", "Logged Out", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    status: "success",
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  // ⏺ 1) getting token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // ⏺ postman er Get All Tours e giye headers option e jabo
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  // console.log(token);
  if (!token)
    return next(
      new AppError("You aren't logged in! Please login to get access!", 401)
    );

  // ⏺ 2) verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // ⏺ 3) check if users still exist
  const currentUser = await User.findById(decoded.id);
  if (!currentUser)
    return next(
      new AppError("The user belong to this token doesn't exist!", 401)
    );

  // ⏺ 4) check if users changed password after the token was issued
  if (currentUser.changePasswordAfter(decoded.iat))
    return next(
      new AppError("User recently changed password. Please login again!", 401)
    );

  // ⏺ FINALLY ACCESS TO PROCTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // ⏺ 1) verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // ⏺ 2) check if users still exist
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) return next();

      // ⏺ 3) check if users changed password after the token was issued
      if (currentUser.changePasswordAfter(decoded.iat)) return next();

      // ⏺ THERE IS A LOGGED IN USER
      res.locals.user = currentUser; // ⏺ locals(obj) save the currentUser data, for that it can be accessed in views(_header.pug)
      return next();
    } catch (error) {
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  // console.log(roles);
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You don't have permission to perform this action!", 403)
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // ⏺ 1) get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(new AppError("There is no user with this email!", 404));

  // ⏺ 2) generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // ⏺ 3) send it to user email
  try {
    const resetURL = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        "There was an error to sending the email. Try again later!!",
        500 // ⏺ Internal Server Error
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // ⏺ 1) get user based on token
  const hasedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex"); // ⏺ eta database er token er sathe milabe

  const user = await User.findOne({
    passwordResetToken: hasedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // ⏺ 2) if token has no expired and there is a user, then set the new password
  if (!user) return next(new AppError("Token is invalid or expired", 400));
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // ⏺ 3) update updateChangedAt property for the user

  // ⏺ 4) log the user in, send JWT to the client
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // ⏺ 1) get user from database
  const user = await User.findById(req.user.id).select("+password");

  // ⏺ 2) check if POSTed current password is correct or not
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password)))
    return next(new AppError("Your current password is wrong!", 401));

  // ⏺ 3) if so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // ⏺ 4) log user in, send JWT
  createSendToken(user, 200, res);
});

// ⏺ user jokhon login thakbe se kintu protect function er control e thakbe. puro whole system real life logic e cinta korbo
