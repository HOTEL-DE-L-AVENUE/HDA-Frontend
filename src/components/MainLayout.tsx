import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export default function MainLayout() {
  useEffect(() => {
    const refreshPage = () => {
      if (document.visibilityState !== 'visible') return;
      if (document.querySelector('[role="dialog"]')) return;
      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement || activeElement instanceof HTMLSelectElement) return;
      window.location.reload();
    };

    const interval = window.setInterval(refreshPage, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <Sidebar />

      <div className="md:ml-[72px] w-full md:w-[calc(100%-72px)] min-h-screen">
        <Header />

        <main className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}