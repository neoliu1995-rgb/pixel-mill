import NextAuth from "next-auth";

const { handler } = NextAuth({
  providers: [
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
          return null;
        }

        const mockUsers = [
          { id: "1", email: "demo@pixelmill.com", password: "demo123", name: "Demo User" },
        ];

        const user = mockUsers.find(
          (u) => u.email === credentials.email && u.password === credentials.password
        );

        if (user) {
          return { id: user.id, email: user.email, name: user.name };
        }

        if (credentials.email && credentials.password.length >= 6) {
          return {
            id: Date.now().toString(),
            email: credentials.email as string,
            name: (credentials.email as string).split("@")[0],
          };
        }

        return null;
      },
    },
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
