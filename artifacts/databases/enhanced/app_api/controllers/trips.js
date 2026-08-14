const mongoose = require('mongoose');

const Trip = mongoose.model('trips');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

const ALLOWED_SORT_FIELDS = new Set([
  'code',
  'name',
  'resort',
  'start',
  'length',
  'availableSeats',
  'createdAt',
  'updatedAt'
]);

const ALLOWED_TRIP_FIELDS = new Set([
  'code',
  'name',
  'length',
  'start',
  'resort',
  'perPerson',
  'image',
  'description',
  'capacity',
  'availableSeats',
  'active'
]);

const escapeRegularExpression = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parsePositiveInteger = (value, fallback, maximum = Number.MAX_SAFE_INTEGER) => {
  const parsedValue = Number.parseInt(value, 10);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return fallback;
  }

  return Math.min(parsedValue, maximum);
};

const parseBoolean = (value) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return undefined;
};

const selectAllowedFields = (source) => {
  const selectedFields = {};

  Object.entries(source || {}).forEach(([field, value]) => {
    if (ALLOWED_TRIP_FIELDS.has(field)) {
      selectedFields[field] = value;
    }
  });

  return selectedFields;
};

const normalizeTripInput = (tripData) => {
  const normalizedTrip = { ...tripData };

  if (typeof normalizedTrip.code === 'string') {
    normalizedTrip.code = normalizedTrip.code.trim().toUpperCase();
  }

  const trimmedFields = [
    'name',
    'length',
    'resort',
    'perPerson',
    'image',
    'description'
  ];

  trimmedFields.forEach((field) => {
    if (typeof normalizedTrip[field] === 'string') {
      normalizedTrip[field] = normalizedTrip[field].trim();
    }
  });

  return normalizedTrip;
};

const buildTripFilter = (queryParameters) => {
  const filter = {};

  const search = String(queryParameters.search || '').trim();

  if (search) {
    const searchExpression = new RegExp(
      escapeRegularExpression(search),
      'i'
    );

    filter.$or = [
      { code: searchExpression },
      { name: searchExpression },
      { resort: searchExpression },
      { description: searchExpression }
    ];
  }

  if (queryParameters.resort) {
    filter.resort = new RegExp(
      `^${escapeRegularExpression(
        String(queryParameters.resort).trim()
      )}$`,
      'i'
    );
  }

  if (queryParameters.startDate || queryParameters.endDate) {
    filter.start = {};

    if (queryParameters.startDate) {
      const startDate = new Date(queryParameters.startDate);

      if (!Number.isNaN(startDate.getTime())) {
        filter.start.$gte = startDate;
      }
    }

    if (queryParameters.endDate) {
      const endDate = new Date(queryParameters.endDate);

      if (!Number.isNaN(endDate.getTime())) {
        filter.start.$lte = endDate;
      }
    }

    if (Object.keys(filter.start).length === 0) {
      delete filter.start;
    }
  }

  const active = parseBoolean(queryParameters.active);

  if (active !== undefined) {
    filter.active = active;
  }

  if (queryParameters.minSeats !== undefined) {
    const minimumSeats = Number.parseInt(queryParameters.minSeats, 10);

    if (Number.isInteger(minimumSeats) && minimumSeats >= 0) {
      filter.availableSeats = {
        $gte: minimumSeats
      };
    }
  }

  return filter;
};

const buildSort = (queryParameters) => {
  const requestedField = String(queryParameters.sortBy || 'name');
  const sortField = ALLOWED_SORT_FIELDS.has(requestedField)
    ? requestedField
    : 'name';

  const sortDirection =
    String(queryParameters.order || 'asc').toLowerCase() === 'desc'
      ? -1
      : 1;

  return {
    [sortField]: sortDirection,
    code: 1
  };
};

const sendDatabaseError = (res, error) => {
  if (error?.code === 11000) {
    return res.status(409).json({
      message: 'A trip with that code already exists.',
      field: 'code'
    });
  }

  if (error?.name === 'ValidationError') {
    const validationErrors = Object.values(error.errors).map(
      (validationError) => ({
        field: validationError.path,
        message: validationError.message
      })
    );

    return res.status(400).json({
      message: 'Trip validation failed.',
      errors: validationErrors
    });
  }

  if (error?.name === 'CastError') {
    return res.status(400).json({
      message: `Invalid value supplied for ${error.path}.`
    });
  }

  console.error('Trip database error:', error);

  return res.status(500).json({
    message: 'An unexpected database error occurred.'
  });
};

const tripsList = async (req, res) => {
  try {
    const page = parsePositiveInteger(
      req.query.page,
      DEFAULT_PAGE
    );

    const limit = parsePositiveInteger(
      req.query.limit,
      DEFAULT_LIMIT,
      MAX_LIMIT
    );

    const skip = (page - 1) * limit;
    const filter = buildTripFilter(req.query);
    const sort = buildSort(req.query);

    const [trips, totalTrips] = await Promise.all([
      Trip.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),

      Trip.countDocuments(filter).exec()
    ]);

    const totalPages = Math.max(
      1,
      Math.ceil(totalTrips / limit)
    );

    /*
     * Pagination details are returned in response headers so the existing
     * Angular client can continue receiving a Trip[] response body.
     */
    res.set({
      'X-Total-Count': String(totalTrips),
      'X-Page': String(page),
      'X-Limit': String(limit),
      'X-Total-Pages': String(totalPages)
    });

    return res.status(200).json(trips);
  } catch (error) {
    return sendDatabaseError(res, error);
  }
};

const tripsFindByCode = async (req, res) => {
  try {
    const tripCode = String(req.params.tripCode)
      .trim()
      .toUpperCase();

    const trip = await Trip.findOne({
      code: tripCode
    })
      .lean()
      .exec();

    if (!trip) {
      return res.status(404).json({
        message: 'Trip not found.'
      });
    }

    return res.status(200).json(trip);
  } catch (error) {
    return sendDatabaseError(res, error);
  }
};

const tripsAddTrip = async (req, res) => {
  try {
    const allowedFields = selectAllowedFields(req.body);
    const normalizedTrip = normalizeTripInput(allowedFields);

    const newTrip = await Trip.create(normalizedTrip);

    return res.status(201).json(newTrip);
  } catch (error) {
    return sendDatabaseError(res, error);
  }
};

const tripsUpdateTrip = async (req, res) => {
  try {
    const currentTripCode = String(req.params.tripCode)
      .trim()
      .toUpperCase();

    const allowedFields = selectAllowedFields(req.body);
    const normalizedUpdates = normalizeTripInput(allowedFields);

    /*
     * The trip code is used as the stable identifier in the route.
     * Prevent accidental changes to that identifier during an update.
     */
    delete normalizedUpdates.code;

    const updatedTrip = await Trip.findOneAndUpdate(
      {
        code: currentTripCode
      },
      {
        $set: normalizedUpdates
      },
      {
        new: true,
        runValidators: true,
        context: 'query'
      }
    ).exec();

    if (!updatedTrip) {
      return res.status(404).json({
        message: 'Trip not found.'
      });
    }

    return res.status(200).json(updatedTrip);
  } catch (error) {
    return sendDatabaseError(res, error);
  }
};

const tripsDeleteTrip = async (req, res) => {
  try {
    const tripCode = String(req.params.tripCode)
      .trim()
      .toUpperCase();

    const deletedTrip = await Trip.findOneAndDelete({
      code: tripCode
    }).exec();

    if (!deletedTrip) {
      return res.status(404).json({
        message: 'Trip not found.'
      });
    }

    return res.status(204).send();
  } catch (error) {
    return sendDatabaseError(res, error);
  }
};

module.exports = {
  tripsList,
  tripsFindByCode,
  tripsAddTrip,
  tripsUpdateTrip,
  tripsDeleteTrip
};