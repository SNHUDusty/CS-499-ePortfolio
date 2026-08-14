const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const ctrlTrips = require('../controllers/trips');
const ctrlAuth = require('../controllers/authentication');
const ctrlReservations = require('../controllers/reservations');

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: 'Authorization header missing'
    });
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      message: 'Bearer token missing or malformed'
    });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || 'travlr-secret',
    (err, user) => {
      if (err) {
        return res.status(401).json({
          message: 'Unauthorized'
        });
      }

      req.user = user;
      next();
    }
  );
};

router.post('/register', ctrlAuth.register);
router.post('/login', ctrlAuth.login);

router
  .route('/trips')
  .get(ctrlTrips.tripsList)
  .post(auth, ctrlTrips.tripsAddTrip);

router
  .route('/trips/:tripCode')
  .get(ctrlTrips.tripsFindByCode)
  .put(auth, ctrlTrips.tripsUpdateTrip)
  .delete(auth, ctrlTrips.tripsDeleteTrip);

router
  .route('/reservations')
  .get(auth, ctrlReservations.reservationsList)
  .post(auth, ctrlReservations.reservationCreate);

router
  .route('/reservations/:confirmationCode')
  .get(auth, ctrlReservations.reservationFindByConfirmation);

router
  .route('/reservations/:confirmationCode/cancel')
  .put(auth, ctrlReservations.reservationCancel);

module.exports = router;