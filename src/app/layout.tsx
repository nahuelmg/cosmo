import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cosmology Group — UBA / FCEN",
  description: "Institutional website for the Cosmology Group at the Facultad de Ciencias Exactas y Naturales, Universidad de Buenos Aires.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
