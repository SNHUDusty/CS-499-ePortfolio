const mongoose = require('mongoose');

require('./app_api/models/travlr');

const Trip = mongoose.model('trips');
const dbURI = 'mongodb://127.0.0.1:27017/travlr';

const migrateTrips = async () => {
  try {
    await mongoose.connect(dbURI);

    const capacityResult = await Trip.updateMany(
      {
        capacity: { $exists: false }
      },
      {
        $set: {
          capacity: 20
        }
      }
    );

    const availableSeatsResult = await Trip.updateMany(
      {
        availableSeats: { $exists: false }
      },
      {
        $set: {
          availableSeats: 20
        }
      }
    );

    const activeResult = await Trip.updateMany(
      {
        active: { $exists: false }
      },
      {
        $set: {
          active: true
        }
      }
    );

    console.log('Trip migration completed.');
    console.log(
      `Capacity fields added: ${capacityResult.modifiedCount}`
    );
    console.log(
      `Available-seat fields added: ${availableSeatsResult.modifiedCount}`
    );
    console.log(
      `Active fields added: ${activeResult.modifiedCount}`
    );
  } catch (error) {
    console.error('Trip migration failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

migrateTrips();