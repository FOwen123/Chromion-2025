import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThirdwebProvider } from "thirdweb/react";

const inter = Inter({
  subsets: ["latin"]

});

export const metadata: Metadata = {
  title: "LinkFi",
  description: "LinkFi",
  icons: {
    icon: '/LinkFi(1).png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} antialiased`}>
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange>
          <ThirdwebProvider>
            {children}
          </ThirdwebProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
