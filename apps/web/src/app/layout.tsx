import type { Metadata } from "next";
import "./globals.css";
import AppNavigation from "@/components/navigation/AppNavigation";
import { Toaster } from "react-hot-toast";
import AuthProvider from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "HalQil - Mahalliy Xizmat Marketplace",
  description: "Uyingizdagi har qanday muammoni hal qiladigan mutaxassislarni toping",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'system';
                  var fontSize = localStorage.getItem('fontSize') || 'medium';

                  if (theme === 'dark' ||
                    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.setAttribute('data-theme', 'dark');
                  } else {
                    document.documentElement.setAttribute('data-theme', 'light');
                  }

                  document.documentElement.setAttribute('data-fontsize', fontSize);
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className="min-h-screen flex flex-col"
        style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
        suppressHydrationWarning
      >
        <AuthProvider>
          <AppNavigation />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <Toaster position="top-center" />
        </AuthProvider>
      </body>
    </html>
  );
}
