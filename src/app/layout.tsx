import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Home, Target, PlusCircle } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kemana? - Money Tracker",
  description: "Personal money tracker and allocation engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-[#F8FAFC] text-slate-900 min-h-screen`}>
        <div className="w-full relative min-h-screen pb-20 md:pb-0">
          {children}
          
          {/* Sticky Bottom Navigation (Mobile Only) */}
          <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-16 px-4 z-50 md:hidden">
            <button className="flex flex-col items-center justify-center w-full text-sky-600">
              <Home size={24} />
              <span className="text-xs mt-1 font-medium">Home</span>
            </button>
            <button className="flex flex-col items-center justify-center w-full text-slate-400 hover:text-slate-600">
              <Target size={24} />
              <span className="text-xs mt-1 font-medium">Goals</span>
            </button>
            <button className="flex flex-col items-center justify-center w-full text-slate-400 hover:text-slate-600">
              <PlusCircle size={24} />
              <span className="text-xs mt-1 font-medium">Add</span>
            </button>
          </nav>
        </div>
      </body>
    </html>
  );
}
