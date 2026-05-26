const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');

const mailEnabled = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

const transporter = mailEnabled
    ? nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
          auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS
          }
      })
    : null;

function computeTotal(pricePerDay, startDate, endDate) {
    const perDay = Number(pricePerDay);
    if (!Number.isFinite(perDay)) return null;
    const msPerDay = 1000 * 60 * 60 * 24;
    const duration = Math.max(1, Math.ceil((endDate - startDate) / msPerDay));
    return perDay * duration;
}

async function sendConfirmationEmail(booking, vehicle) {
    if (!transporter) return;

    const recipient = process.env.BOOKING_NOTIFY_TO || booking.email;
    if (!recipient) return;

    const subject = `New booking: ${booking.vehicleName || 'Vehicle'} (${booking.bookingSource})`;
    const summaryLines = [
        `Vehicle: ${booking.vehicleName || '—'}`,
        `Price/day: ${booking.pricePerDay ? `₹${booking.pricePerDay}` : '—'}`,
        `Dates: ${booking.startDate.toISOString().slice(0, 10)} → ${booking.endDate.toISOString().slice(0, 10)}`,
        `Name: ${booking.userName}`,
        `Email: ${booking.email}`,
        `Phone: ${booking.phone}`,
        booking.notes ? `Notes: ${booking.notes}` : '',
        vehicle && vehicle.brand ? `Brand: ${vehicle.brand}` : ''
    ]
        .filter(Boolean)
        .join('\n');

    try {
        await transporter.sendMail({
            to: recipient,
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            subject,
            text: summaryLines
        });
    } catch (_error) {
        // Fail silently for email transport issues so booking still succeeds
    }
}

async function createBooking(req, res) {
    try {
        const {
            vehicleId,
            vehicleName,
            pricePerDay,
            userName,
            email,
            phone,
            startDate,
            endDate,
            notes,
            bookingSource
        } = req.body || {};

        if (!vehicleId || !userName || !email || !phone || !startDate || !endDate) {
            return res
                .status(400)
                .json({ message: 'vehicleId, userName, email, phone, startDate, and endDate are required.' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
            return res.status(400).json({ message: 'Invalid date range.' });
        }

        let vehicleDoc = null;
        if (mongoose.isValidObjectId(vehicleId)) {
            vehicleDoc = await Vehicle.findById(vehicleId).lean();
        } else {
            vehicleDoc = await Vehicle.findOne({ name: vehicleName }).lean();
        }

        const booking = await Booking.create({
            user: req.user?._id,
            vehicle: vehicleDoc?._id,
            vehicleId,
            vehicleName: vehicleName || vehicleDoc?.name,
            pricePerDay: pricePerDay || vehicleDoc?.pricePerDay,
            userName,
            email,
            phone,
            startDate: start,
            endDate: end,
            notes: notes || '',
            bookingSource: bookingSource || 'form',
            totalPrice: computeTotal(pricePerDay || vehicleDoc?.pricePerDay, start, end),
            status: 'Pending'
        });

        await sendConfirmationEmail(booking, vehicleDoc);

        return res.status(201).json({
            message: 'Booking received. We will confirm shortly.',
            booking
        });
    } catch (error) {
        return res.status(400).json({ message: error.message || 'Could not create booking.' });
    }
}

async function listMyBookings(req, res) {
    const bookings = await Booking.find({ user: req.user._id }).sort('-createdAt');
    res.json({ bookings });
}

module.exports = {
    createBooking,
    listMyBookings
};
