import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
export default function MainLayout() {
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