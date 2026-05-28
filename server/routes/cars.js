const express = require('express');
const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');

const router = express.Router();

// Fallback mapping to resolve legacy JSON IDs (e.g. 'sports-1') to seeded DB records
const legacyIdMap = {
    'sports-1': 'Porsche 718 Red',
    'sports-2': 'MG Cyberster',
    'lux-1': 'Mercedes Benz E220d',
    'lux-2': 'Mercedes Benz S Class',
    'lux-3': 'Audi A6 Sedan',
    'lux-4': 'Porsche 718',
    'lux-5': 'Mercedes Benz E Class',
    'budget-1': 'Honda City',
    'budget-2': 'Honda Amaze',
    'budget-3': 'Hyundai Verna',
    'budget-4': 'Maruti Suzuki Ciaz',
    'budget-5': 'Hyundai Aura',
    'budget-6': 'Tata Tigor',
    'suv-1': 'Toyota Fortuner',
    'suv-2': 'Toyota Innova',
    'suv-3': 'Mahindra XUV700',
    'suv-4': 'Tata Safari',
    'suv-5': 'Hyundai Creta',
    'bus-1': 'Volvo Tourist Bus'
};

function computeTotal(pricePerDay, startDate, endDate) {
    const perDay = Number(pricePerDay);
    if (!Number.isFinite(perDay)) return 0;
    const msPerDay = 1000 * 60 * 60 * 24;
    const duration = Math.max(1, Math.ceil((endDate - startDate) / msPerDay));
    return perDay * duration;
}

// Convert Mongoose documents into plain objects with custom id mappings to avoid breaking legacy frontend fields
function mapVehicleToLegacyFormat(vehicle) {
    const doc = vehicle.toObject ? vehicle.toObject() : vehicle;
    return {
        ...doc,
        id: doc._id.toString() // Map MongoDB _id to standard 'id' to ensure frontend elements do not break
    };
}

// GET /api/cars
router.get('/cars', async (_req, res) => {
    try {
        const vehicles = await Vehicle.find({ available: true }).sort({ createdAt: -1 });
        const legacyFormatCars = vehicles.map(mapVehicleToLegacyFormat);
        res.json({ cars: legacyFormatCars });
    } catch (error) {
        console.error('Failed to load cars:', error);
        res.status(500).json({ message: 'Failed to load cars' });
    }
});

// GET /api/cars/:category
router.get('/cars/:category', async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ category: req.params.category, available: true }).sort({ createdAt: -1 });
        const legacyFormatCars = vehicles.map(mapVehicleToLegacyFormat);
        res.json({ cars: legacyFormatCars });
    } catch (error) {
        console.error('Failed to load filtered cars:', error);
        res.status(500).json({ message: 'Failed to load cars for category' });
    }
});

// POST /api/booking (Legacy / Fallback endpoint)
router.post('/booking', async (req, res) => {
    try {
        const { carId, customerName, customerEmail, customerPhone, startDate, endDate, notes } = req.body;

        if (!carId || !customerName || !startDate || !endDate) {
            return res.status(400).json({ message: 'carId, customerName, startDate, and endDate are required.' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
            return res.status(400).json({ message: 'Invalid date range.' });
        }

        // Resolving the vehicle by legacy ID or MongoDB ObjectId
        let vehicleDoc = null;
        if (mongoose.isValidObjectId(carId)) {
            vehicleDoc = await Vehicle.findById(carId);
        } else if (legacyIdMap[carId]) {
            vehicleDoc = await Vehicle.findOne({ name: legacyIdMap[carId] });
        }

        const pricePerDay = vehicleDoc ? vehicleDoc.pricePerDay : 0;
        const vehicleName = vehicleDoc ? vehicleDoc.name : 'Unknown Vehicle';

        // Saving booking details into MongoDB collection asynchronously
        const bookingDoc = await Booking.create({
            user: req.user ? req.user._id : undefined,
            vehicle: vehicleDoc ? vehicleDoc._id : undefined,
            vehicleId: carId,
            vehicleName,
            pricePerDay,
            userName: customerName,
            email: customerEmail || '',
            phone: customerPhone || '',
            startDate: start,
            endDate: end,
            notes: notes || '',
            bookingSource: 'legacy',
            totalPrice: computeTotal(pricePerDay, start, end),
            status: 'Pending'
        });

        // Match original response schema exactly to prevent breaking existing API consumers
        return res.status(201).json({
            booking: {
                id: bookingDoc._id.toString(),
                carId,
                customerName,
                customerEmail: bookingDoc.email,
                customerPhone: bookingDoc.phone,
                startDate: startDate,
                endDate: endDate,
                notes: bookingDoc.notes,
                createdAt: bookingDoc.createdAt.toISOString(),
                status: bookingDoc.status
            }
        });
    } catch (error) {
        console.error('Failed to save legacy booking:', error);
        return res.status(500).json({ message: error.message || 'Could not save booking' });
    }
});

module.exports = router;
