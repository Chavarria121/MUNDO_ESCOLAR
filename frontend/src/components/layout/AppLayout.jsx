import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function AppLayout({ activeSection, onSelectSection, children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#132B20] print:min-h-0 print:bg-white print:text-black">
      <div className="no-print">
        <Sidebar
          activeSection={activeSection}
          onSelectSection={onSelectSection}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />
        <Navbar activeSection={activeSection} isSidebarCollapsed={isCollapsed} />
      </div>

      <main
        className={`transition-all duration-300 pt-20 p-6 min-h-screen print:pt-0 print:p-0 print:m-0 print:ml-0 print:min-h-0 ${
          isCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <div className="max-w-7xl mx-auto print:max-w-none print:w-full">{children}</div>
      </main>
    </div>
  );
}
