import React from "react";
import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Zap } from "lucide-react";

export const Layout: React.FC = () => {
  return (
    <div className="h-screen w-full flex flex-row bg-white selection:bg-blue-100 selection:text-blue-900 overflow-hidden">
      <Toaster position="top-right" richColors />
      
      {/* LEFT SECTION � IMAGE (50%) */}
      <div className="hidden lg:block relative w-1/2 h-full overflow-hidden border-r border-gray-100">
        <div className="absolute inset-x-0 inset-y-0 bg-gradient-to-r from-transparent to-white/10 z-10 w-24 right-0" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 z-10" />
        
        <ImageWithFallback 
          src="https://images.unsplash.com/photo-1708562587863-edb259c038ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcmVtaXVtJTIwZWxlY3RyaWMlMjB2ZWhpY2xlJTIwbHV4dXJ5JTIwY2FyJTIwaW50ZXJpb3IlMjBzbGVlayUyMGV4dGVyaW9yfGVufDF8fHx8MTc3MjgxMDIyN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Premium Electric Vehicle"
          className="w-full h-full object-cover"
        />

        <div className="absolute inset-0 z-20 flex flex-col justify-end p-16 text-white">
          <div className="max-w-xl space-y-6">
            <div className="h-1 w-20 bg-blue-500 rounded-full" />
            <h2 className="text-5xl font-black leading-tight tracking-tight">
              The Future of <br />
              <span className="text-blue-400">Sustainable</span> Luxury.
            </h2>
            <p className="text-lg text-gray-200 font-medium max-w-md leading-relaxed">
              Experience the pinnacle of automotive engineering with zero emissions and unparalleled performance. Join the revolution today.
            </p>
            <div className="flex items-center gap-8 pt-4 text-sm">
              <div className="space-y-1">
                <p className="text-2xl font-black">2.1s</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">0-60 MPH</p>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div className="space-y-1">
                <p className="text-2xl font-black">480mi</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Est. Range</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SECTION � FORM (50%) */}
      <div className="w-full lg:w-1/2 flex flex-col h-full bg-white relative overflow-hidden">
        <header className="px-8 md:px-16 xl:px-24 py-8 shrink-0 z-10 w-full">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg shadow-black/10">
              <Zap className="text-white fill-white" size={24} />
            </div>
            <span className="text-xl font-black tracking-tight text-gray-900 uppercase">EV-<span className="text-blue-600">PORTAL</span></span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-12 flex flex-col items-center">
          <div className="w-full max-w-lg">
            <Outlet />
          </div>
        </main>

        <footer className="px-8 md:px-16 xl:px-24 py-6 shrink-0 w-full text-center md:text-left border-t border-gray-50">
          <p className="text-xs font-medium text-gray-400">
            © 2026 EV-Portal. Smart EV Charging Platform. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
};
