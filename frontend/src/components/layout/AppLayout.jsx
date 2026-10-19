import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function AppLayout({ activeSection, onSelectSection, children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#132B20]">
      <Sidebar
        activeSection={activeSection}
        onSelectSection={onSelectSection}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      <Navbar activeSection={activeSection} isSidebarCollapsed={isCollapsed} />

      <main
        className={`transition-all duration-300 pt-20 p-6 min-h-screen ${
          isCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
