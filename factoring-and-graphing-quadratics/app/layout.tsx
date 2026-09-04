import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Quadratic Functions: Factoring and Graphing", description: "Factor quadratic functions and compare standard and factored forms on the same coordinate plane.", icons: { icon: "/favicon.svg" } };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
