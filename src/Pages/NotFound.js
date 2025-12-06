import React from 'react';

function NotFound() {
  const styles = {
    container: {
      textAlign: 'center',
      padding: '50px',
      marginTop: '50px',
    },
    heading: {
      fontSize: '60px',
      color: '#CC0000',
    },
    message: {
      fontSize: '20px',
      color: '#333',
    },
    link: {
      display: 'inline-block',
      marginTop: '20px',
      padding: '10px 20px',
      backgroundColor: '#007bff',
      color: 'white',
      textDecoration: 'none',
      borderRadius: '5px',
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>404 Requested Page Not Found</h1>
      <p style={styles.message}>Oops! The page you are looking for does not exist.</p>
      <p style={styles.message}>Please check the URL or return to the homepage.</p>
      <p style={styles.heading}>For a Security Reason you will be logged out when you click Go to Homepage.</p>
      {/* Optional: Add a link back home */}
      <a href="/" style={styles.link}>Go to Homepage</a>
    </div>
  );
}

export default NotFound;