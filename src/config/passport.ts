import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from '../lib/prisma.js';
import { env } from '../lib/env.js';
import { Role } from '@prisma/client';

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('No email found from Google'));
          }

          let user = await prisma.user.findUnique({
            where: { email },
          });

          if (user) {
            // Link google ID if it exists but wasn't linked
            if (!user.googleId) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: { googleId: profile.id },
              });
            }
            return done(null, user);
          }

          // We can no longer auto-create users via Google login because a meterNumber is mandatory.
          // They must register normally first, then they can use Google to log in later.
          return done(null, false, { message: 'User not found. Please register with your meter number first before using Google Login.' } as any);
        } catch (error) {
          done(error as Error);
        }
      },
    ),
  );
}
