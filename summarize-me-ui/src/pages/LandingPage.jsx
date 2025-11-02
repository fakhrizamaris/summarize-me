import React from 'react';
import { Link } from 'react-router-dom';

function LandingPage() {
  return (
    <div>
      <h1>Selamat Datang di Summarize-Me</h1>
      <p>Silakan login untuk melanjutkan.</p>
      <Link to="/login">
        <button>Login Sekarang</button>
      </Link>
    </div>
  );
}

export default LandingPage;
