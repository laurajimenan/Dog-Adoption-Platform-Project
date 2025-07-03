const Dog = require('../models/Dog');
const mongoose = require('mongoose');

// @desc    Register a new dog
// @route   POST /api/dogs
// @access  Private
const registerDog = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const dog = new Dog({
      name,
      description,
      owner: req.user._id
    });

    await dog.save();
    await dog.populate('owner', 'username');

    res.status(201).json({
      success: true,
      message: 'Dog registered successfully',
      data: { dog }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Adopt a dog
// @route   PUT /api/dogs/:id/adopt
// @access  Private
const adoptDog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const adopterId = req.user._id;

    const dog = await Dog.findById(id).populate('owner', 'username');

    if (!dog) {
      return res.status(404).json({
        success: false,
        message: 'Dog not found'
      });
    }

    // Check if dog is already adopted
    if (dog.status === 'adopted') {
      return res.status(400).json({
        success: false,
        message: 'Dog has already been adopted'
      });
    }

    // Check if user is trying to adopt their own dog
    if (dog.owner._id.toString() === adopterId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot adopt your own dog'
      });
    }

    // Adopt the dog
    dog.adoptDog(adopterId, message);
    await dog.save();
    await dog.populate('adopter', 'username');

    res.status(200).json({
      success: true,
      message: 'Dog adopted successfully',
      data: { dog }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a dog
// @route   DELETE /api/dogs/:id
// @access  Private
const removeDog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const dog = await Dog.findById(id);

    if (!dog) {
      return res.status(404).json({
        success: false,
        message: 'Dog not found'
      });
    }

    // Check if user owns the dog
    if (dog.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only remove dogs that you registered'
      });
    }

    // Check if dog has been adopted
    if (dog.status === 'adopted') {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove an adopted dog'
      });
    }

    await Dog.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Dog removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dogs registered by current user
// @route   GET /api/dogs/registered
// @access  Private
const getRegisteredDogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;

    // Build filter
    const filter = { owner: req.user._id };
    if (status) {
      filter.status = status;
    }

    // Get dogs with pagination
    const dogs = await Dog.getPaginatedDogs(filter, page, limit);
    
    // Get total count for pagination
    const total = await Dog.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        dogs,
        pagination: {
          currentPage: page,
          totalPages,
          totalDogs: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dogs adopted by current user
// @route   GET /api/dogs/adopted
// @access  Private
const getAdoptedDogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Filter for dogs adopted by current user
    const filter = { adopter: req.user._id };

    // Get dogs with pagination
    const dogs = await Dog.getPaginatedDogs(filter, page, limit);
    
    // Get total count for pagination
    const total = await Dog.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        dogs,
        pagination: {
          currentPage: page,
          totalPages,
          totalDogs: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all available dogs
// @route   GET /api/dogs
// @access  Private
const getAllDogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Only show available dogs
    const filter = { status: 'available' };

    // Get dogs with pagination
    const dogs = await Dog.getPaginatedDogs(filter, page, limit);
    
    // Get total count for pagination
    const total = await Dog.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        dogs,
        pagination: {
          currentPage: page,
          totalPages,
          totalDogs: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single dog by ID
// @route   GET /api/dogs/:id
// @access  Private
const getDogById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const dog = await Dog.findById(id)
      .populate('owner', 'username')
      .populate('adopter', 'username');

    if (!dog) {
      return res.status(404).json({
        success: false,
        message: 'Dog not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { dog }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerDog,
  adoptDog,
  removeDog,
  getRegisteredDogs,
  getAdoptedDogs,
  getAllDogs,
  getDogById
};