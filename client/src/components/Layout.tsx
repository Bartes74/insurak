import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-neu-base">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden ml-16 lg:ml-64 transition-all duration-300">
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

