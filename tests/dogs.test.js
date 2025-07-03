const request = require('supertest');
const { expect } = require('chai');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Dog = require('../models/Dog');

describe('Dog Management Endpoints', () => {
  let server;
  let user1Token, user2Token;
  let user1Id, user2Id;

  before(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dogadoption_test');
    }
    server = app.listen(0);
  });

  beforeEach(async () => {
    // Clean up data before each test
    await User.deleteMany({});
    await Dog.deleteMany({});

    // Create test users
    const user1Response = await request(app)
      .post('/api/auth/register')
      .send({ username: 'user1', password: 'password123' });

    const user2Response = await request(app)
      .post('/api/auth/register')
      .send({ username: 'user2', password: 'password123' });

    user1Token = user1Response.body.data.token;
    user2Token = user2Response.body.data.token;
    user1Id = user1Response.body.data.user.id;
    user2Id = user2Response.body.data.user.id;
  });

  after(async () => {
    await User.deleteMany({});
    await Dog.deleteMany({});
    if (server) server.close();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe('POST /api/dogs', () => {
    it('should register a new dog successfully', async () => {
      const dogData = {
        name: 'Buddy',
        description: 'A friendly golden retriever'
      };

      const response = await request(app)
        .post('/api/dogs')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(dogData)
        .expect(201);

      expect(response.body.success).to.be.true;
      expect(response.body.message).to.equal('Dog registered successfully');
      expect(response.body.data.dog.name).to.equal(dogData.name);
      expect(response.body.data.dog.description).to.equal(dogData.description);
      expect(response.body.data.dog.status).to.equal('available');
    });

    it('should require authentication', async () => {
      const dogData = {
        name: 'Buddy',
        description: 'A friendly golden retriever'
      };

      const response = await request(app)
        .post('/api/dogs')
        .send(dogData)
        .expect(401);

      expect(response.body.success).to.be.false;
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/dogs')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({})
        .expect(400);

      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('Validation failed');
    });
  });

  describe('PUT /api/dogs/:id/adopt', () => {
    let dogId;

    beforeEach(async () => {
      // Create a dog for testing
      const dogResponse = await request(app)
        .post('/api/dogs')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Buddy',
          description: 'A friendly golden retriever'
        });

      dogId = dogResponse.body.data.dog._id;
    });

    it('should adopt a dog successfully', async () => {
      const adoptionData = {
        message: 'Thank you for taking care of this lovely dog!'
      };

      const response = await request(app)
        .put(`/api/dogs/${dogId}/adopt`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send(adoptionData)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.message).to.equal('Dog adopted successfully');
      expect(response.body.data.dog.status).to.equal('adopted');
      expect(response.body.data.dog.adoptionMessage).to.equal(adoptionData.message);
    });

    it('should not allow owner to adopt their own dog', async () => {
      const response = await request(app)
        .put(`/api/dogs/${dogId}/adopt`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ message: 'Trying to adopt my own dog' })
        .expect(400);

      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('You cannot adopt your own dog');
    });

    it('should not adopt already adopted dog', async () => {
      // First adoption
      await request(app)
        .put(`/api/dogs/${dogId}/adopt`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ message: 'First adoption' });

      // Try second adoption
      const response = await request(app)
        .put(`/api/dogs/${dogId}/adopt`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ message: 'Second adoption' })
        .expect(400);

      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('Dog has already been adopted');
    });
  });

  describe('DELETE /api/dogs/:id', () => {
    let dogId;

    beforeEach(async () => {
      // Create a dog for testing
      const dogResponse = await request(app)
        .post('/api/dogs')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Buddy',
          description: 'A friendly golden retriever'
        });

      dogId = dogResponse.body.data.dog._id;
    });

    it('should remove own dog successfully', async () => {
      const response = await request(app)
        .delete(`/api/dogs/${dogId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.message).to.equal('Dog removed successfully');
    });

    it('should not remove other user\'s dog', async () => {
      const response = await request(app)
        .delete(`/api/dogs/${dogId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);

      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('You can only remove dogs that you registered');
    });

    it('should not remove adopted dog', async () => {
      // First adopt the dog
      await request(app)
        .put(`/api/dogs/${dogId}/adopt`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ message: 'Adopting this dog' });

      // Try to remove adopted dog
      const response = await request(app)
        .delete(`/api/dogs/${dogId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(400);

      expect(response.body.success).to.be.false;
      expect(response.body.message).to.equal('Cannot remove an adopted dog');
    });
  });

  describe('GET /api/dogs/registered', () => {
    beforeEach(async () => {
      // Create some dogs for testing
      await request(app)
        .post('/api/dogs')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 'Dog1', description: 'Description 1' });

      await request(app)
        .post('/api/dogs')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 'Dog2', description: 'Description 2' });

      await request(app)
        .post('/api/dogs')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ name: 'Dog3', description: 'Description 3' });
    });

    it('should get user\'s registered dogs', async () => {
      const response = await request(app)
        .get('/api/dogs/registered')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data.dogs).to.have.lengthOf(2);
      expect(response.body.data.pagination.totalDogs).to.equal(2);
    });

    it('should support status filtering', async () => {
      const response = await request(app)
        .get('/api/dogs/registered?status=available')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data.dogs).to.have.lengthOf(2);
      response.body.data.dogs.forEach(dog => {
        expect(dog.status).to.equal('available');
      });
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/dogs/registered?page=1&limit=1')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data.dogs).to.have.lengthOf(1);
      expect(response.body.data.pagination.currentPage).to.equal(1);
      expect(response.body.data.pagination.totalPages).to.equal(2);
    });
  });

  describe('GET /api/dogs/adopted', () => {
    let dogId;

    beforeEach(async () => {
      // Create and adopt a dog
      const dogResponse = await request(app)
        .post('/api/dogs')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 'AdoptedDog', description: 'Will be adopted' });

      dogId = dogResponse.body.data.dog._id;

      await request(app)
        .put(`/api/dogs/${dogId}/adopt`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ message: 'Thank you!' });
    });

    it('should get user\'s adopted dogs', async () => {
      const response = await request(app)
        .get('/api/dogs/adopted')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data.dogs).to.have.lengthOf(1);
      expect(response.body.data.dogs[0].status).to.equal('adopted');
      expect(response.body.data.dogs[0].adopter.username).to.equal('user2');
    });

    it('should return empty array if no adopted dogs', async () => {
      const response = await request(app)
        .get('/api/dogs/adopted')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data.dogs).to.have.lengthOf(0);
    });
  });

  describe('GET /api/dogs', () => {
    beforeEach(async () => {
      // Create some available dogs
      await request(app)
        .post('/api/dogs')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 'Available1', description: 'Available dog 1' });

      const dogResponse = await request(app)
        .post('/api/dogs')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 'Available2', description: 'Available dog 2' });

      // Adopt one dog
      await request(app)
        .put(`/api/dogs/${dogResponse.body.data.dog._id}/adopt`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ message: 'Adopting this one' });
    });

    it('should get only available dogs', async () => {
      const response = await request(app)
        .get('/api/dogs')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data.dogs).to.have.lengthOf(1);
      response.body.data.dogs.forEach(dog => {
        expect(dog.status).to.equal('available');
      });
    });
  });
});