import "./globals.css";
import { ThemeProvider } from "./theme-provider";
import Script from "next/script";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            try {
              const raw = localStorage.getItem('theme-storage');
              if (raw) {
                const parsed = JSON.parse(raw);
                const theme = parsed?.state?.theme;
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              }
            } catch (_) {}
          `}
        </Script>
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
