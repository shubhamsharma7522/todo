const express = require('express');
const { createBooking, listMyBookings } = require('../controllers/bookingController');
const { ensureAuthenticated } = require('../middleware/auth');

const router = express.Router();

router.post('/bookings', createBooking);
router.post('/book', ensureAuthenticated, createBooking); // legacy authenticated route
router.get('/my', ensureAuthenticated, listMyBookings);
router.get('/my-bookings', ensureAuthenticated, listMyBookings);

module.exports = router;
