import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { generateOtp, verifyOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";
import { redirect } from "next/navigation";

const providers = [
  CredentialsProvider({
    name: "Email code",
      credentials: {
        name: { label: "Name", type: "text" },
        email: { label: "Email", type: "email" },
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const code = credentials?.code?.trim();
        const name = credentials?.name?.trim();

      if (!email || !code) {
        return null;
      }

      const record = await prisma.verificationCode.findFirst({
        where: { email },
        orderBy: { createdAt: "desc" },
      });

      if (!record || record.expiresAt < new Date()) {
        return null;
      }

      const valid = verifyOtp(code, record.salt, record.codeHash);
      if (!valid) {
        return null;
      }

      await prisma.verificationCode.deleteMany({ where: { email } });

        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          if (!name) {
            return null;
          }
          user = await prisma.user.create({
            data: { email, name },
          });
        } else if (name && !user.name) {
          user = await prisma.user.update({
            where: { email },
            data: { name },
          });
        }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
      };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.unshift(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth",
  },
  providers,
  callbacks: {
    async signIn({ user }) {
      if (!user?.email) return false;
      await prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: { email: user.email, name: user.name, image: user.image },
      });
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });
        token.id = dbUser?.id || user.id;
        token.role =
          dbUser?.role || (user as { role?: string }).role || "CUSTOMER";
        token.name = dbUser?.name || user.name || token.name;
      } else if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
        });
        token.role = dbUser?.role || "CUSTOMER";
        token.id = dbUser?.id;
        token.name = dbUser?.name || token.name;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.name = (token.name as string) || session.user.name;
      }
      return session;
    },
  },
};

export async function requestEmailCode(email: string) {
  const { code, salt, hash, expiresAt } = generateOtp();
  await prisma.verificationCode.deleteMany({ where: { email } });
  await prisma.verificationCode.create({
    data: {
      email,
      codeHash: hash,
      salt,
      expiresAt,
    },
  });
  await sendOtpEmail(email, code);
}

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth");
  }
  return session;
}
