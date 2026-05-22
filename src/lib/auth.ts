import { NextAuthOptions, DefaultSession } from "next-auth";
import { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import bcrypt from "bcryptjs";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}

const providers: NextAuthOptions["providers"] = [
  {
    id: "credentials",
    name: "Credentials",
    type: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        logger.warn("Auth: missing credentials");
        return null;
      }

      const user = await prisma.user.findUnique({
        where: { email: credentials.email as string },
      });

      if (!user || !user.password) {
        logger.warn("Auth: user not found or no password", { email: credentials.email as string });
        return null;
      }

      const isValid = await bcrypt.compare(
        credentials.password as string,
        user.password
      );

      if (!isValid) {
        logger.warn("Auth: invalid password", { email: credentials.email as string });
        return null;
      }

      return { id: user.id, email: user.email, name: user.name };
    },
  },
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  providers.push(
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    })
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.type === "oauth" && user.email) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: { subscription: true },
          });

          if (existingUser) {
            if (!existingUser.avatar && user.image) {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: { avatar: user.image },
              });
            }
            user.id = existingUser.id;
          } else {
            const newUser = await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || null,
                avatar: user.image || null,
                subscription: {
                  create: {
                    plan: "free",
                    status: "active",
                  },
                },
              },
            });
            user.id = newUser.id;
          }
        } catch (error) {
          logger.error("Auth: OAuth sign-in database error", { error });
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
      }
      return session;
    },
  },
};

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  plan: string;
}

export async function getCurrentUser(request: Request): Promise<AuthUser | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  const userId = session.user.id;
  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    plan: user.subscription?.plan || "free",
  };
}
