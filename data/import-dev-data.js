// // //

const fs = require("fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const Tour = require("../models/tourModel");
const User = require("../models/userModel");
const Review = require("../models/reviewModel");

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose.connect(DB, {}).then((connection) => {
  console.log("DB connection sucessful! 🎉");
});

// ⏺ read json file
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/tours-simple.json`, "utf-8")
// );
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, "utf-8"));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, "utf-8"));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, "utf-8")
);

// ⏺ import data into database
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false }); // ⏺ it's disable validations before saving a document to the database
    await Review.create(reviews);
    console.log("Data sucessfully loaded!!");
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

// ⏺ delete pre-exist data from collection
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log("Data sucessfully deleted!!");
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

// console.log(process.argv);

if (process.argv[2] === "--import") importData();
else if (process.argv[2] === "--delete") deleteData();
