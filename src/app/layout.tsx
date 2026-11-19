import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { BizAssistChatbot } from "@/components/chatbot/BizAssistChatbot";
import { FlowingRedBackground } from "@/components/ui/FlowingRedBackground";
import { SplashLoadingScreen } from "@/components/ui/LoadingScreen";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BizAssist AI — Smart Customer Support, Simplified.",
  description:
    "AI-Powered Customer Support & Complaint Management System with automated ticketing, department routing, visual progress timelines, and BizAssist Assistant.",
  icons: {
    icon: "/bizassist-logo.png?v=2",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="crimson-theme-scope relative min-h-screen font-sans text-white antialiased">
        <FlowingRedBackground />
        <SplashLoadingScreen />
        <ToastProvider>
          <AuthProvider>
            <div className="relative z-10 min-h-screen">{children}</div>
            <BizAssistChatbot />
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
