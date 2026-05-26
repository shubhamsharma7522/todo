const express = require('express');
const passport = require('passport');

const router = express.Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: '/signin.html' }),
    (req, res) => {
        const redirectTo = process.env.FRONTEND_URL || '/';
        res.redirect(redirectTo);
    }
);

router.get('/me', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    const { _id, name, email, role, profilePhoto } = req.user;
    return res.json({ user: { _id, name, email, role, profilePhoto } });
});

router.post('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed' });
        }
        req.session.destroy(() => {
            res.clearCookie('connect.sid');
            res.json({ message: 'Logged out' });
        });
    });
});

module.exports = router;
