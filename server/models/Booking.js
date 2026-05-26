const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
        vehicleId: { type: String, required: true },
        vehicleName: { type: String },
        pricePerDay: { type: Number },
        userName: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        notes: { type: String },
        bookingSource: { type: String, enum: ['form', 'whatsapp', 'legacy'], default: 'form' },
        totalPrice: { type: Number },
        status: { type: String, enum: ['Pending', 'Confirmed', 'Cancelled'], default: 'Pending' }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
