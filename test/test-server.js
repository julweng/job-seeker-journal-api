'use strict';

require('dotenv').config();
const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const should = chai.should();

const { TEST_DATABASE_URL } = require('../config');
const { Skill, Job } = require('../models');
const { app, runServer, closeServer } = require('../server');

chai.use(chaiHttp);

describe('api', function() {

  it('should 200 on GET requests', function() {
    return chai.request(app)
      .get('/api')
      .then(function(res) {
        res.should.have.status(200);
        res.should.be.json;
      });
  });
});
