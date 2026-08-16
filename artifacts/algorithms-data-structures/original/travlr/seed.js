const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

require('./app_api/models/travlr');

const Trip = mongoose.model('trips');
const dbURI = 'mongodb://127.0.0.1:27017/travlr';

const seedTrips = async () => {
  try {
    await mongoose.connect(dbURI);

    const tripsPath = path.join(__dirname, 'app_server', 'data', 'trips.json');
    const trips = JSON.parse(fs.readFileSync(tripsPath, 'utf8'));

    await Trip.deleteMany({});
    await Trip.insertMany(trips);

    console.log(`${trips.length} trips inserted successfully.`);
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await mongoose.connection.close();
  }
};

seedTrips();