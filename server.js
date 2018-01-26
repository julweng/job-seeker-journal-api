'use strict';
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const passport = require('passport');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');

mongoose.Promise = global.Promise;

const { router: usersRouter } = require('./users');
const { router: authRouter, localStrategy, jwtStrategy } = require('./auth');
const ObjectId = mongoose.Schema.Types.ObjectId;
const { PORT, DATABASE_URL } = require('./config');
const { JobAndSkill, Skill, Job, Required } = require('./models');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Logging
app.use(morgan('common'));

// CORS
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
  if (req.method === 'OPTIONS') {
    return res.send(204);
  }
  next();
});

passport.use(localStrategy);
passport.use(jwtStrategy);

app.use('/api/users/', usersRouter);
app.use('/api/auth/', authRouter);

const jwtAuth = passport.authenticate('jwt', { session: false });

// A protected endpoint which needs a valid JWT to access it
app.get('/api/protected', jwtAuth, (req, res) => {
  return res.json({
    data: 'rosebud'
  });
});

// GET all skills
app.get('/skills', (req, res) => {
  Skill
    .find()
    .then(skills => {
      res.json(skills.map(skill => skill.apiRepr()));
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'Internal Server Error'});
    });
});

// get skill by id
app.get('/skills/:id', (req, res) => {
  Skill
    .findById(req.params.id)
    .then(skill => res.json(skill.apiRepr()))
    .catch(err => {
    console.error(err);
    res.status(500).json({message: 'Internal Server Error'});
    });
});

// GET user skills by username
app.get('/skills/username', (req, res) => {
  console.log(req.query.username);
  Skill
    .find()
    .byUsername(req.query.username)
    .sort({skill: 1})
    .exec((err, skill) => res.send(skill))
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'Internal Server Error'});
    });
});


// POST new skill
app.post('/new/skills/:id', (req, res) => {
  const requiredFields = ['username', 'skill', 'experience'];
  requiredFields.forEach(field => {
    if(!(field in req.body)) {
      const message = `Bad request: missing \'${field}\' in request body`;
      console.error(message);
      return res.status(400).send(message);
    }

    let { username, skill, experience } = req.body;

    JobAndSkill.find({ username })
    .count()
    .then(count => {
      if(count > 0) {
        JobAndSkill.Skill.push({
          skill: skill,
          experience: experience
        });
      }
      JobAndSkill
        .create({ username: username })
        .then(jobAndSkill => jobAndSkill.Skill.create({
            skill: req.body.skill,
            experience: req.body.experience
          }))
        .catch(err => {
          console.error(err);
          res.status(500).json({message: 'Internal Server Error'});
        })
        .then(jobAndSkill => res.status(201).json(jobAndSkill.apiRepr()))
        .catch(err => {
          console.error(err);
          res.status(500).json({message: 'Internal Server Error'});
      });
    });
  });
});

// PUT(update) skills by id
app.put('/skills/:id', (req, res) => {
  if(!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    const message = `Bad Request: Request path id (${req.params.id}) and request body id (${req.body.id}) must match`;
    console.error(message);
    return res.status(400).json({message: message});
  }

  const toUpdate = {};
  const updateableFields = ['skill', 'experience'];

  updateableFields.forEach(field => {
    if(field in req.body) {
      toUpdate[field] = req.body[field];
    }
  });

  Skill.findOneAndUpdate(ObjectId(req.params.id), {$set:{toUpdate}}, {returnOriginal: false})
    .then(skill => res.status(204).end())
    .catch(err => res.status(500).json({message: 'Internal Server Error'}));
});

// GET all jobs
app.get('/jobs', (req, res) => {
  Job
    .find()
    .then(jobs => {
      res.json(jobs.map(job => job.apiRepr()));
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'Internal Server Error'});
    });
});

// get job by id
app.get('/jobs/:id', (req, res) => {
  Job
    .findById(req.params.id)
    .then(job => res.json(job.apiRepr()))
    .catch(err => {
    console.error(err);
    res.status(500).json({message: 'Internal Server Error'});
    });
});

// GET user jobs by username
app.get('/jobs/username', (req, res) => {
  Job
    .find()
    .byUsername(req.query.username)
    .sort({dateApplied: 1})
    .exec((err, job) => res.send(job))
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'Internal Server Error'});
    });
  });

  // POST new job
  app.post('/new/jobs', (req, res) => {
    const requiredFields = ['title', 'company', 'location'];
    requiredFields.forEach(field => {
      if(!(field in req.body)) {
        const message = `Bad request: missing \'${field}\' in request body`;
        console.error(message);
        return res.status(400).send(message);
      }
    Job
      .create({
        username: req.body.username,
        title: req.body.title,
        company: req.body.company,
        location: req.body.location,
        skill: req.body.skill,
        experience: req.body.experience,
        dateApplied: req.body.dateApplied,
        progress: req.body.progress
      })
      .then(job => res.status(201).json(job.apiRepr()))
      .catch(err => {
        console.error(err);
        res.status(500).json({message: 'Internal Server Error'});
      });
    });
  });

  // PUT(update) jobs by id
  app.put('/jobs/:id', (req, res) => {
    if(!(req.params.id && req.body.id && req.params.id === req.body.id)) {
      const message = `Bad Request: Request path id (${req.params.id}) and request body id (${req.body.id}) must match`;
      console.error(message);
      return res.status(400).json({message: message});
    }

    const toUpdate = {};
    const updateableFields = ['title', 'location', 'skill', 'experience', 'progress'];

    updateableFields.forEach(field => {
      if(field in req.body) {
        toUpdate[field] = req.body[field];
      }
    });

    Job.findOneAndUpdate(ObjectId(req.params.id), {$set: toUpdate}, {returnOriginal: false})
      .then(job => res.status(204).end())
      .catch(err => res.status(500).json({message: 'Internal Server Error'}));
  });

//Referenced by both runServer and closeServer. closeServer
//assumes runServer has run and set `server` to a server object
let server;

function runServer() {
  return new Promise((resolve, reject) => {
    mongoose.connect(DATABASE_URL, { useMongoClient: true }, err => {
      if (err) {
        return reject(err);
      }
      server = app
        .listen(PORT, () => {
          console.log(`Your app is listening on port ${PORT}`);
          resolve();
        })
        .on('error', err => {
          mongoose.disconnect();
          reject(err);
        });
    });
  });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing server');
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

if (require.main === module) {
  runServer().catch(err => console.error(err));
}

module.exports = { app, runServer, closeServer };

/*


// PUT(update) jobs by id
app.put('/jobs/id', (req, res) => {
  if(!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    const message = `Bad Request: Request path id (${req.params.id}) and request body id (${req.body.id}) must match`;
    console.error(message);
    return res.status(400).json({message: message});
  }

  const toUpdate = {};
  const updateableFields = ['jobs'];

  updateableFields.forEach(field => {
    if(field in req.body) {
      toUpdate[field] = req.body[field];
    }
  });

  Job.findOneAndUpdate(ObjectId(req.params.id), {$set: toUpdate}, {returnOriginal: false})
    .then(job => res.status(204).end())
    .catch(err => res.status(500).json({message: 'Internal Server Error'}));
});

// delete Skill by id
app.delete('/skills/:id', (req, res) => {
  Skill
    .findByIdAndRemove(req.params.id)
    .then(recipe => res.status(204).end())
    .catch(err => res.status(500).json({message: 'Internal Server Error'}));
});

// delete Skill by skill_id
app.delete('/skills/id', (req, res) => {
  Skill
    .findOneAndRemove({skill_id: res.query.userSkills.skill_id})
    .then(skill => res.status(204).end())
    .catch(err => {
      res.status(500).json({message: 'Internal Server Error'});
    });
});

app.use('*', function(req, res) {
  res.status(404).json({message: 'Not Found'});
});

// delete Job by id
app.delete('/jobs/:id', (req, res) => {
  Skill
    .findByIdAndRemove(req.params.id)
    .then(recipe => res.status(204).end())
    .catch(err => res.status(500).json({message: 'Internal Server Error'}));
});

// delete Job by job_id
app.delete('/jobs/id', (req, res) => {
  Skill
    .findOneAndRemove({skill_id: res.query.jobs.job_id})
    .then(skill => res.status(204).end())
    .catch(err => {
      res.status(500).json({message: 'Internal Server Error'});
    });
});

app.use('*', function(req, res) {
  res.status(404).json({message: 'Not Found'});
});

let server;

function runServer(databaseUrl = DATABASE_URL, port = PORT) {
    return new Promise((resolve, reject) => {
      mongoose.connect(databaseUrl, err => {
        if(err) {
          return reject(err);
        }
        server = app.listen(port, () => {
          console.log(`Your app is listening on port ${port}`);
          resolve();
        })
        .on('error', err => {
          mongoose.disconnect();
          reject(err);
        });
      });
    });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing server');
      server.close(err => {
        if(err) {
          return rejct(err);
        }
        resolve();
      });
    });
  });
}

if(require.main === module) {
  runServer().catch(err => console.error(err));
};

module.exports = { app, runServer, closeServer };
*/
