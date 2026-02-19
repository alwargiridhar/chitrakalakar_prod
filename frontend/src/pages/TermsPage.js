import React from 'react';

function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms & Conditions</h1>
      <div className="prose max-w-none text-gray-600">
        <p>By using ChitraKalakar, you agree to these terms.</p>
        <h2 className="text-xl font-bold text-gray-900 mt-6 mb-2">User Responsibilities</h2>
        <p>Users must provide accurate information and use the platform responsibly.</p>
        <h2 className="text-xl font-bold text-gray-900 mt-6 mb-2">Artist Responsibilities</h2>
        <p>Artists must deliver quality work as promised and maintain professional conduct.</p>
        <h2 className="text-xl font-bold text-gray-900 mt-6 mb-2">Platform Fees</h2>
        <p>ChitraKalakar charges a 10% commission on completed orders.</p>
      </div>
    </div>
  );
}

export default TermsPage;
