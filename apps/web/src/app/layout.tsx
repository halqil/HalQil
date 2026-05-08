import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Toaster } from "react-hot-toast";
import AuthProvider from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "HalQil - Mahalliy Xizmat Marketplace",
  description: "Uyingizdagi har qanday muammoni hal qiladigan mutaxassislarni toping",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz">
      <body className="min-h-screen flex flex-col bg-gray-50 text-gray-900" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <AuthProvider>
          <Navbar />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <Toaster position="top-center" />
        </AuthProvider>
      </body>
    </html>
  );
}
