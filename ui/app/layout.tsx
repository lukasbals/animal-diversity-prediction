import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Species Extinction Risk Dashboard",
  description:
    "Analytical dashboard for extinction risk forecasting, population trends, and conservation drivers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
