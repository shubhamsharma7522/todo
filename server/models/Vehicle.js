const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        brand: { type: String, required: true },
        category: {
            type: String,
            enum: ['sedan', 'mini-bus', 'traveller'],
            required: true
        },
        fuelType: { type: String, required: true },
        transmission: { type: String, required: true },
        seats: { type: Number, required: true },
        color: { type: String },
        pricePerDay: { type: Number, required: true },
        image: { type: String },
        description: { type: String },
        travelUsage: { type: String },
        comfortFeatures: { type: String },
        suitableTravelType: { type: String },
        available: { type: Boolean, default: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Vehicle', vehicleSchema);
