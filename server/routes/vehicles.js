const express = require('express');
const Vehicle = require('../models/Vehicle');
const { ensureAdmin } = require('../middleware/auth');

const router = express.Router();

// Public: list vehicles (optional category filter)
router.get('/', async (req, res) => {
    try {
        const { category } = req.query;
        const filter = category ? { category } : {};
        const vehicles = await Vehicle.find(filter).sort({ createdAt: -1 });
        res.json({ vehicles });
    } catch (error) {
        res.status(500).json({ message: 'Failed to load vehicles' });
    }
});

// Admin: add vehicle
router.post('/add', ensureAdmin, async (req, res) => {
    try {
        const vehicle = await Vehicle.create(req.body);
        res.status(201).json({ vehicle });
    } catch (error) {
        res.status(400).json({ message: error.message || 'Could not add vehicle' });
    }
});

// Admin: update vehicle
router.patch('/:id', ensureAdmin, async (req, res) => {
    try {
        const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }
        res.json({ vehicle });
    } catch (error) {
        res.status(400).json({ message: error.message || 'Could not update vehicle' });
    }
});

// Admin: delete vehicle
router.delete('/:id', ensureAdmin, async (req, res) => {
    try {
        const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }
        res.json({ message: 'Vehicle deleted' });
    } catch (error) {
        res.status(400).json({ message: error.message || 'Could not delete vehicle' });
    }
});

module.exports = router;
