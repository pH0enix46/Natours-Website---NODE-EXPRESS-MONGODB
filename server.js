// // //

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION!! ⛔️ Shutting down....");
  console.log(err.name, err.message);
  process.exit(1);
});

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const app = require("./app");

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);
mongoose.connect(DB, {}).then((connection) => {
  console.log("DB connection sucessful! 🎉");
});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App is running on port ${port}...🏃🏃`);
});

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLER REJECTION!! ⛔️ Shutting down....");
  console.log(err.name, err.message);

  server.close(() => {
    process.exit(1);
  });
});

// console.log(x);
