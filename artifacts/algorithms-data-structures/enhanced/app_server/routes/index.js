const express = require('express');
const router = express.Router();

const ctrlMain = require('../controllers/main');

router.get('/', ctrlMain.index);
router.get('/travel', ctrlMain.travel);

module.exports = router;