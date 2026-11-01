import type { NextFunction, Request, Response } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";

export type AuthUser = {
  id: string;
  email: string;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const authUrl = (process.env.AUTH_URL || "http://localhost:3000").replace(
  /\/$/,
  ""
);

// Public keys published by Better Auth. jose caches them, so this is fast.
const jwks = createRemoteJWKSet(new URL(`${authUrl}/api/auth/jwks`));

export async function verifyJwt(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized: token is missing" });
    return;
  }

  try {
    const { payload } = await jwtVerify(header.slice(7), jwks, {
      issuer: authUrl,
      audience: authUrl,
    });

    const email = typeof payload.email === "string" ? payload.email : "";
    if (!email) {
      res.status(401).json({ message: "Unauthorized: token has no email" });
      return;
    }

    req.user = {
      id: String(payload.id ?? payload.sub ?? ""),
      email,
    };
    next();
  } catch {
    res
      .status(401)
      .json({ message: "Unauthorized: token is invalid or expired" });
  }
}