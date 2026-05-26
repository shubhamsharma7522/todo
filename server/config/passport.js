const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

module.exports = function configurePassport(passport) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: `${process.env.BASE_URL}/api/auth/google/callback`
            },
            async (_accessToken, _refreshToken, profile, done) => {
                try {
                    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
                    if (!email) {
                        return done(null, false, { message: 'Google account has no email.' });
                    }

                    const googleId = profile.id;
                    const name = profile.displayName || 'Google User';
                    const profilePhoto =
                        profile.photos && profile.photos[0] ? profile.photos[0].value : 'https://placehold.co/200x200';

                    let user = await User.findOne({ googleId });

                    if (!user) {
                        // fallback: match by email if exists already
                        user = await User.findOne({ email });
                    }

                    if (user) {
                        user.googleId = googleId;
                        user.profilePhoto = profilePhoto;
                        user.name = user.name || name;
                        await user.save();
                    } else {
                        user = await User.create({
                            name,
                            email,
                            googleId,
                            profilePhoto,
                            role: 'user'
                        });
                    }

                    return done(null, user);
                } catch (error) {
                    return done(error, null);
                }
            }
        )
    );

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    });
};
