import React from 'react';

const users = [
    {
        id: 1,
        name: 'Alice Smith',
        email: 'alice@example.com',
        role: 'Manager',
        status: 'Active',
        lastLogin: '2024-06-10 09:15',
    },
    {
        id: 2,
        name: 'Bob Johnson',
        email: 'bob@example.com',
        role: 'Employee',
        status: 'Inactive',
        lastLogin: '2024-06-08 14:22',
    },
    // Add more users as needed
];

const statusStyles = {
    Active: { color: 'green', fontWeight: 'bold' },
    Inactive: { color: 'red', fontWeight: 'bold' },
};

function Dashboard() {
    return (
        <div style={{ padding: 32, fontFamily: 'Segoe UI, Arial, sans-serif', background: '#f7f9fa', minHeight: '100vh' }}>
            <h2 style={{ marginBottom: 24 }}>Admin Dashboard</h2>
            <table style={tableStyle}>
                <thead>
                    <tr style={{ background: '#f0f4f8' }}>
                        <th style={thStyle}>Name</th>
                        <th style={thStyle}>Email</th>
                        <th style={thStyle}>Role</th>
                        <th style={thStyle}>Status</th>
                        <th style={thStyle}>Effective Time (h) </th>
                        <th style={thStyle}>Away Time (min) </th>
                        <th style={thStyle}>Away Time (min) </th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td style={tdStyle}>{user.name}</td>
                            <td style={tdStyle}>{user.email}</td>
                            <td style={tdStyle}>{user.role}</td>
                            <td style={{ ...tdStyle, ...statusStyles[user.status] }}>{user.status}</td>
                            <td style={tdStyle}>{user.lastLogin}</td>
                            <td style={tdStyle}>{user.lastLogin}</td>
                            <td style={tdStyle}>{user.lastLogin}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    background: '#fff',
    borderRadius: 8,
    boxShadow: '0 2px 8px #e0e0e0',
    border: '1px solid #ccc',
};

const thStyle = {
    padding: '12px 16px',
    textAlign: 'left',
    fontWeight: 600,
    fontSize: 16,
    border: '1px solid #ccc',
};

const tdStyle = {
    padding: '10px 16px',
    fontSize: 15,
    border: '1px solid #ccc',
};

export default Dashboard;
