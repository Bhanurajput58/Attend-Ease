import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div className="unauthorized">
      <h1>Unauthorized Access</h1>
      <p>You don't have permission to access this page.</p>
      <Link to="/" className="back-button">
        Go to Home Page
      </Link>
    </div>
  );
};

export default Unauthorized; 