class AppError extends Error {
  constructor(message, statusCode, castError) {
    super(message);

    // this.castError = castError || false;

    // Status code inherrited from Error class
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'Failed' : 'error'; // If statusCode starts with a 4 -> failed status
    this.isOperational = true; // Doing this so later we can test for this property and only send errors that we created back to the client with this class

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
