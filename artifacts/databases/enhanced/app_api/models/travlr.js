const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Trip code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: [2, 'Trip code must contain at least 2 characters'],
      maxlength: [30, 'Trip code cannot exceed 30 characters']
    },

    name: {
      type: String,
      required: [true, 'Trip name is required'],
      trim: true,
      minlength: [2, 'Trip name must contain at least 2 characters'],
      maxlength: [100, 'Trip name cannot exceed 100 characters']
    },

    length: {
      type: String,
      required: [true, 'Trip length is required'],
      trim: true,
      maxlength: [50, 'Trip length cannot exceed 50 characters']
    },

    start: {
      type: Date,
      required: [true, 'Trip start date is required']
    },

    resort: {
      type: String,
      required: [true, 'Resort is required'],
      trim: true,
      minlength: [2, 'Resort must contain at least 2 characters'],
      maxlength: [100, 'Resort cannot exceed 100 characters']
    },

    perPerson: {
      type: String,
      required: [true, 'Price per person is required'],
      trim: true,
      validate: {
        validator(value) {
          const normalizedValue = value.replace(/[$,\s]/g, '');
          const numericValue = Number(normalizedValue);

          return (
            normalizedValue.length > 0 &&
            Number.isFinite(numericValue) &&
            numericValue >= 0
          );
        },
        message: 'Price per person must contain a valid nonnegative amount'
      }
    },

    image: {
      type: String,
      required: [true, 'Image filename is required'],
      trim: true,
      maxlength: [255, 'Image filename cannot exceed 255 characters']
    },

    description: {
      type: String,
      required: [true, 'Trip description is required'],
      trim: true,
      minlength: [10, 'Trip description must contain at least 10 characters'],
      maxlength: [2000, 'Trip description cannot exceed 2,000 characters']
    },

    capacity: {
      type: Number,
      required: true,
      min: [1, 'Trip capacity must be at least 1'],
      default: 20
    },

    availableSeats: {
      type: Number,
      required: true,
      min: [0, 'Available seats cannot be negative'],
      default: 20
    },

    active: {
      type: Boolean,
      required: true,
      default: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

tripSchema.index({ resort: 1, start: 1 });
tripSchema.index({ active: 1, start: 1 });
tripSchema.index({ availableSeats: 1 });

tripSchema.index({
  name: 'text',
  resort: 'text',
  description: 'text'
});

/*
 * Mongoose runs this as synchronous validation middleware.
 * Calling next() is unnecessary in the installed Mongoose version.
 */
tripSchema.pre('validate', function validateAvailability() {
  if (this.availableSeats > this.capacity) {
    this.invalidate(
      'availableSeats',
      'Available seats cannot exceed the total trip capacity'
    );
  }
});

mongoose.model('trips', tripSchema);