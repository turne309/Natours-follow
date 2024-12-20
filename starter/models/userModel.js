const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'],
    maxLength: [35, 'A users name must have fewer than 35 characters'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an an email'],
    unique: [true, 'Please provide a unique email'],
    lowercase: true,
    validate: [validator.isEmail, 'Please provide an email'],
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    minlength: 8,
    maxlength: [15, 'Password can be no longer than 15 characters'],
    required: [true, 'Please provide a password'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'You must confirm your password'],
    validate: {
      validator: function (el) {
        return el === this.password; // this returns true if the two match -- ONLY WORKS ON CREAT AND SAVE!!!
        // IMPORTANT --> this will not validate correctly on a PW update
      },
      message: 'Passwords do not match.',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});

// Encrypting sensitive information before it's saved to the database
userSchema.pre('save', async function (next) {
  //   only run this function if the PW was actually modified
  if (!this.isModified('password')) return next();
  // hashing PW before it gets saved (also using bcript)
  this.password = await bcrypt.hash(this.password, 12);
  // Remmove the confirmPassword field
  this.passwordConfirm = undefined;
  next();
});

// Function that checks if a user's password is correct at login
userSchema.methods.correctPassword = function (
  candidatePassword,
  userPassword
) {
  // Can't use 'this.password' since we never return the PW in the schema --> the below line compares the inputed PW and the one saved in the DB
  return bcrypt.compare(candidatePassword, userPassword); // compare() hashes the user input, then compares to the saved hashed PW
};

userSchema.methods.changedPasswordAfter = function (jwtTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    console.log(changedTimestamp, jwtTimestamp);
    return jwtTimestamp < changedTimestamp;
  }
  return false; // Meaning 'not changed' in other words, the user has not changed their password
};

userSchema.methods.createPasswordResetToken = function () {
  // Create reset token using crypto package
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Setting the PW reset token
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);
  // Setting the expiration timeframe
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
