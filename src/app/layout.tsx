import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Observe Agents",
  description: "Internal suite of AI-powered employees that automate repetitive tasks across functions - sales, marketing, recruitment, and security",
  icons: {
    icon: [
      { url: '/observe-ai.svg', sizes: 'any', type: 'image/svg+xml' },
      { url: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
    ],
    shortcut: '/favicon.svg',
    apple: '/observe-ai.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider 
      appearance={{
        elements: {
          footer: "hidden",
          footerAction: "hidden",
          footerActionText: "hidden",
          footerPages: "hidden"
        }
      }}
    >
      <html lang="en">
        <body className={inter.className}>
          <Providers>
            {children}
          </Providers>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
