import { Outlet } from "react-router";
import { useLangStore } from "@/lib/store";
import Header from "./Header";
import Footer from "./Footer";
import MobileBottomNav from "./MobileBottomNav";
import WhatsAppFAB from "./WhatsAppFAB";
import Toast from "./Toast";
import { useEffect } from "react";

export default function StoreLayout() {
  const { dir } = useLangStore();

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang =
      useLangStore.getState().lang === "ar"
        ? "ar"
        : useLangStore.getState().lang === "fr"
          ? "fr"
          : "en";
  }, [dir]);

  return (
    <div className={`min-h-screen bg-white ${dir === "rtl" ? "font-sans" : ""}`}>
      <Header />
      <main className="min-h-[calc(100vh-300px)]">
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
      <WhatsAppFAB />
      <Toast />
    </div>
  );
}
