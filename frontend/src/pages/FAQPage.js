import React from 'react';

function FAQPage() {
  const faqs = [
    { q: "How do I start a commission request?", a: "Go to your User Dashboard and open My Commissions. Use New Request to submit your requirement. Commissioning now runs through dashboard-only flow." },
    { q: "Do I need to complete registration before commissioning?", a: "Yes. For authenticity, you must be logged in and have full name, email, and phone completed in your profile before you can submit a commission." },
    { q: "Can users and artists contact each other directly?", a: "No. Contact details are not shared between users and artists. All commission communication and tracking are handled through ChitraKalakar workflow." },
    { q: "What does 'Negotiation Allowed' mean?", a: "This is the primary pricing control. If enabled, users can send an offer and artists can accept, counter, or reject through platform request flow." },
    { q: "How many artists can receive one commission request?", a: "A single commission can be sent to a maximum of 3 matching artists." },
    { q: "What happens when one artist accepts?", a: "The first accepted artist locks the commission. Other pending artist requests for that commission automatically expire." },
    { q: "How is price estimated for different categories?", a: "Physical categories use per sq ft pricing. Digital/Illustration/Photography/Sculpture categories use flat per project ranges where size is ignored." },
    { q: "Can I track progress after request submission?", a: "Yes. You can track status in your dashboard timeline: Requested → Accepted → In Progress → WIP Shared → Completed → Delivered." },
    { q: "Can I upload reference images?", a: "Yes. You can upload references with your request, and artists can upload work updates while the commission progresses." },
    { q: "I signed in with Google. Do I still need to fill details manually?", a: "Google sign-in details are captured where available. If any required field is missing, complete it in Account/Profile before commissioning." },
    { q: "How do I become an artist?", a: "Sign up as an artist, and your account will be reviewed by our admin team for approval." },
    { q: "What are the fees?", a: "Artists pay a 10% commission on completed orders. Users pay no additional fees." },
    { q: "How is payment handled?", a: "Payments are held securely until the artwork is delivered and approved." },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12" data-testid="faq-page">
      <h1 className="text-4xl font-bold text-gray-900 mb-8" data-testid="faq-page-title">Frequently Asked Questions</h1>
      <div className="space-y-4" data-testid="faq-list">
        {faqs.map((faq, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-6" data-testid={`faq-item-${i + 1}`}>
            <h3 className="font-bold text-gray-900 mb-2" data-testid={`faq-question-${i + 1}`}>{faq.q}</h3>
            <p className="text-gray-600" data-testid={`faq-answer-${i + 1}`}>{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FAQPage;
