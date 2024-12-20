const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

// Below package is being depriciated "Please use a userland alternative instead."
const { decode } = require('punycode');

const { appendFile } = require('fs');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // This function passes all the requested information so no one can signup as an admin
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    role: req.body.role,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
  });
  console.log(req.body);
  // CReating JSON web token to send to the client
  const token = signToken(newUser._id);

  // Controller breaks at this point. The 'newUser' object returned below is different than the one above
  console.log(newUser);

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser, // Sending user JWT
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) check if email and PW exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password.', 400));
  }
  // 2) check if user exists && PW is correct
  const user = await User.findOne({ email }).select('+password');

  // Could split this into two if checks if needed
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password.', 401));
  }
  // 3) If everything is okay, send JWT to client
  const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    token,
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  // 1) Getting token and check if it's there
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(
      new AppError('You are not logged in. Please loging in to continue.', 401)
    );
  }

  // 2) Validate the JWT - VERIFICATION
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check that the user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to the token no longer exists.', 401)
    );
  }

  // 4) Check if the user changed passwords after the JWT was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'User recently changed their password. Please login again.',
        401
      )
    );
  }

  // 5) If everything is okay, grant access to protected route
  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // Roles ['admin', 'lead-guide']. role='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with that email adress', 404));
  }

  // 2) generate random token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false }); // Passing in this validate: false method to not run all of the validators
  // We don't want to run the validators because this data is being generated on the user JSON object. This means it will ask the user to confirm password, etc.

  // 3) send it back as an email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a patch request with your new password and passwordConfirm to: ${resetURL}\nIf you didn't forget your password, please ignore this email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (Valid for 10 minutes)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email.',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    console.log(err);
    return next(
      new AppError(
        'There was an error sending the email. Try again later or contact your administrator.',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // Query DB based on token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not yet expired, and there is a user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or expired.', 400));
  }
  user.password = req.body.password;
  user.password = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save(); // Don't turn off validators because we WANT them to run here

  // 3) Update changedPasswordAt property for the user

  // 4) Log the user in, send the JWT
  const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    token,
  });
});
