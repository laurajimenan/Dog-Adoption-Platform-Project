const mongoose = require('mongoose');

const dogSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Dog name is required'],
    trim: true,
    maxlength: [50, 'Dog name cannot exceed 50 characters']
  },
  description: {
    type: String,
    required: [true, 'Dog description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  adopter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  adoptionMessage: {
    type: String,
    trim: true,
    maxlength: [200, 'Adoption message cannot exceed 200 characters']
  },
  status: {
    type: String,
    enum: ['available', 'adopted'],
    default: 'available'
  },
  adoptedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
dogSchema.index({ owner: 1, status: 1 });
dogSchema.index({ adopter: 1 });
dogSchema.index({ status: 1 });

// Virtual for checking if dog is adopted
dogSchema.virtual('isAdopted').get(function() {
  return this.status === 'adopted';
});

// Method to adopt a dog
dogSchema.methods.adoptDog = function(adopterId, message) {
  this.adopter = adopterId;
  this.adoptionMessage = message;
  this.status = 'adopted';
  this.adoptedAt = new Date();
};

// Static method to get dogs with pagination
dogSchema.statics.getPaginatedDogs = function(filter, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return this.find(filter)
    .populate('owner', 'username')
    .populate('adopter', 'username')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

module.exports = mongoose.model('Dog', dogSchema);