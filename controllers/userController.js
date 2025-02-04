// // //

const multer = require("multer"); // ⏺ Multer is a Node.js middleware for handling multipart/form-data, mainly used for file uploads. It stores files in memory or disk and integrates with Express
const sharp = require("sharp"); // ⏺ sharp is a fast Node.js library for image processing, supporting operations like resizing, cropping, and converting images with minimal memory usage
const User = require("./../models/userModel");
const catchAsync = require("./../utility/catchAsync");
const AppError = require("./../utility/appError");
const factory = require("./handlerFactory");

// const multerStorage = multer.diskStorage({
//   // ⏺ diskStorage() is Multer method/function storage engine for saving files to disk, allowing custom filename and destination settings
//   destination: (req, file, callBack) => {
//     callBack(null, "public/img/users");
//   },
//   filename: (req, file, callBack) => {
//     const extension = file.mimetype.split("/")[1];
//     callBack(null, `user-${req.user.id}-${Date.now()}.${extension}`);
//   },
// });
const multerStorage = multer.memoryStorage(); // ⏺ memoryStorage() is a Multer method/function storage engine that stores uploaded files in memory (RAM) / buffer(buffer in Node.js is a temporary storage area for raw binary data) instead of the disk, making them accessible via req.file
const multerFilter = (req, file, callBack) => {
  if (file.mimetype.startsWith("image")) callBack(null, true);
  else
    callBack(
      new AppError("Not an image! Please upload only images", 400),
      false
    );
};
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});
exports.uploadUserPhoto = upload.single("photo"); // ⏺ single() is Multer method/function to upload a single file with the given field name

// RESIZE USER PHOTO ---------- ✅ ✅ ✅
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});
// ---------- ⛔️ ⛔️ ⛔️

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};

  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });

  console.log(newObj);
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // console.log(req.file);
  // console.log(req.body);

  // ⏺ 1) create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm)
    return next(
      new AppError(
        "This route is not for password updates. Please use /updateMyPassword",
        400
      )
    );

  // ⏺ 2) filterd out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, "name", "email");
  if (req.file) filteredBody.photo = req.file.filename;

  // ⏺ 3) update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

// ⏺ we are not totally deleting them but just marking them. If they want their account again later, then we will able to give their account back
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not defined! Please use /signup instead",
  });
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User); // ⏺ don't update password with this
exports.deleteUser = factory.deleteOne(User);
