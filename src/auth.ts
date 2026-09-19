import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const allowedEmail = process.env.AUTH_ALLOWED_EMAIL?.trim().toLowerCase();

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    signIn({ profile }) {
      if (!allowedEmail) {
        return true;
      }
      const email = profile?.email?.toLowerCase();
      return email === allowedEmail;
    },
  },
});
