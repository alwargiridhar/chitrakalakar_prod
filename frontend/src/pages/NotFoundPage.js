import React from 'react';
import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">Page not found</p>
        <Link to="/" className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
          Go Home
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
