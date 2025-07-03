const request = require('supertest');
const { expect } = require('chai');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');

describe('Authentication Endpoints', () => {
  let server;

  before(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dogadoption_test');
    }
    server = app.listen(0);
  });

  beforeEach(async () => {
    // Clean up users before each test
    await User.deleteMany({});
  });

  after(async () => {
    await User.deleteMany({});
    if (server) server.close();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).to.be.true;
      expect(response.body.message).to.equal('User registered successfully');
      expect(response.body.data.user.username).to.equal(userData.username);
      expect(response.body.data.token).to.be.a('string');
    });

    it('should not register user with duplicate username', async () => {
      const userData = {
        username: 'testuser',
        password: 'password123'
      };

      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Try to register with same username
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('Username already exists');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('Validation failed');
    });

    it('should validate password length', async () => {
      const userData = {
        username: 'testuser',
        password: '123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).to.be.false;
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      const user = new User({
        username: 'testuser',
        password: 'password123'
      });
      await user.save();
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        username: 'testuser',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.message).to.equal('Login successful');
      expect(response.body.data.user.username).to.equal(loginData.username);
      expect(response.body.data.token).to.be.a('string');
    });

    it('should not login with invalid username', async () => {
      const loginData = {
        username: 'wronguser',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('Invalid credentials');
    });

    it('should not login with invalid password', async () => {
      const loginData = {
        username: 'testuser',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('Invalid credentials');
    });
  });

  describe('GET /api/auth/profile', () => {
    let token;

    beforeEach(async () => {
      // Register and login to get token
      const userData = {
        username: 'testuser',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      token = response.body.data.token;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data.user.username).to.equal('testuser');
    });

    it('should not get profile without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('Access token required');
    });

    it('should not get profile with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalidtoken')
        .expect(401);

      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('Invalid token');
    });
  });
});