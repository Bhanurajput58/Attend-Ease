import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div className="unauthorized">
      <h1>Unauthorized Access</h1>
      <p>You don't have permission to access this page.</p>
      <Link to="/dashboard" className="back-button">
        Go to Dashboard
      </Link>
    </div>
  );
};

export default Unauthorized; 