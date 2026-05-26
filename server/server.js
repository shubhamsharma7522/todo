require('dotenv').config();

const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const cors = require('cors');

const configurePassport = require('./config/passport');
const authRoutes = require('./routes/auth');
const vehicleRoutes = require('./routes/vehicles');
const bookingRoutes = require('./routes/bookings');
const carsRoutes = require('./routes/cars');

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4000';

// MongoDB connection
mongoose
    .connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => {
        console.log('MongoDB connected');
    })
    .catch((err) => {
        console.error('MongoDB connection error', err);
        process.exit(1);
    });

// Middleware
app.use(
    cors({
        origin: FRONTEND_URL,
        credentials: true
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: process.env.MONGODB_URI,
            collectionName: 'sessions',
            ttl: 60 * 60 * 24 * 7 // 7 days
        }),
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 1000 * 60 * 60 * 24 * 7
        }
    })
);

app.use(passport.initialize());
app.use(passport.session());
configurePassport(passport);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api', bookingRoutes);
app.use('/api', carsRoutes);

app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
});

// Lightweight stubs for existing enquiry forms
app.post('/api/contact-enquiry', (_req, res) => res.json({ message: 'Contact enquiry received.' }));
app.post('/api/video-enquiry', (_req, res) => res.json({ message: 'Video enquiry received.' }));
app.post('/api/destination-enquiry', (_req, res) => res.json({ message: 'Destination enquiry received.' }));
app.post('/api/service-enquiry', (_req, res) => res.json({ message: 'Service enquiry received.' }));

// Serve frontend
const publicDir = path.join(__dirname, '..');
app.use(express.static(publicDir));

// Fallback for static file routing (exclude API)
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ message: 'Not found' });
    }
    return res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
