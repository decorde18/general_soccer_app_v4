import type { Metadata } from "next";
import { ToastProvider } from "@/components/ui/toast";
import AuthProvider from "@/components/AuthProvider";
import { getServerAuthSession } from "@/lib/auth";
import "@/styles/globals.css";
import { Geist, Geist_Mono } from "next/font/google";

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
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
