import type { Metadata } from "next";
import "./globals.css";
import NavWrapper from "@/components/NavWrapper";
import { Toaster } from "react-hot-toast";
import AuthProvider from "@/components/AuthProvider";
import SocketProvider from "@/components/SocketProvider";
import MainWrapper from "@/components/MainWrapper";

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
          <SocketProvider>
            <NavWrapper />
            <MainWrapper>{children}</MainWrapper>
            <Toaster position="top-center" />
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
