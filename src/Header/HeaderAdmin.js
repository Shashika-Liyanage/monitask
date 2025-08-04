import React from 'react';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import Person4RoundedIcon from '@mui/icons-material/Person4Rounded';
import './HeaderAdmin.css';


function AdminHeaderView({ onToggleSidebar }) {
  return (
    <div className="admin-header-container">
      {/* Hamburger (mobile only) */}
      <button className="admin-hamburger-btn" onClick={onToggleSidebar} aria-label="Toggle sidebar">
        &#9776;
      </button>

      <h1 className="admin-header-title">Monitask Admin</h1>

      {/* Icons on the right */}
      <div className="admin-header-icons-row">
        <NotificationsRoundedIcon className="admin-header-icon" />
        <Person4RoundedIcon className="admin-header-icon" />
      </div>
    </div>
  );
}

export default AdminHeaderView;
