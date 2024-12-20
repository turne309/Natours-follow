const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./../../models/tourModel');
// to lines below have to be in this order (lesson 67)

dotenv.config({ path: './config.env' });

// Connecting to the mongoDB
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
).replace('<DBNAME>', process.env.DBNAME);
mongoose.connect(DB).then((con) => {
  // console.log(con.connection);
  console.log('DB connection successfull!');
});

// Read JSON file
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8')
);

// Import data into database
const importData = async () => {
  try {
    await Tour.create(tours);
    console.log('Data successfully imported!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// Delete all data from collection
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    console.log('Data successfully deleted!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  console.log('Attempting to import data...');
  importData();
} else if (process.argv[2] === '--delete') {
  console.log('Attempting to delete data...');
  deleteData();
} else {
  console.log('Neither operation ran.');
}

console.log(process.argv);
console.log(`Array position 2: ${process.argv[2]}`);
// console.log(`${process.argv}`);
