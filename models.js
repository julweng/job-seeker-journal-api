'use strict';

const mongoose = require('mongoose');

const skillSchema = mongoose.Schema({
  skill: String,
  experience: Number
});

const requiredSchema = mongoose.Schema({
  skill: String,
  experience: Number
})

const jobSchema = mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, required: true },
  required: [requiredSchema],
  dateApplied: Date,
  progress: [String]
})

const parentOfJobAndSkillSchema = mongoose.Schema({
  username: { type: String, required: true },
  skills: [skillSchema],
  jobs: [jobSchema]
});

skillSchema.methods.apiRepr = function() {
  return {
    id: this._id,
    skill: this.skill,
    experience: this.experience
  };
}

requiredSchema.methods.apiRepr = function() {
  return {
    id: this._id,
    skill: this.skill,
    experience: this.experience
  }
}

jobSchema.methods.apiRepr = function() {
  return {
    id: this._id,
    title: this.title,
    company: this.company,
    location: this.location,
    required: this.required,
    dateApplied: Date,
    progress: this.progress,
  }
}

parentOfJobAndSkillSchema.methods.apiRepr = function() {
  return {
    id: this._id,
    username: this.username,
    skills: this.skills,
    jobs: this.jobs
  }
}

jobSchema.methods.findOrCreate = function(job, id) {
  return new Promise((reject, resolve) => {
    this.findOne({_id: id}, (err, result) => {
      if(err){
        console.log(err);
        reject(err);
        return;
      }
      if(!result){
        this.create({
          title: job.title,
          company: job.company,
          location: job.location,
          required: job.required
        }).then(resolve).catch(reject);
      return;
      }
      resolve(result);
    })
  })
}

requiredSchema.methods.findOrCreate = function(job) {
  return new Promise((reject, resolve) => {
    this.findOne({_id: id}, (err, result) => {
      if(err){
        console.log(err);
        reject(err);
        return;
      }
      if(!result){
        this.create({
          title: job.title,
          company: job.company,
          location: job.location,
          required: job.required
        }).then(resolve).catch(reject);
      return;
      }
      resolve(result);
    })
  })
}


parentOfJobAndSkillSchema.query.byUsername = function(username) {
  return this.find({username: username});
}


const JobAndSkill = mongoose.model('JobAndSkill', parentOfJobAndSkillSchema);
const Skill = mongoose.model('Skill', skillSchema);
const Job = mongoose.model('Job', jobSchema);
const Required = mongoose.model('Required', requiredSchema);

module.exports = { JobAndSkill, Skill, Job, Required };

/*
const skillAndJobSchema = mongoose.Schema({
  username: { type: String, required: true },
  skills: [
    {
      skills: String,
      experience: Number
    }
  ],
  jobs: [
    {
      job_id: Number,
      title: { type: String, required: true },
      company: { type: String, required: true },
      location: { type: String, required: true },
      skill: [String],
      experience: [Number],
      dateApplied: Date,
      progress: [String]
    }
  ]
});

skillAndJobSchema.methods.apiRepr = function() {
  return {
    id: this._id,
    username: this.username,
    skills: this.skills,
    jobs: this.jobs
  };
}

skillAndJobSchema.query.byUsername = function(username) {
  return this.find({username: username});
}

const skillSchema = mongoose.Schema({
  username: { type: String, required: true },
  skills: [
    {
      skills: String,
      experience: Number
    }
  ]
});

skillSchema.methods.apiRepr = function() {
  return {
    id: this._id,
    username: this.username,
    skills: this.skills
  };
}

skillSchema.query.byUsername = function(username) {
  return this.find({username: username});
}

const jobSchema = mongoose.Schema({
  username: { type: String, required: true },
  job_id: Number,
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, required: true },
  skill: [String],
  experience: [Number],
  dateApplied: Date,
  progress: [String]
});

jobSchema.methods.apiRepr = function() {
  return {
    id: this._id,
    username: this.username,
    title: this.title,
    company: this.company,
    location: this.location,
    skill: this.skill,
    experience: this.experience,
    dateApplied: this.dateApplied,
    progress: this.progress
  };
}

jobSchema.query.byUsername = function(username) {
  return this.find({username: username});
}

const SkillJob = mongoose.model('SkillJob', skillAndJobSchema);
const Skill = mongoose.model('Skill', skillSchema);
const Job = mongoose.model('Job', jobSchema);

module.exports = { Skill, Job, SkillJob };
*/
