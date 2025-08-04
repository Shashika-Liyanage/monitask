import React from 'react';
import './adminSide.css';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import SpaceDashboardRoundedIcon from '@mui/icons-material/SpaceDashboardRounded';
import Person2RoundedIcon from '@mui/icons-material/Person2Rounded';
import EmojiPeopleRoundedIcon from '@mui/icons-material/EmojiPeopleRounded';
import NewspaperRoundedIcon from '@mui/icons-material/NewspaperRounded';
import TaskRoundedIcon from '@mui/icons-material/TaskRounded';
import { useNavigate } from 'react-router-dom';

function AdminSideBar({ isOpen, onClose, selectedIndex, setSelectedIndex }) {
  const navigate = useNavigate();

  const menuItems = [
  { label: 'Dashboard', icon: <SpaceDashboardRoundedIcon /> },
  { label: 'Profile Manage', icon: <Person2RoundedIcon /> },
  { label: 'Attendance Manage', icon: <EmojiPeopleRoundedIcon /> },
  { label: 'Performance Manage', icon: <NewspaperRoundedIcon /> },
  { label: 'Task Manage', icon: <TaskRoundedIcon /> },
];

  const handleClick = (index) => {
    setSelectedIndex(index);
    navigate(menuItems[index].path);
    onClose(); // for mobile
  };

  return (
    <div className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="admin-sidebar-logo">Monitask Admin</div>

      <List component="nav" className="admin-menu-list">
        {menuItems.map((item, index) => (
          <ListItemButton
            key={index}
            selected={selectedIndex === index}
            onClick={() => handleClick(index)}
            className={`admin-menu-item ${selectedIndex === index ? 'selected' : ''}`}
          >
            <ListItemIcon className="admin-menu-icon">{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} className="admin-menu-text" />
          </ListItemButton>
        ))}
      </List>
    </div>
  );
}

export default AdminSideBar;
