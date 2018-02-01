'use strict';
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

// parent: user skills
const skillSchema = mongoose.Schema({
  user_id: { type: String, required: true },
  skill: {type: String, required: true },
  experience: { type: Number, required: true }
});


//parent: job
const jobSchema = mongoose.Schema({
  user_id: {type: String, required: true},
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, required: true },
  dateApplied: Date,
  progress: String
})

// grandparent: user auth
const userSchema = mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    jobs: [jobSchema],
    skills: [skillSchema]
});

skillSchema.methods.apiRepr = function() {
  return {
    id: this._id,
    user_id: this.user_id,
    skill: this.skill,
    experience: this.experience,
  };
}

jobSchema.methods.apiRepr = function() {
  return {
    id: this._id,
    user_id: this.user_id,
    title: this.title,
    company: this.company,
    location: this.location,
    required: this.required,
    dateApplied: Date,
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

userSchema.statics.findOrCreate = function(user) {
    return new Promise((resolve, reject) => {
        this.findOne({_id: user._id}).then(result => {
          if(!result){
            this.create({
              user_id: user._id,
              required: job.required
            }).then(result => resolve(result))
              .catch(err => reject(err));
          } else {
              resolve(result);
          }
        }).catch(err => reject(err));
    })
}

userSchema.query.byUsername = function(username) {
  return this.find({username: username});
}

const User = mongoose.model('User', userSchema);
const Skill = mongoose.model('Skill', skillSchema);
const Job = mongoose.model('Job', jobSchema);

module.exports = { Skill, Job, User };
