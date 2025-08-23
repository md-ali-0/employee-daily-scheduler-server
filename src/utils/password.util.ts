import bcrypt from "bcryptjs"
import { InternalServerError } from "@core/error.classes"
import i18n from "@config/i18n-compat"

const SALT_ROUNDS = 10 // Recommended salt rounds for bcrypt

/**
 * Hashes a plain text password.
 * @param password The plain text password to hash.
 * @returns The hashed password.
 * @throws {InternalServerError} If hashing fails.
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS)
    const hashedPassword = await bcrypt.hash(password, salt)
    return hashedPassword
  } catch (error) {
    throw new InternalServerError(i18n.__("errors.password_hashing_failed"), "password.hashing_failed")
  }
}

/**
 * Compares a plain text password with a hashed password.
 * @param plainPassword The plain text password.
 * @param hashedPassword The hashed password to compare against.
 * @returns True if passwords match, false otherwise.
 * @throws {InternalServerError} If comparison fails.
 */
export const comparePasswords = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword)
  } catch (error) {
    throw new InternalServerError(i18n.__("errors.password_comparison_failed"), "password.comparison_failed")
  }
}
