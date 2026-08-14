const mongoose = require('mongoose');

const dbURI = 'mongodb://127.0.0.1:27017/travlr';

mongoose.connect(dbURI);

mongoose.connection.on('connected', () => {
    console.log(`Mongoose connected to ${dbURI}`);
});

mongoose.connection.on('error', err => {
    console.log(`Mongoose connection error: ${err}`);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected');
});

require('./travlr');
require('./users');

module.exports = mongoose;