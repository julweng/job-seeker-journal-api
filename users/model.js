'use strict';
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

// parent: user skills
const skillSchema = mongoose.Schema({
  skill: String,
  experience: Number
});

// grandchild: job requered skills
const requiredSchema = mongoose.Schema({
  skill: String,
  experience: Number
})

//parent: job
const jobSchema = mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, required: true },
  required: [requiredSchema],
  dateApplied: Date,
  progress: [String]
})

// grandparent: user auth
const userSchema = mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

userSchema.methods.apiRepr = function() {
  return {
    username: this.username || '',
    password: this.password || ''
  };
};

userSchema.methods.validatePassword = function(password) {
  return bcrypt
    .compare(password, this.password);
};

userSchema.statics.hashPassword = function(password) {
  return bcrypt.hash(password, 3);
};

const User = mongoose.model('User', userSchema);

module.exports = { User };
