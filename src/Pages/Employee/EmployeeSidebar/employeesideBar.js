import React from 'react';
import './employeesideBar.css';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Box from '@mui/material/Box';

function EmployeeSideBar() {
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const handleListItemClick = (event, index) => {
    setSelectedIndex(index);
  };

  const menuItems = ['Dashboard', 'Profile', 'Attendance', 'Performance', 'Task'];

  return (
    <Box className="sidebar">
      <div className="sidebar-logo">LOGO</div>
      <List component="nav" className="menu-list">
        {menuItems.map((text, index) => (
          <ListItemButton
            key={text}
            selected={selectedIndex === index}
            onClick={(event) => handleListItemClick(event, index)}
            className={`menu-item ${selectedIndex === index ? 'selected' : ''}`}
          >
            <ListItemText primary={text} primaryTypographyProps={{ className: 'menu-text' }} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}

export default EmployeeSideBar;
