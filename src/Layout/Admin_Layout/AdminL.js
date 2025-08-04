import React, { useState } from 'react';
import AdminHeaderView from '../../Header/HeaderAdmin';
import AdminSideBar from '../../Pages/AdminPage/AdminSidebar/adminSide';
import './AdminL.css';

function AdminLayout({ children }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  return (
    <div className="admin-layout">
      <div className={`admin-sidebar-wrapper ${isSidebarOpen ? 'open' : ''}`}>
        <AdminSideBar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          selectedIndex={selectedIndex}
          setSelectedIndex={setSelectedIndex}
        />
      </div>

      <div className="admin-main">
        <div className="admin-header">
          <AdminHeaderView onToggleSidebar={toggleSidebar} />
        </div>

        <div className="admin-content">
          {children}
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
