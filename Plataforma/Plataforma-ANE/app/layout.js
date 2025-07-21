import { Nunito_Sans } from 'next/font/google';
import "./globals.css";
import { MainProvider } from "@/context/MainContext";
import { SocketProvider } from '@/context/SocketContext';
import { SessionProvider } from "next-auth/react";

const nunito = Nunito_Sans({ subsets: ["latin"] });

export const metadata = {
  title: "Plataforma de sensado espectral - ANE",
  description: "Plataforma de sensado espectral - ANE",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={nunito.className}>
        <SessionProvider >
          <SocketProvider>
            <MainProvider>
              {children}
            </MainProvider>
          </SocketProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
