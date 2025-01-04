const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const app = express();
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");

const tourRouter = require("./routes/tourRoutes"); //Middleware
const userRouter = require("./routes/userRoutes"); // Middleware

// 1) GLOBAL MIDDDLEWARES
// sets security http headers IMPORTANT
app.use(helmet());
// logs enviornment mode
console.log(`Enviornment: ${process.env.NODE_ENV}`);
// logs all trace errors if in dev mode
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
// limiting the amount of requests per IP
const limiter = rateLimit({
  max: 100, // Scale this based on user metrics
  windowMs: 60 * 60 * 1000, // This scales the time window for requests (hr * s * ms)
  message: "Too many requests from this IP. Please try again in an hour",
});
app.use("/api", limiter);

// Making the incoming request JSON data available into req.body
app.use(express.json({ limit: "10kb" })); // Here is where we are limiting the request file size

// Cleaning incoming data. This has to run after the parser in middleware above
// NoSQL query injection
app.use(mongoSanitize());
// Data sanitization against XSS (script injection)
app.use(xss());
// Prevents parameter pollution. Should be used after previous security calls
app.use(
  hpp({
    // Adding parameters that we know we will use
    whitelist: [
      "duration",
      "ratingsQuantity",
      "maxGroupSize",
      "difficulty",
      "price",
      "ratingsAverage",
    ],
  })
);

// For serving static files
app.use(express.static(`${__dirname}/public`));

// app.use((req, res, next) => {
//   console.log("Processing request...");
//   console.log("Processing completed.");
//   next();
// });

//  Test middleware for taking a look at the headers
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers); // this line is to see the headers with the JWT token in the console
  next();
});

// 3) ROUTES
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);

// If a request makes it to this point of our middleware, it means it did not align with the two routes above and should be caught with a 404
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
