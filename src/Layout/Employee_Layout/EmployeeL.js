import React, { useState } from 'react';
import EmployeeSidebar from '../../Pages/Employee/EmployeeSidebar/employeesideBar';
import EmployeeHeaderView from '../../Header/Header';
import './EmployeeL.css';

function EmployeeLayout({ children }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  return (
    <div className="employee-layout">
      <div className={`employee-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <EmployeeSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          selectedIndex={selectedIndex}
          setSelectedIndex={setSelectedIndex}
        />
      </div>

      <div className="employee-main">
        <div className="employee-header">
          <EmployeeHeaderView onToggleSidebar={toggleSidebar} />
        </div>

        <div className="employee-content">
          {children}
        </div>
      </div>
    </div>
  );
}

export default EmployeeLayout;
