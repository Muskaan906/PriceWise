import type { Metadata } from "next";
import localFont from "next/font/local";
import { Inter, Space_Grotesk } from 'next/font/google'
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ 
  subsets: ['latin'],
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Pricewise",
  description: "Track product prices effortlessly and save money on your online shopping",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className={`${inter.className} ${spaceGrotesk.className} antialiased`}>
       <main className="max-w-10xl mx-auto">
        <Navbar />
        {children}
      </main>
      </body>
    </html>
  );
}