import React from 'react';
import { Link } from 'react-router-dom';

function ExhibitionsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center py-20">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Virtual Exhibitions</h1>
        <p className="text-lg text-gray-600 mb-8">Explore and participate in curated art exhibitions</p>
        <div className="bg-gray-100 rounded-lg p-8 text-gray-600 max-w-2xl mx-auto">
          <p className="mb-4 font-semibold">This page is coming soon with:</p>
          <ul className="text-left space-y-2 inline-block">
            <li>• Active exhibitions by date</li>
            <li>• Featured artworks in exhibitions</li>
            <li>• Exhibition booking and management</li>
            <li>• Archive of past exhibitions</li>
            <li>• Simulation section for artists</li>
          </ul>
        </div>
        <div className="mt-8">
          <Link to="/exhibitions/archived" className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 inline-flex items-center gap-2">
            📁 View Archived Exhibitions
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ExhibitionsPage;
