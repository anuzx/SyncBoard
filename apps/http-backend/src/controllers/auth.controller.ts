import * as arctic from "arctic"
import { github, google } from "../config/oauth.js"
import { Request, Response } from "express"
import { ApiError } from "../utils/ApiError.js"
import { ApiRes } from "../utils/ApiRes.js"
import jwt from "jsonwebtoken"
import { db, oauthAccounts, users } from "@repo/db/client"
import { eq } from "drizzle-orm"

const COOKIE_CONFIG = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 10 * 1000, // 10 minutes — only needed for the OAuth round-trip
}

function signJwt(userId: string) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  })
}

/**
 * Finds an existing user via their OAuth account row, or creates a brand-new
 * user + oauth_account pair atomically.  Returns the user id either way.
 */
async function findOrCreateOAuthUser(opts: {
  provider: "github" | "google"
  providerAccountId: string
  name: string
  email: string | null
}): Promise<string> {
  const { provider, providerAccountId, name, email } = opts

  // 1. Check if an oauth_accounts row already exists for this provider identity
  const [existingOAuth] = await db
    .select()
    .from(oauthAccounts)
    .where(eq(oauthAccounts.providerAccountId, providerAccountId))
    .limit(1)

  if (existingOAuth) {
    // User has signed in before — just return the linked user id
    return existingOAuth.userId
  }

  // 2. No oauth row yet — does a user with this e-mail already exist?
  let userId: string

  if (email) {
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existingUser) {
      // Link this OAuth provider to the already-existing account
      userId = existingUser.id
    } else {
      // 3. Brand-new user — create user row first
      const [newUser] = await db
        .insert(users)
        .values({ name, email })
        .returning({ id: users.id })

      userId = newUser!.id
    }
  } else {
    // No e-mail provided by provider (rare) — always create a fresh user
    const [newUser] = await db
      .insert(users)
      .values({ name, email: null })
      .returning({ id: users.id })

    userId = newUser!.id
  }

  // 4. Create the oauth_accounts row regardless of whether the user was new
  await db.insert(oauthAccounts).values({
    provider,
    providerAccountId,
    userId,
  })

  return userId
}

// ─── GitHub OAuth ───────────────────────────────────────────────────────────

export const githubLogin = (_req: Request, res: Response) => {
  const state = arctic.generateState()
  const url = github.createAuthorizationURL(state, ["user:email"])

  res.cookie("github_oauth_state", state, COOKIE_CONFIG)

  return res.redirect(url.toString())
}

export const githubCallback = async (req: Request, res: Response) => {
  const { code, state } = req.query
  const { github_oauth_state: storedState } = req.cookies

  if (!code || !state || !storedState || state !== storedState) {
    throw new ApiError(400, "Invalid OAuth request")
  }

  let tokens: arctic.OAuth2Tokens

  try {
    tokens = await github.validateAuthorizationCode(code as string)
  } catch (error) {
    throw new ApiError(400, "GitHub auth failed")
  }

  const accessToken = tokens.accessToken()

  // Fetch user profile from GitHub API
  const userResponse = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!userResponse.ok) {
    throw new ApiError(400, "Failed to fetch GitHub user profile")
  }

  const githubUser = (await userResponse.json()) as {
    id: number
    login: string
    name: string | null
    email: string | null
  }

  // If email is not public, fetch from the emails endpoint
  let email = githubUser.email
  if (!email) {
    const emailsResponse = await fetch("https://api.github.com/user/emails", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (emailsResponse.ok) {
      const emails = (await emailsResponse.json()) as {
        email: string
        primary: boolean
        verified: boolean
      }[]
      const primaryEmail = emails.find((e) => e.primary && e.verified)
      email = primaryEmail?.email ?? null
    }
  }

  const userId = await findOrCreateOAuthUser({
    provider: "github",
    providerAccountId: String(githubUser.id),
    name: githubUser.name ?? githubUser.login,
    email,
  })

  const jwtToken = signJwt(userId)

  res.clearCookie("github_oauth_state")

  return res
    .cookie("auth_token", jwtToken, {
      ...COOKIE_CONFIG,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .redirect(`${process.env.FRONTEND_URL}/dashboard`)
}

// ─── Google OAuth ───────────────────────────────────────────────────────────

export const googleLogin = (_req: Request, res: Response) => {
  const state = arctic.generateState()
  const codeVerifier = arctic.generateCodeVerifier()
  const url = google.createAuthorizationURL(state, codeVerifier, [
    "openid",
    "profile",
    "email",
  ])

  res.cookie("google_oauth_state", state, COOKIE_CONFIG)
  res.cookie("google_oauth_verifier", codeVerifier, COOKIE_CONFIG)

  return res.redirect(url.toString())
}

export const googleCallback = async (req: Request, res: Response) => {
  const { code, state } = req.query

  const {
    google_oauth_state: storedState,
    google_oauth_verifier: codeVerifier,
  } = req.cookies

  if (!code || !state || !storedState || !codeVerifier || state !== storedState) {
    throw new ApiError(400, "Invalid OAuth request")
  }

  let tokens: arctic.OAuth2Tokens

  try {
    tokens = await google.validateAuthorizationCode(code as string, codeVerifier)
  } catch (error) {
    throw new ApiError(400, "Google auth failed")
  }

  // The id_token JWT contains the user's profile claims — no extra HTTP call needed
  const claims = arctic.decodeIdToken(tokens.idToken()) as {
    sub: string
    name: string
    email: string
  }

  const { sub: googleUserId, name, email } = claims

  const userId = await findOrCreateOAuthUser({
    provider: "google",
    providerAccountId: googleUserId,
    name,
    email,
  })

  const jwtToken = signJwt(userId)

  res.clearCookie("google_oauth_state")
  res.clearCookie("google_oauth_verifier")

  return res
    .cookie("auth_token", jwtToken, {
      ...COOKIE_CONFIG,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .redirect(`${process.env.FRONTEND_URL}/dashboard`)
}
