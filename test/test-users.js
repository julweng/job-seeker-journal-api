'use strict';
global.DATABASE_URL = 'mongodb://localhost/job-seeker-journal-app';
const chai = require('chai');
const chaiHttp = require('chai-http');
const assert = require('assert');
const mongoose = require('mongoose');
const {app, runServer, closeServer} = require('../server');
const { Skill, Job, ReqSkill, User } = require('../users');
const jwt = require('jsonwebtoken');
const faker = require('faker');

const expect = chai.expect;
// This let's us make HTTP requests
// in our tests.
// see: https://github.com/chaijs/chai-http
chai.use(chaiHttp);

describe('job seeker journal api', function() {
  const usernameA = 'user';
  const passwordA = 'pass';
  const usernameB = 'userB';
  const passwordB = 'passB';

  function generateUser() {
    let users = ['user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7', 'user8', 'user9', 'user10'];
    return users[Math.floor(Math.random() * users.length)];
  }

  function generatePassword() {
    let passwords = ['123', '321', '456', '654', 'abc', 'cba', 'xyz', 'zyx', 'efg', 'gfe'];
    return passwords[Math.floor(Math.random() * passwords.length)];
  }

  function generateUserData() {
    let user_id = new mongoose.Types.ObjectId();
    return {
      username: generateUser(),
      password: generatePassword(),
      jobs: [{
        user_id: user_id,
        title: faker.random.words(),
        location: faker.random.words(),
        company: faker.random.words(),
        required: [{
          skill: faker.random.words(),
          experience: faker.random.number()
        }],
        dateApplied: faker.date.recent(),
        progress: [faker.random.word()]
      }],
      skills: [{
        user_id: user_id,
        skill: faker.random.words(),
        experience: faker.random.number()
      }]
    }
  }

  function seedUserData() {
    console.info('seeding data');
    const seedData = [];
    for(let i = 1; i<=10; i++) {
      seedData.push(generateUserData());
    }
    return User.insertMany(seedData);
  }

  function tearDownDb() {
    console.warn('Deleting database');
    return mongoose.connection.dropDatabase();
  }

  before(function() {
    return runServer();
  });

  after(function() {
    return closeServer();
  });

  beforeEach(function() {
    return seedUserData();
  });

  afterEach(function() {
    return tearDownDb();
  });

  // GET tests
  describe('GET endpoint', function() {
    it('return all users', function() {
      return chai.request(app)
        .get('/users')
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.length.of.at.least(1);
          expect(res.body).to.have.lengthOf(10);
        });
    });
    it('should return users with right fields', function() {
      return chai.request(app)
        .get('/users')
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          res.body.forEach(user => {
            expect(user).to.be.an('object');
            expect(user).to.include.keys('username', 'password', 'jobs', 'skills');
          });
          // get user by userId
          let resUser = res.body[0];
          User.findById(resUser.id)
          .then(user => {
          expect(resUser.username).to.equal(user.username);
          expect(resUser.jobs).to.equal(user.jobs);
          expect(resUser.skills).to.equal(user.skills);
          });
        });
      });
    it('should return user by id', function() {
      return User
        .findOne()
        .then(user => {
          return chai.request(app)
            .get(`/users/${user.id}`)
            .then(res => {
              expect(res).to.have.status(200);
              expect(res).to.be.json;
              expect(res.body).to.be.an('object');
              const { username, skills, jobs } = res.body
              expect(res.body.username).to.equal(user.username);
              expect(skills.skill).to.equal(user.skills.skill);
              expect(skills.experience).to.equal(user.skills.experience);
              expect(jobs.title).to.equal(user.jobs.title);
              expect(jobs.company).to.equal(user.jobs.company);
              expect(jobs.location).to.equal(user.jobs.location);
            })

        });
      });
    it('should return user skills by user id', function() {
      return User
        .findOne()
        .then(user => {
          return chai.request(app)
            .get(`/users/skills/${user.id}`)
            .then(res => {
              expect(res).to.have.status(200);
              expect(res).to.be.json;
              expect(res.body).to.be.an('array')
              const { user_id, skill, experience } = res.body;
              expect(user_id).to.equal(user.skills.user_id);
              expect(skill).to.equal(user.skills.skill);
              expect(experience).to.equal(user.skills.experience);
            });
        });
      });
    it('should get jobs by user id', function() {
      return User
        .findOne()
        .then(user => {
          return chai.request(app)
            .get(`/users/jobs/${user.id}`)
            .then(res => {
              expect(res).to.have.status(200);
              expect(res).to.be.json;
              expect(res.body).to.be.an('array');
              const { user_id, id, title, company, location, required } = res.body;
              expect(user_id).to.equal(user.jobs.user_id);
              expect(id).to.equal(user.jobs._id);
              expect(title).to.equal(user.jobs.title);
              expect(company).to.equal(user.jobs.company);
              expect(location).to.equal(user.jobs.location);
              expect(required).to.equal(user.jobs.required);
            })
        })
      })
    });

    // POST tests
    describe('POST endpoints', function() {
      it('should add new skills', function() {
        return User
          .findOne()
          .then(user => {
            const newSkill = {
              user_id: user._id,
              skill: "FOO",
              experience: 1
            }
            return chai.request(app)
              .post(`/users/new/skills/${newSkill.user_id}`)
              .send(newSkill)
              .then(res => {
                expect(res).to.have.status(201);
                expect(res).to.be.json;
                expect(res.body).to.be.an('object');
                const { skill, experience  } = res.body.skills[1];
                expect(skill).to.equal(newSkill.skill);
                expect(experience).to.equal(newSkill.experience);
              });
          });
      });
      it('should add new jobs', function() {
        return User
          .findOne()
          .then(user => {
            const newJob = {
              user_id: user._id,
              title: faker.random.words(),
              location: faker.random.words(),
              company: faker.random.words(),
              dateApplied: '2018-01-28T09:23:44.877Z',
              progress: faker.random.word()
            }
            console.log(newJob.link)
            return chai.request(app)
              .post(`/users/new/jobs/${newJob.user_id}`)
              .send(newJob)
              .then(res => {
                expect(res).to.have.status(201);
                expect(res).to.be.json;
                expect(res.body).to.be.an('object');
                const { title, location, company, dateApplied, link, progress } = res.body.jobs[1];
                expect(title).to.equal(newJob.title);
                expect(location).to.equal(newJob.location);
                expect(company).to.equal(newJob.company);
                expect(progress).to.equal(newJob.progress);
              });
          });
        });
    });

    // PUT tests
    describe('PUT endpoints', function() {
      it('should update skill', function() {
        let user;
        return User
          .findOne()
          .then(_user => {
            user = _user;
            let user_id = user.id;
            let id = user.skills[0].id;
            const update = {
              id: id,
              user_id: user_id,
              skill: 'foo',
              experience: 2
            }
            return chai.request(app)
              .put(`/users/edit/${user_id}/skills/${id}`)
              .send(update)
              .then(res => {
                expect(res).to.have.status(204);
                return User.findById(user_id)
                  .then(res => {
                    expect(res.skills[0].skill).to.equal(update.skill);
                    expect(res.skills[0].experience).to.equal(update.experience);
                  })
              })
          })
      });
      it('should update job', function() {
        let user;
        return User
          .findOne()
          .then(_user => {
            user = _user;
            let user_id = user.id;
            let id = user.jobs[0].id;
            const update = {
              id: id,
              user_id: user_id,
              company: 'foo',
              location: 'bar',
              title: 'foobar',
              progress: 'resume submitted'
            }
            return chai.request(app)
              .put(`/users/edit/${user_id}/jobs/${id}`)
              .send(update)
              .then(res => {
                expect(res).to.have.status(204);
                return User.findById(user_id)
                  .then(res => {
                    const { title, location, company, required, progress } = res.jobs[0];
                    expect(title).to.equal(update.title);
                    expect(location).to.equal(update.location);
                    expect(company).to.equal(update.company);
                    expect(progress).to.equal(update.progress);
                  })
              })
          })
      });
    });

    // DELETE tests
    describe('delete endpoint', function() {
      it('delete skill by skill id', function() {
        let user;
        return User
          .findOne()
          .then(_user => {
            user = _user;
            let user_id = user._id;
            let id = user.skills[0].id;
            return chai.request(app)
              .delete(`/users/delete/${user_id}/skills/${id}`)
              .then(res => {
                expect(res).to.have.status(204);
                return User
                  .findById(user_id)
                  .then(user => {
                    console.log(user)
                    expect(user.skills).to.be.empty;
                  });
              });
            });
          });


          it('delete job by id', function() {
            let user;
            return User
              .findOne()
              .then(_user => {
                user = _user;
                let user_id = user.id;
                let id = user.jobs[0].id;
                return chai.request(app)
                  .delete(`/users/delete/${user_id}/jobs/${id}`)
                  .then(res => {
                    expect(res).to.have.status(204);
                    return User
                      .findById(user.id)
                      .then(user => {
                        expect(user.jobs).to.be.empty;
                      });
                  });
                });
              });
            });
      });
