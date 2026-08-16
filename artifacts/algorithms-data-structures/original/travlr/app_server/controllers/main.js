const trips = require('../data/trips.json');

const index = (req, res) => {
    res.render('index', {
        title: 'Travlr Getaways'
    });
};

const travel = (req, res) => {
    res.render('travlr', {
        title: 'Travlr Getaways',
        trips
    });
};

module.exports = {
    index,
    travel
};