import React from 'react';

function FAQPage() {
  const faqs = [
    { q: "How do I commission artwork?", a: "Sign up as a user, browse artists, and contact them directly to discuss your requirements." },
    { q: "How do I become an artist?", a: "Sign up as an artist, and your account will be reviewed by our admin team for approval." },
    { q: "What are the fees?", a: "Artists pay a 10% commission on completed orders. Users pay no additional fees." },
    { q: "How is payment handled?", a: "Payments are held securely until the artwork is delivered and approved." },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h1>
      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-bold text-gray-900 mb-2">{faq.q}</h3>
            <p className="text-gray-600">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FAQPage;
