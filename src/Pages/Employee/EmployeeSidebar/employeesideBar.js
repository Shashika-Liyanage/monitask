import React from 'react';
import './employeesideBar.css';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import SpaceDashboardRoundedIcon from '@mui/icons-material/SpaceDashboardRounded';
import Person2RoundedIcon from '@mui/icons-material/Person2Rounded';
import EmojiPeopleRoundedIcon from '@mui/icons-material/EmojiPeopleRounded';
import NewspaperRoundedIcon from '@mui/icons-material/NewspaperRounded';
import TaskRoundedIcon from '@mui/icons-material/TaskRounded';
import { useNavigate } from 'react-router-dom'; // ✅ Import this

function EmployeeSidebar({ isOpen, onClose, selectedIndex, setSelectedIndex }) {
  const navigate = useNavigate(); // ✅ Hook for navigation

  const menuItems = [
    { label: 'Dashboard', icon: <SpaceDashboardRoundedIcon />, path: '/employeeDash' },
    { label: 'Profile', icon: <Person2RoundedIcon />, path: '/employeeProfile' },
    { label: 'Attendance', icon: <EmojiPeopleRoundedIcon />, path: '/employeeAttendance' },
    { label: 'Performance', icon: <NewspaperRoundedIcon />, path: '/employeePerformance' },
    { label: 'Task', icon: <TaskRoundedIcon />, path: '/employeeTask' },
  ];

  const handleClick = (index) => {
    setSelectedIndex(index);
    navigate(menuItems[index].path); // ✅ Navigate to the selected route
    onClose(); // Close sidebar on mobile
  };

  return (
    <div className={`employee-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-logo">Monitask</div>

      <List component="nav" className="menu-list">
        {menuItems.map((item, index) => (
          <ListItemButton
            key={index}
            selected={selectedIndex === index}
            onClick={() => handleClick(index)}
            className={`menu-item ${selectedIndex === index ? 'selected' : ''}`}
          >
            <ListItemIcon className="menu-icon">{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} className="menu-text" />
          </ListItemButton>
        ))}
      </List>
    </div>
  );
}

export default EmployeeSidebar;
