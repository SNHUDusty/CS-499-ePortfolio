const home = (req, res) => {
    res.render('travlr', {
        title: 'Travlr Getaways',
        message: 'Welcome to Travlr Getaways',
        packages: [
            {
                name: 'Gale Reef',
                description: 'Experience clear waters, relaxing beaches, and unforgettable views.',
                price: '$799'
            },
            {
                name: 'Dawson Reef',
                description: 'Enjoy a peaceful island getaway with guided tours and ocean adventures.',
                price: '$899'
            },
            {
                name: 'Claire Reef',
                description: 'Book a tropical escape designed for families, couples, and groups.',
                price: '$999'
            }
        ]
    });
};

module.exports = {
    home
};