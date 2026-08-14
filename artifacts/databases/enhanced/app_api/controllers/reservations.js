const crypto = require('crypto');
const mongoose = require('mongoose');

const Trip = mongoose.model('trips');
const Reservation = mongoose.model('reservations');

const createConfirmationCode = () =>
  `TRV-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

const parsePrice = (value) => {
  const normalizedValue = String(value || '').replace(/[$,\s]/g, '');
  const parsedValue = Number.parseFloat(normalizedValue);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const sendReservationError = (res, error) => {
  if (error?.code === 11000) {
    return res.status(409).json({
      message: 'A reservation with that confirmation code already exists.'
    });
  }

  if (error?.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((validationError) => ({
      field: validationError.path,
      message: validationError.message
    }));

    return res.status(400).json({
      message: 'Reservation validation failed.',
      errors
    });
  }

  if (error?.name === 'CastError') {
    return res.status(400).json({
      message: 'An invalid database identifier was supplied.'
    });
  }

  console.error('Reservation database error:', error);

  return res.status(500).json({
    message: 'An unexpected reservation database error occurred.'
  });
};

const reservationsList = async (req, res) => {
  try {
    const filter = {};

    if (req.query.email) {
      filter.customerEmail = String(req.query.email)
        .trim()
        .toLowerCase();
    }

    if (req.query.status) {
      filter.status = String(req.query.status)
        .trim()
        .toUpperCase();
    }

    const reservations = await Reservation.find(filter)
      .populate(
        'trip',
        'code name resort start perPerson capacity availableSeats active'
      )
      .sort({ bookedAt: -1 })
      .lean()
      .exec();

    return res.status(200).json(reservations);
  } catch (error) {
    return sendReservationError(res, error);
  }
};

const reservationFindByConfirmation = async (req, res) => {
  try {
    const confirmationCode = String(req.params.confirmationCode)
      .trim()
      .toUpperCase();

    const reservation = await Reservation.findOne({
      confirmationCode
    })
      .populate(
        'trip',
        'code name resort start perPerson capacity availableSeats active'
      )
      .lean()
      .exec();

    if (!reservation) {
      return res.status(404).json({
        message: 'Reservation not found.'
      });
    }

    return res.status(200).json(reservation);
  } catch (error) {
    return sendReservationError(res, error);
  }
};

const reservationCreate = async (req, res) => {
  let reservedTrip = null;
  let guestCount = 0;

  try {
    const {
      tripCode,
      customerName,
      customerEmail,
      numberOfGuests,
      notes
    } = req.body;

    if (
      !tripCode ||
      !customerName ||
      !customerEmail ||
      numberOfGuests === undefined
    ) {
      return res.status(400).json({
        message:
          'Trip code, customer name, customer email, and number of guests are required.'
      });
    }

    guestCount = Number.parseInt(numberOfGuests, 10);

    if (!Number.isInteger(guestCount) || guestCount < 1) {
      return res.status(400).json({
        message: 'Number of guests must be a positive whole number.'
      });
    }

    const normalizedTripCode = String(tripCode)
      .trim()
      .toUpperCase();

    /*
     * This query atomically verifies availability and decreases the seat
     * count. Two simultaneous bookings cannot reserve the same last seats.
     */
    reservedTrip = await Trip.findOneAndUpdate(
      {
        code: normalizedTripCode,
        active: true,
        availableSeats: {
          $gte: guestCount
        }
      },
      {
        $inc: {
          availableSeats: -guestCount
        }
      },
      {
        new: true,
        runValidators: true
      }
    ).exec();

    if (!reservedTrip) {
      const tripExists = await Trip.exists({
        code: normalizedTripCode,
        active: true
      });

      if (!tripExists) {
        return res.status(404).json({
          message: 'Active trip not found.'
        });
      }

      const trip = await Trip.findOne({
        code: normalizedTripCode
      })
        .select('availableSeats')
        .lean()
        .exec();

      return res.status(409).json({
        message: 'The selected trip does not have enough available seats.',
        availableSeats: trip?.availableSeats ?? 0
      });
    }

    const pricePerPerson = parsePrice(reservedTrip.perPerson);
    const totalPrice = pricePerPerson * guestCount;

    let reservation;

    try {
      reservation = await Reservation.create({
        confirmationCode: createConfirmationCode(),
        trip: reservedTrip._id,
        customerName: String(customerName).trim(),
        customerEmail: String(customerEmail).trim().toLowerCase(),
        numberOfGuests: guestCount,
        totalPrice,
        notes: typeof notes === 'string' ? notes.trim() : ''
      });
    } catch (error) {
      /*
       * Roll back the seat reduction if the reservation document cannot
       * be created.
       */
      await Trip.findByIdAndUpdate(reservedTrip._id, {
        $inc: {
          availableSeats: guestCount
        }
      }).exec();

      throw error;
    }

    const populatedReservation = await Reservation.findById(
      reservation._id
    )
      .populate(
        'trip',
        'code name resort start perPerson capacity availableSeats active'
      )
      .lean()
      .exec();

    return res.status(201).json(populatedReservation);
  } catch (error) {
    return sendReservationError(res, error);
  }
};

const reservationCancel = async (req, res) => {
  try {
    const confirmationCode = String(req.params.confirmationCode)
      .trim()
      .toUpperCase();

    /*
     * Only a reservation that is not already cancelled can be updated.
     * This prevents seats from being restored more than once.
     */
    const reservation = await Reservation.findOneAndUpdate(
      {
        confirmationCode,
        status: {
          $ne: 'CANCELLED'
        }
      },
      {
        $set: {
          status: 'CANCELLED',
          cancelledAt: new Date()
        }
      },
      {
        new: true,
        runValidators: true
      }
    ).exec();

    if (!reservation) {
      const existingReservation = await Reservation.findOne({
        confirmationCode
      })
        .select('status')
        .lean()
        .exec();

      if (!existingReservation) {
        return res.status(404).json({
          message: 'Reservation not found.'
        });
      }

      return res.status(409).json({
        message: 'Reservation has already been cancelled.'
      });
    }

    const trip = await Trip.findById(reservation.trip).exec();

    if (trip) {
      trip.availableSeats = Math.min(
        trip.capacity,
        trip.availableSeats + reservation.numberOfGuests
      );

      await trip.save();
    }

    const populatedReservation = await Reservation.findById(
      reservation._id
    )
      .populate(
        'trip',
        'code name resort start perPerson capacity availableSeats active'
      )
      .lean()
      .exec();

    return res.status(200).json({
      message: 'Reservation cancelled successfully.',
      reservation: populatedReservation
    });
  } catch (error) {
    return sendReservationError(res, error);
  }
};

module.exports = {
  reservationsList,
  reservationFindByConfirmation,
  reservationCreate,
  reservationCancel
};