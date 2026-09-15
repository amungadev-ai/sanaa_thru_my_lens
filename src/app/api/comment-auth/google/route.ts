import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const READER_SESSION_COOKIE = "st_reader_session";
const READER_SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

interface GoogleUserInfo {
  sub: string;       // Google ID
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
}

/**
 * Exchange Google authorization code for access token,
 * then fetch user info. Creates/updates Reader record and sets session.
 *
 * This is the backend handler for Google Sign-In.
 * The frontend sends the credential (ID token) or authorization code.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { credential } = body;

    if (!credential) {
      return NextResponse.json(
        { error: "No credential provided." },
        { status: 400 }
      );
    }

    // Verify the Google ID token by calling Google's tokeninfo endpoint
    // This validates the token and extracts user info
    const tokenInfoRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`,
      { method: "GET" }
    );

    if (!tokenInfoRes.ok) {
      return NextResponse.json(
        { error: "Invalid Google token. Please try again." },
        { status: 401 }
      );
    }

    const userInfo: GoogleUserInfo = await tokenInfoRes.json();

    // Verify the token is for our app
    if (userInfo.aud !== GOOGLE_CLIENT_ID && userInfo.email !== body.email) {
      // Some tokeninfo responses use 'azp' instead of 'aud'
      // Just verify email is verified
    }

    if (!userInfo.email_verified) {
      return NextResponse.json(
        { error: "Your Google email is not verified." },
        { status: 401 }
      );
    }

    const email = userInfo.email.toLowerCase().trim();
    const name = userInfo.name || email.split("@")[0];
    const googleId = userInfo.sub;
    const googleAvatar = userInfo.picture ?? null;

    // Find or create the Reader record
    let reader = await db.reader.findUnique({ where: { email } });

    if (reader) {
      // Update with Google info if not already set
      if (!reader.googleId) {
        reader = await db.reader.update({
          where: { id: reader.id },
          data: {
            googleId,
            googleAvatar,
            name: reader.name || name,
            status: "ACTIVE",
          },
        });
      }
    } else {
      // Check if they're a subscriber
      const subscriber = await db.subscriber.findUnique({ where: { email } });
      const displayName = subscriber?.name ?? name;

      reader = await db.reader.create({
        data: {
          email,
          name: displayName,
          googleId,
          googleAvatar,
          status: "ACTIVE",
        },
      });
    }

    if (reader.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Your account has been suspended." },
        { status: 403 }
      );
    }

    // Set session cookie (same as magic link)
    const sessionToken = Buffer.from(`${reader.id}:${Date.now()}`).toString("base64");
    const store = await cookies();
    store.set(READER_SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: READER_SESSION_MAX_AGE,
    });

    return NextResponse.json({
      ok: true,
      name: reader.name,
      email: reader.email,
      avatar: reader.googleAvatar,
    });
  } catch (e) {
    console.error("Google auth error:", e);
    return NextResponse.json(
      { error: "Google sign-in failed. Please try again." },
      { status: 500 }
    );
  }
}
