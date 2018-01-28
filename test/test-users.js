'use strict';
global.DATABASE_URL = 'mongodb://localhost/job-seeker-journal-app';
const chai = require('chai');
const chaiHttp = require('chai-http');
const assert = require('assert');
const mongoose = require('mongoose');
const {app, runServer, closeServer} = require('../server');
const { Skill, Job, ReqSkill, User } = require('../users');
const jwt = require('jsonwebtoken');

const expect = chai.expect;

// This let's us make HTTP requests
// in our tests.
// see: https://github.com/chaijs/chai-http
chai.use(chaiHttp);

describe('/users', function() {
  const username = 'User';
  const password = 'Pass';
  const usernameB = 'UserB';
  const passwordB = 'PassB';

  const required = [{
    skill: 'hi',
    experience: 1
  }];

  const jobs = [{
    user_id: '5a6d0f877e7227274f485389',
    title: 'haha',
    location: 'hey',
    company: 'no',
    required: required,
    dateApplied: '2018-01-01',
    progress: ['resume submitted']
  }];

  const skills = [{
    user_id: '5a6d0f877e7227274f485389',
    skill: 'hi',
    experience: 1
  }];

  const newUser = {
    username: username,
    password: password,
    jobs: jobs,
    skills: skills
  }

  before(function() {
    return runServer();
  });

  after(function() {
    return closeServer();
  });

  afterEach(function() {
    return User.remove({});
  });

  // post a user
  describe('/users', function() {
    describe('POST', function() {
      it('Should reject users with missing username', function() {
        return chai
          .request(app)
          .post('/users')
          .send({
            password
          })
          .then(() =>
            expect.fail(null, null, 'Request should not succeed')
          )
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }

            const res = err.response;
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.message).to.equal('Missing field');
            expect(res.body.location).to.equal('username');
          });
      });

      it('Should reject users with missing password', function() {
        return chai
          .request(app)
          .post('/users')
          .send({
            username
          })
          .then(() =>
            expect.fail(null, null, 'Request should not succeed')
          )
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }

            const res = err.response;
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.message).to.equal('Missing field');
            expect(res.body.location).to.equal('password');
          });
      });

      it('Should reject users with non-string username', function() {
        return chai
          .request(app)
          .post('/users')
          .send({
            username: 1234,
            password,
          })
          .then(() =>
            expect.fail(null, null, 'Request should not succeed')
          )
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }

            const res = err.response;
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.message).to.equal(
              'Incorrect field type: expected string'
            );
            expect(res.body.location).to.equal('username');
          });
      });

      it('Should reject users with non-string password', function() {
        return chai
          .request(app)
          .post('/users')
          .send({
            username,
            password: 1234
          })
          .then(() =>
            expect.fail(null, null, 'Request should not succeed')
          )
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }

            const res = err.response;
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.message).to.equal('Incorrect field type: expected string');
            expect(res.body.location).to.equal('password');
          });
      });

      it('Should reject users with non-trimmed username', function() {
        return chai
          .request(app)
          .post('/users')
          .send({
            username: ` ${username} `,
            password
          })
          .then(() =>
            expect.fail(null, null, 'Request should not succeed')
          )
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }

            const res = err.response;
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.message).to.equal(
              'Cannot start or end with whitespace'
            );
            expect(res.body.location).to.equal('username');
          });
      });

      it('Should reject users with non-trimmed password', function() {
        return chai
          .request(app)
          .post('/users')
          .send({
            username,
            password: ` ${password} `
          })
          .then(() =>
            expect.fail(null, null, 'Request should not succeed')
          )
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }

            const res = err.response;
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.message).to.equal(
              'Cannot start or end with whitespace'
            );
            expect(res.body.location).to.equal('password');
          });
      });
      it('Should reject users with empty username', function() {
        return chai
          .request(app)
          .post('/users')
          .send({
            username: '',
            password
          })
          .then(() =>
            expect.fail(null, null, 'Request should not succeed')
          )
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }

            const res = err.response;
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.message).to.equal(
              'Must be at least 3 characters long'
            );
            expect(res.body.location).to.equal('username');
          });
      });

      it('Should reject users with password less than 3 characters', function() {
        return chai
          .request(app)
          .post('/users')
          .send({
            username,
            password: '12',
          })
          .then(() =>
            expect.fail(null, null, 'Request should not succeed')
          )
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }

            const res = err.response;
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.message).to.equal(
              'Must be at least 3 characters long'
            );
            expect(res.body.location).to.equal('password');
          });
      });

      it('Should reject users with password greater than 72 characters', function() {
        return chai
          .request(app)
          .post('/users')
          .send({
            username,
            password: new Array(9).fill('a').join(''),
          })
          .then(() =>
            expect.fail(null, null, 'Request should not succeed')
          )
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }

            const res = err.response;
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.message).to.equal(
              'Must be at most 8 characters long'
            );
            expect(res.body.location).to.equal('password');
          });
      });
      it('Should reject users with duplicate username', function() {
        // Create an initial user
        return User.create({
          username,
          password
        })
          .then(() =>
            // Try to create a second user with the same username
            chai.request(app).post('/users').send({
              username,
              password
            })
          )
          .then(() =>
            expect.fail('Request should not succeed')
          )
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }

            const res = err.response;
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.message).to.equal(
              'Username already taken'
            );
            expect(res.body.location).to.equal('username');
          });
      });

      it('Should create a new user', function() {
        var user = new User({
          username: username,
          password: password,
          jobs: jobs,
          skills: skills
        });
        user.save().then(function(){
          User
            .findOne({username: username})
            .then(function(user) {
              assert(user.username = username);
              done();
            })
        })
      });

    describe('GET', function() {
      it('Should return the created user above', function() {
        return chai.request(app).get('/users').then(res => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.length(1);
        });
      });
    });
  });
});
});
