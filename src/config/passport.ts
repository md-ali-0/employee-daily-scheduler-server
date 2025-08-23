import { PrismaClient } from "@prisma/client"
import passport from "passport"
import { Strategy as GoogleStrategy } from "passport-google-oauth20"
import env from "./env"

const prisma = new PrismaClient()

// Serialize user for the session
passport.serializeUser((user: any, done) => {
  done(null, user.id)
})

// Deserialize user from the session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    })
    done(null, user)
  } catch (error) {
    done(error, null)
  }
})

// Google OAuth Strategy
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_REDIRECT_URI || "/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists
          let user = await prisma.user.findUnique({
            where: { googleId: profile.id },
          })

          if (!user) {
            // Create new user
            user = await prisma.user.create({
              data: {
                googleId: profile.id,
                email: profile.emails?.[0]?.value || "",
                name: profile.displayName || "",
                role: "USER",
              },
            })
          }

          return done(null, user)
        } catch (error) {
          return done(error, undefined)
        }
      }
    )
  )
}

export default passport 