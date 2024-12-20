const mongoose = require('mongoose');
const User = require('./userModel');
const validator = require('validator');

const updateSchema = User.add({
  test: 'test',
  // name: {
  //   type: String,
  //   required: [true, 'Please provide your name'],
  //   maxLength: [35, 'A users name must have fewer than 35 characters'],
  // },
  // email: {
  //   type: String,
  //   required: [true, 'Please provide an an email'],
  //   unique: [true, 'Please provide a unique email'],
  //   lowercase: true,
  //   validate: [validator.isEmail, 'Please provide an email'],
  // },
  // photo: String,
  // role: {
  //   type: String,
  //   enum: ['user', 'guide', 'lead-guide', 'admin'],
  //   default: 'user',
  // },
  // password: {
  //   type: String,
  //   minlength: 8,
  //   maxlength: [15, 'Password can be no longer than 15 characters'],
  //   required: [true, 'Please provide a password'],
  //   select: false,
  // },
  // passwordConfirm: {
  //   required: [true, 'You must confirm your password'],
  //   type: String,
  //   validate: {
  //     validator: function (el) {
  //       return el === this.password; // this returns true if the two match -- ONLY WORKS ON CREAT AND SAVE!!!
  //       // IMPORTANT --> this will not validate correctly on a PW update
  //     },
  //     message: 'Passwords do not match.',
  //   },
  // },
  // passwordChangedAt: Date,
  // passwordResetToken: String,
  // passwordResetExpires: Date,
});
