import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/providers";

export const metadata: Metadata = {
  title: "Buy & Sell - Your Property Journey Starts Here",
  description: "Find your dream property in the Philippines. Browse houses, condos, townhouses, commercial spaces, and lots for sale or rent.",
  keywords: "real estate, Philippines, property, house, condo, buy, sell, rent",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
      </head>
      <body className="font-sans antialiased overflow-x-hidden">
        <SessionProvider>
          <div className="mesh-gradient" />
          <div className="w-full max-w-full overflow-x-hidden">
            {children}
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
