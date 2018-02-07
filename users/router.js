'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { Skill, Job, User  } = require('./model');

const router = express.Router();
const jsonParser = bodyParser.json();

const ObjectId = mongoose.Schema.Types.ObjectId;

function handleRequestIdError(req, res) {
  if(!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    const message = `Bad Request: Request path id (${req.params.id}) and request body id (${req.body.id}) must match`;
    console.error(message);
    return res.status(400).json({message: message});
  }
}

// Post to register a new user
router.post('/', jsonParser, (req, res) => {
  const requiredFields = ['username', 'password'];
  const missingField = requiredFields.find(field => !(field in req.body));

  if (missingField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Missing field',
      location: missingField
    });
  }

  // check if username, password are string
  const stringFields = ['username', 'password'];
  const nonStringField = stringFields.find(
    field => field in req.body && typeof req.body[field] !== 'string'
  );

  if (nonStringField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Incorrect field type: expected string',
      location: nonStringField
    });
  }

  // If the username and password aren't trimmed, give error.
  const explicityTrimmedFields = ['username', 'password'];
  const nonTrimmedField = explicityTrimmedFields.find(
    field => req.body[field].trim() !== req.body[field]
  );

  if (nonTrimmedField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Cannot start or end with whitespace',
      location: nonTrimmedField
    });
  }

  const sizedFields = {
    username: { min: 3, max: 8 },
    password: { min: 3, max: 8 }
  };

  const tooSmallField = Object.keys(sizedFields).find(
    field =>
      'min' in sizedFields[field] &&
            req.body[field].trim().length < sizedFields[field].min
  );
  const tooLargeField = Object.keys(sizedFields).find(
    field =>
      'max' in sizedFields[field] &&
            req.body[field].trim().length > sizedFields[field].max
  );

  if (tooSmallField || tooLargeField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: tooSmallField
        ? `Must be at least ${sizedFields[tooSmallField]
          .min} characters long`
        : `Must be at most ${sizedFields[tooLargeField]
          .max} characters long`,
      location: tooSmallField || tooLargeField
    });
  }

  let { username, password, jobs, skills } = req.body;

  //check for existing user
  return User.find({ username })
    .count()
    .then(count => {
      if (count > 0) {
        // There is an existing user with the same username
        return Promise.reject({
          code: 422,
          reason: 'ValidationError',
          message: 'Username already taken',
          location: 'username'
        });
      }
      // If no existing user, hash password
      return User.hashPassword(password);
    })
    .then(hash => {
      return User.create({
        username,
        password: hash
      });
    })
    .then(user => {
      return res.status(201).json(user.apiRepr());
    })
    .catch(err => {
      // Forward validation errors on to the client, otherwise give a 500
      // error because something unexpected has happened
      if (err.reason === 'ValidationError') {
        return res.status(err.code).json(err);
      }
      console.error(err);
      res.status(500).json({message: 'Internal Server Error'});
    });
});

// Never expose all your users like below in a prod application
// we're just doing this so we have a quick way to see
// if we're creating users. keep in mind, you can also
// verify this in the Mongo shell.
router.get('/', (req, res) => {
  return User.find()
    .then(users => res.json(users.map(user => user.apiRepr())))
    .catch(err => {
    console.error(err);
    res.status(500).json({message: 'Internal Server Error'});
    });
});

//get user by username
router.get('/user', (req, res) => {
  User.find()
    .byUsername(req.query.username)
    .exec()
    .then(user => res.json(user))
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'Internal Server Error'});
    });
});

// get user by user id
router.get('/:id', (req, res) => {
  User.findById(req.params.id)
    .then(user => res.json(user.apiRepr()))
    .catch(err => {
    console.error(err);
    res.status(500).json({message: 'Internal Server Error'});
    });
});

// get skills by user id
router.get('/skills/:id', (req, res) => {
  User
    .findById(req.params.id)
    .sort({skills: 1})
    .exec()
    .then(user => res.json(user.skills))
    .catch(err => {
    console.error(err);
    res.status(500).json({message: 'Internal Server Error'});
    });
});

// post skill by user id
router.post('/new/skills/:id', (req, res) => {
  const requiredFields = ['user_id', 'skill', 'experience'];
  requiredFields.forEach(field => {
    if(!(field in req.body)) {
      const message = `Bad request: missing \'${field}\' in request body`;
      console.error(message);
      return res.status(400).send(message);
    }
  });
  User
    .findById(req.params.id)
    .then(function(user) {
      user.skills.push({
        user_id: req.params.id,
        skill: req.body.skill,
        experience: req.body.experience
      })
      user
        .save()
        .then(user => {
          res.status(201).json(user.apiRepr());
        })
        .catch(err => {
          console.error(err);
          res.status(500).json({message: 'Internal Server Error'});
        })
    });
  });

// put skill by user and skill id
router.put('/edit/:user_id/skills/:id', (req, res) => {
  User
    .findById(req.params.user_id)
    .then(user => {
      let skills = user.skills.id(req.params.id);
      skills.set(req.body);
      return user.save();
    })
    .then(user => res.status(204).json(user.apiRepr()))
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'Internal Server Error'});
    });
});

// delete skill by user and skill id
router.delete('/delete/:user_id/skills/:id', (req, res) => {
  User
    .findById(req.params.user_id)
    .then(user => {
      console.log(user)
      let skills = user.skills.id(req.params.id);
      skills.remove();
      return user.save();
    })
    .then(user => res.status(204).json(user.apiRepr()))
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'Internal Server Error'});
    });
});

// get job by user id
router.get('/jobs/:id', (req, res) => {
  User
    .findById(req.params.id)
    .sort({jobs: 1})
    .exec()
    .then(user => res.json(user.jobs))
    .catch(err => {
    console.error(err);
    res.status(500).json({message: 'Internal Server Error'});
    });
});

// post job
router.post('/new/jobs/:id', (req, res) => {
  const requiredFields = ['user_id', 'title', 'company', 'location'];
  requiredFields.forEach(field => {
    if(!(field in req.body)) {
      const message = `Bad request: missing \'${field}\' in request body`;
      console.error(message);
      return res.status(400).send(message);
    }
  });
  User
    .findById(req.params.id)
    .then(function(user) {
      user.jobs.push({
        user_id: req.body.user_id,
        title: req.body.title,
        company: req.body.company,
        location: req.body.location,
        dateApplied: req.body.dateApplied,
        progress: req.body.progress
      })
      user
        .save()
        .then(user => {
          res.status(201).json(user.apiRepr());
        })
        .catch(err => {
          console.error(err);
          res.status(500).json({message: 'Internal Server Error'});
        })
    });
  });

// put job by user and job id
router.put('/edit/:user_id/jobs/:id', (req, res) => {
  handleRequestIdError(req, res); // check param id
  User
    .findById(req.params.user_id)
    .then(user => {
      const jobs = user.jobs.id(req.params.id);
      jobs.set(req.body);
      return user.save();
    })
    .then(user => res.status(204).json(user.apiRepr()))
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'Internal Server Error'});
    });
  });

// delete job by user and skill id
router.delete('/delete/:user_id/jobs/:id', (req, res) => {
  User
    .findById(req.params.user_id)
    .then(user => {
      const jobs = user.jobs.id(req.params.id)
      jobs.remove();
      return user.save();
    })
    .then(user => res.status(204).json(user.apiRepr()))
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'Internal Server Error'});
    });
  });

module.exports = { router };
