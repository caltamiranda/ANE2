import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const {handlers, signIn, signOut, auth } = NextAuth({
    adapter: PrismaAdapter(prisma),
    pages: {
        signIn: '/auth/signIn',
    },
    session: {
        strategy: "jwt",
        maxAge: 15 * 60,
        updateAge: 5 * 60,
    },
    providers: [
        MicrosoftEntraID({
            clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
            tenantId: process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID,
            clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
            authorization: {
                url: `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID}/oauth2/v2.0/authorize`,
                params: {
                  scope: 'openid profile email',
                  prompt: 'login',
                },
              },
              token: `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID}/oauth2/v2.0/token`,
              userinfo: `https://graph.microsoft.com/oidc/userinfo`, // Endpoint de información de usuario
            }),
            Credentials({
              async authorize(credentials) {
                  let user = null;
                  const { email, password } = credentials;
                  user = await prisma.user.findFirst({
                      where: {
                          email: email,
                      }
                  });
                  if (user && bcrypt.compareSync(password, user.password)) {
                      // Contraseña correcta, retorna el usuario
                      return user;
                  } else {
                      // Contraseña incorrecta o usuario no encontrado
                      throw new Error("User not found.")
                  }
              }
            }),
    ],
    secret: process.env.AUTH_SECRET,
    trustHost: [process.env.AUTH_URL, 'http://localhost:3000',"https://yellow-mud-0b1369c0f.5.azurestaticapps.net"],
    callbacks: {
        authorized: (params) => {
            return !!params.auth?.user
        },
        jwt({ token, user }) {
            if (user) { // User is available during sign-in
              token.id = user.id
            }
            return token
          },
        session({ session, token }) {
          session.user.id = token.id
          return session
        },
        async signIn({ user, account, profile, email, credentials }) {
          if (account.provider === "microsoft-entra-id") {
              // Verificar si ya existe un usuario con el mismo correo
              const existingUser = await prisma.user.findUnique({
                  where: { email: user.email },
              });
              if (existingUser) {
                  // Vincula la cuenta con el usuario existente si no está ya vinculada
                  await prisma.account.upsert({
                      where: {
                          provider_providerAccountId: {
                              provider: account.provider,
                              providerAccountId: account.providerAccountId,
                          },
                      },
                      create: {
                          userId: existingUser.id,
                          provider: account.provider,
                          providerAccountId: account.providerAccountId,
                          type: account.type,
                          access_token: account.access_token,
                          refreshToken: account.refresh_token,
                      },
                      update: {
                          access_token: account.access_token,
                          refreshToken: account.refresh_token,
                      },
                  });
              }
          }
          return true; // Permitir el inicio de sesión
        },
    },
});
    