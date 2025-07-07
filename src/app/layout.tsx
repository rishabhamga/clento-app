import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI SDR Platform",
  description: "AI-powered Sales Development Representative platform for automated lead generation and outreach",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider 
      waitlistUrl="/waitlist"
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
        </body>
      </html>
    </ClerkProvider>
  );
}
