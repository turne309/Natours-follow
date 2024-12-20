const AppError = require('./../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/);
  console.log(`Value: ${value}`);

  const message = `Duplicate field value: ${value} Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please login again.', 401);

const handleJWTEexpiredError = () =>
  new AppError('Login expired. Please login again.', 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    name: err.name,
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};
const sendErrorProd = (err, res) => {
  //   Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Programming error or other unkown error: don't leak error detais
    // Log the error
    console.error('ERROR!!!', err);
    // Send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong',
    });
  }
};
// By declaring these 4 parameters, express automatically knows this is an error handling middleware
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    console.log(`Err name: ${err.name}`);
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = JSON.parse(JSON.stringify(err));
    // console.log(`ErrObj: ${error}`);
    console.log(`ErrName: ${error.name}`);
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationError(err);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTEexpiredError();
    sendErrorProd(error, res);
  }
};
