const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    confirmationCode: {
      type: String,
      required: [true, 'Confirmation code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },

    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'trips',
      required: [true, 'A trip is required'],
      index: true
    },

    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      minlength: [2, 'Customer name must contain at least 2 characters'],
      maxlength: [100, 'Customer name cannot exceed 100 characters']
    },

    customerEmail: {
      type: String,
      required: [true, 'Customer email is required'],
      trim: true,
      lowercase: true,
      maxlength: [150, 'Customer email cannot exceed 150 characters'],
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Customer email must be valid'
      ],
      index: true
    },

    numberOfGuests: {
      type: Number,
      required: [true, 'Number of guests is required'],
      min: [1, 'At least one guest is required'],
      max: [20, 'A reservation cannot exceed 20 guests']
    },

    status: {
      type: String,
      required: true,
      enum: {
        values: ['PENDING', 'CONFIRMED', 'CANCELLED'],
        message: 'Reservation status is invalid'
      },
      default: 'CONFIRMED',
      index: true
    },

    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: [0, 'Total price cannot be negative']
    },

    bookedAt: {
      type: Date,
      required: true,
      default: Date.now
    },

    cancelledAt: {
      type: Date,
      default: null
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Reservation notes cannot exceed 500 characters'],
      default: ''
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

/*
 * These compound indexes support common booking-history queries.
 */
reservationSchema.index({
  customerEmail: 1,
  bookedAt: -1
});

reservationSchema.index({
  trip: 1,
  status: 1
});

reservationSchema.index({
  status: 1,
  bookedAt: -1
});

mongoose.model('reservations', reservationSchema);