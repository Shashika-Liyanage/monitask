import React from 'react';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import Person4RoundedIcon from '@mui/icons-material/Person4Rounded';

function EmployeeHeaderView({ onToggleSidebar }) {
  return (
    <div className="employee-header-container">
      {/* Hamburger (mobile only) */}
      <button className="hamburger-btn" onClick={onToggleSidebar} aria-label="Toggle sidebar">
        &#9776;
      </button>

      <h1 className="header-title">Monitask</h1>

      {/* Icons on the right */}
      <div className="header-icons-row">
        <NotificationsRoundedIcon className="header-icon" />
        <Person4RoundedIcon className="header-icon" />
      </div>
    </div>
  );
}

export default EmployeeHeaderView;
