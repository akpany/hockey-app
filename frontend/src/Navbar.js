import React from 'react';
import { Link } from 'react-router-dom';

function Navbar({ user, handleLogout }) {
  const navStyle = {
    backgroundColor: '#1f1f1f',
    color: '#fff',
    padding: '15px 30px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    borderBottom: '2px solid #444',
    fontFamily: 'Arial, sans-serif'
  };

  const linkStyle = {
    color: '#61dafb',
    textDecoration: 'none',
    marginRight: '15px'
  };

  const buttonStyle = {
    backgroundColor: '#444',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    cursor: 'pointer',
    marginLeft: '10px'
  };

  return (
    <nav style={navStyle}>
      <h2 style={{ margin: '0 0 10px 0' }}>🏒 Hockey Score Prediction App</h2>
      {user ? (
        <>
          <div>
            Welcome, <strong>{user.email}</strong>
            <button onClick={handleLogout} style={buttonStyle}>Logout</button>
          </div>
          <div style={{ marginTop: '10px' }}>
            <Link to="/" style={linkStyle}>Home</Link>
            <Link to="/predict" style={linkStyle}>Predict</Link>
            <Link to="/my-predictions" style={linkStyle}>My Predictions</Link>
            <Link to="/leaderboard" style={linkStyle}>Leaderboard</Link>
</div>

        </>
      ) : (
        <div>
          <Link to="/login" style={linkStyle}>Login</Link>
          <Link to="/register" style={linkStyle}>Register</Link>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
 