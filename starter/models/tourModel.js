const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
// Defining the DB schema
const tourSchem = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name.'],
      unique: true,
      trim: true,
      maxLength: [40, 'A tour name must have fewer than 40 characters.'],
      minLength: [10, 'A tour name must have more than 10 characters.'],
      // validate: [validator.isAlpha, 'Tour name must contain only letters.'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty must be: easy, medium, or difficult.',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      default: 0,
      validate: {
        validator: function (val) {
          return val < this.price; // Can only use 'this' when POSTing a document
        },
        message:
          'Discount price ({VALUE}) cannot be more than the initial price.',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have an image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

tourSchem.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Document middleware: runs before the .save() and the .create()
tourSchem.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchem.pre('save', function (next) {
//   console.log('Will save document...');
//   next();
// });

// tourSchem.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// QUERY Middleware that will run before any find() method is run
tourSchem.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

// secret ID: 674b71fdda2b5cc2095f5de5

tourSchem.post(/^find/, function (docs, next) {
  console.log(`Query took: ${Date.now() - this.start} milliseconds`);
  next();
});

// Aggregation middleware
tourSchem.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

  console.log(this.pipeline());
  next();
});

const Tour = mongoose.model('Tour', tourSchem);

module.exports = Tour;
