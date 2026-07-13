import type { Metadata } from "next";
import "@/styles/globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { getServerAuthSession } from "@/lib/auth";

import { Toaster } from "sonner";
import AuthProvider from "@/components/AuthProvider";

export const metadata = {
  title: "Soccer Stats App",
  description: "Cordero Soccer Stats Everything App",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerAuthSession();

  return (
    <html lang='en'>
      <head>
        <link rel='icon' type='image/png' href='/favicon.png' />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AuthProvider session={session}>
          {children}
          <Toaster richColors closeButton position='top-right' />
        </AuthProvider>
      </body>
    </html>
  );
}
