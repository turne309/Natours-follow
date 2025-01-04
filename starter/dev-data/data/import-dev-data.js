const fs = require("fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Tour = require("./../../models/tourModel");
const User = require("./../../models/userModel");
// to lines below have to be in this order (lesson 67)

dotenv.config({ path: "./config.env" });

// Connecting to the mongoDB
const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
).replace("<DBNAME>", process.env.DBNAME);
mongoose.connect(DB).then((con) => {
  // console.log(con.connection);
  console.log("DB connection successfull!");
});

// Read JSON file
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, "utf-8"));

const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, "utf-8"));

// Import data into database
const importDataTOUR = async () => {
  try {
    await Tour.create(tours);
    console.log("Data successfully imported!");
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

const importDataUSER = async () => {
  try {
    await User.create(users);
    console.log("Data successfully imported!");
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// Delete all data from collection
const deleteDataTOUR = async () => {
  try {
    await Tour.deleteMany();
    console.log("Data successfully deleted!");
  } catch (err) {
    console.log(err);
  }
  process.exit();
};
const deleteDataUSER = async () => {
  try {
    await User.deleteMany();
    console.log("Data successfully deleted!");
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === "--importTOUR") {
  console.log("Attempting to import tour data...");
  importDataTOUR();
} else if (process.argv[2] === "--importUSER") {
  console.log("Attempting to import user data...");
  importDataUSER();
} else if (process.argv[2] === "--deleteTOUR") {
  console.log("Attempting to delete tour data...");
  deleteDataTOUR();
} else if (process.argv[2] === "--deleteUSER") {
  console.log("Attempting to delete user data...");
  deleteDataUSER();
} else {
  console.log("Neither operation ran.");
}

console.log(process.argv);
console.log(`Array position 2: ${process.argv[2]}`);
// console.log(`${process.argv}`);
