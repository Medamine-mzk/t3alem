import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "STUDENT" | "TEACHER" | "ADMIN";
      username: string;
      firstName: string;
      lastName: string;
      className: string | null;
      specialization: string | null;
      forcePasswordChange: boolean;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    role: "STUDENT" | "TEACHER" | "ADMIN";
    username: string;
    firstName: string;
    lastName: string;
    className: string | null;
    specialization: string | null;
    forcePasswordChange: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: "STUDENT" | "TEACHER" | "ADMIN";
    username: string;
    firstName: string;
    lastName: string;
    className: string | null;
    specialization: string | null;
    forcePasswordChange: boolean;
  }
}
