
import { UserModel } from "@modules/user/user.model"
import passport from "passport"
import { Strategy as GoogleStrategy } from "passport-google-oauth20"
import env from "./env"

// Serialize user for the session
passport.serializeUser((user: any, done) => {
  done(null, user.id)
})

// Deserialize user from the session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await UserModel.findById(id)
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
          let user = await UserModel.findOne({
            googleId: profile.id,
          })

          if (!user) {
            // Create new user
            user = await UserModel.create({
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