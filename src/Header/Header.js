import React from 'react';

const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 32px',
    backgroundColor: '#2d3748',
    color: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
};

const logoStyle = {
    fontWeight: 'bold',
    fontSize: '1.5rem',
    letterSpacing: '1px'
};

const navStyle = {
    display: 'flex',
    gap: '24px'
};

const linkStyle = {
    color: '#fff',
    textDecoration: 'none',
    fontSize: '1rem',
    transition: 'color 0.2s'
};

function Header() {
    return (
        <header style={headerStyle}>
            <div style={logoStyle}>MoniTask</div>
            <nav style={navStyle}>
                <a href="#dashboard" style={linkStyle}>Dashboard</a>
                <a href="#tasks" style={linkStyle}>Tasks</a>
                <a href="#reports" style={linkStyle}>Reports</a>
                <a href="#profile" style={linkStyle}>Profile</a>
            </nav>
        </header>
    );
}

export default Header;