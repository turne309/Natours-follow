const mongoose = require("mongoose");
const slugify = require("slugify");
const User = require("./userModel");

const validator = require("validator");
// Defining the DB schema
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A tour must have a name."],
      unique: true,
      trim: true,
      maxLength: [40, "A tour name must have fewer than 40 characters."],
      minLength: [10, "A tour name must have more than 10 characters."],
      // validate: [validator.isAlpha, 'Tour name must contain only letters.'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, "A tour must have a duration"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a group size"],
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Difficulty must be: easy, medium, or difficult.",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "A tour must have a price"],
    },
    priceDiscount: {
      type: Number,
      default: 0,
      validate: {
        validator: function (val) {
          return val < this.price; // Can only use 'this' when POSTing a document
        },
        message:
          "Discount price ({VALUE}) cannot be more than the initial price.",
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, "A tour must have a description"],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, "A tour must have an image"],
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
    startLocation: {
      // GeoJSON - Embeded object
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: Array,
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

tourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

// Document middleware: runs before the .save() and the .create()
tourSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

tourSchema.pre("save", async function (next) {
  // The result of the below line is an array of promises, so we need to await them all afterwards
  const guidesPromises = this.guides.map(async (id) => await User.findById(id));

  this.guides = await Promise.all(guidesPromises);

  next();
});

// tourSchema.pre('save', function (next) {
//   console.log('Will save document...');
//   next();
// });

// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// QUERY Middleware that will run before any find() method is run
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

// secret ID: 674b71fdda2b5cc2095f5de5

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took: ${Date.now() - this.start} milliseconds`);
  next();
});

// Aggregation middleware
tourSchema.pre("aggregate", function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

  console.log(this.pipeline());
  next();
});

const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;
