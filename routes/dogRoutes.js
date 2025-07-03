const express = require('express');
const router = express.Router();
const {
  registerDog,
  adoptDog,
  removeDog,
  getRegisteredDogs,
  getAdoptedDogs,
  getAllDogs,
  getDogById
} = require('../controllers/dogController');
const { authenticateToken } = require('../middleware/auth');
const {
  validateDogRegistration,
  validateDogAdoption,
  validateObjectId,
  validatePagination
} = require('../middleware/validation');

// All routes require authentication
router.use(authenticateToken);

// Dog management routes
router.post('/', validateDogRegistration, registerDog);
router.get('/', validatePagination, getAllDogs);
router.get('/registered', validatePagination, getRegisteredDogs);
router.get('/adopted', validatePagination, getAdoptedDogs);
router.get('/:id', validateObjectId, getDogById);
router.put('/:id/adopt', validateDogAdoption, adoptDog);
router.delete('/:id', validateObjectId, removeDog);

module.exports = router;