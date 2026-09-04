import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Quadratic Functions: Standard Form to Factored Form", description: "An eight-part interactive Algebra 1 progression from standard form to factored form.", icons: { icon: "/favicon.svg" } };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
