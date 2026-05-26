const path = require('path');
const fs = require('fs');
const express = require('express');

const router = express.Router();
const carsFile = path.join(__dirname, '..', 'data', 'cars.json');
const bookingsFile = path.join(__dirname, '..', 'data', 'bookings.json');

function readCars() {
    const raw = fs.readFileSync(carsFile, 'utf-8');
    return JSON.parse(raw);
}

function appendBooking(booking) {
    let bookings = [];
    if (fs.existsSync(bookingsFile)) {
        bookings = JSON.parse(fs.readFileSync(bookingsFile, 'utf-8'));
    }
    bookings.push(booking);
    fs.writeFileSync(bookingsFile, JSON.stringify(bookings, null, 2), 'utf-8');
}

router.get('/cars', (_req, res) => {
    const cars = readCars();
    res.json({ cars });
});

router.get('/cars/:category', (req, res) => {
    const cars = readCars();
    const filtered = cars.filter((car) => car.category === req.params.category);
    res.json({ cars: filtered });
});

router.post('/booking', (req, res) => {
    const { carId, customerName, customerEmail, customerPhone, startDate, endDate, notes } = req.body;

    if (!carId || !customerName || !startDate || !endDate) {
        return res.status(400).json({ message: 'carId, customerName, startDate, and endDate are required.' });
    }

    const booking = {
        id: `bk-${Date.now()}`,
        carId,
        customerName,
        customerEmail,
        customerPhone,
        startDate,
        endDate,
        notes: notes || '',
        createdAt: new Date().toISOString(),
        status: 'Pending'
    };

    appendBooking(booking);
    return res.status(201).json({ booking });
});

module.exports = router;
