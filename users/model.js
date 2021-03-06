'use strict';
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

// user skills
const skillSchema = mongoose.Schema({
  user_id: { type: String, required: true },
  skill: {type: String, required: true },
  experience: { type: Number, required: true }
});

// job
const jobSchema = mongoose.Schema({
  user_id: {type: String, required: true},
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, required: true },
  dateApplied: String,
  progress: String
})

// parent: user auth
const userSchema = mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    jobs: [jobSchema],
    skills: [skillSchema]
});

skillSchema.methods.apiRepr = function() {
  return {
    id: this._id,
    user_id: this.user_id || '',
    skill: this.skill || '',
    experience: this.experience || '',
  };
}

jobSchema.methods.apiRepr = function() {
  return {
    id: this._id,
    user_id: this.user_id,
    title: this.title,
    company: this.company,
    location: this.location,
    dateApplied: this.dateApplied,
    progress: this.progress,
  }
}

userSchema.methods.apiRepr = function() {
  return {
    id: this._id,
    username: this.username || '',
    password: this.password || '',
    skills: this.skills || [],
    jobs: this.jobs || []
  };
};

userSchema.methods.validatePassword = function(password) {
  return bcrypt
    .compare(password, this.password);
};

userSchema.statics.hashPassword = function(password) {
  return bcrypt.hash(password, 3);
};

userSchema.query.byUsername = function(username) {
  return this.find({username: username});
}

const User = mongoose.model('User', userSchema);
const Skill = mongoose.model('Skill', skillSchema);
const Job = mongoose.model('Job', jobSchema);

module.exports = { Skill, Job, User };
