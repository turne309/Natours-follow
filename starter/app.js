const express = require('express');
const morgan = require('morgan');
const app = express();
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const tourRouter = require('./routes/tourRoutes'); //Middleware
const userRouter = require('./routes/userRoutes'); // Middleware

// 1) MIDDDLEWARES
console.log(`Enviornment: ${process.env.NODE_ENV}`);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json()); // Making the incoming request JSON data available
app.use(express.static(`${__dirname}/public`));
// Route for the overview (filesystem navigation)

app.use((req, res, next) => {
  console.log('Processing request...');
  console.log('Processing completed.');
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers); // this line is to see the headers with the JWT token in the console
  next();
});

// 3) ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// If a request makes it to this point of our middleware, it means it did not align with the two routes above and should be caught with a 404
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
