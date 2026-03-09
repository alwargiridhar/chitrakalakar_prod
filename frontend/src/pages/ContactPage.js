import React from 'react';

function ContactPage() {
  const steps = [
    { number: 1, title: "Share Your Requirement", description: "Tell us what you're looking for. For example, you want to get a picture painted or a custom artwork created.", icon: "📝" },
    { number: 2, title: "Set Your Budget", description: "Define your budget, artwork size requirements, and key factors like style, theme, and timeline.", icon: "💰" },
    { number: 3, title: "ChitraKalakar Reviews Artist Profiles", description: "Our team analyzes artist profiles and shows you artworks from artisans who can fulfill your requirements.", icon: "🔍" },
    { number: 4, title: "Review Samples & Select", description: "Check the portfolios and select up to 3 satisfied sample works from artists whose work resonates with your vision.", icon: "✨" },
    { number: 5, title: "Artist Acceptance & Payment", description: "Once an artist accepts your request, you proceed to payment. Your payment is held securely in escrow.", icon: "🤝" },
    { number: 6, title: "Artist Creates & Delivers", description: "The artist creates your custom artwork and delivers it according to the agreed timeline and specifications.", icon: "🎨" },
    { number: 7, title: "Client Approval & Release Payment", description: "Upon your approval of the final artwork, ChitraKalakar releases the payment to the artist immediately.", icon: "✅" },
    { number: 8, title: "Transcript Report", description: "Receive a complete transcript and documentation of your order for records and future reference.", icon: "📋" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Get In Touch</h1>
          <p className="text-xl text-gray-600">Have questions? We'd love to hear from you. Connect with the ChitraKalakar team.</p>
        </div>

        {/* Contact Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-8 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📧</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Email</h3>
            <p className="text-gray-600 mb-3">Send us an email anytime</p>
            <a href="mailto:contact@chitrakalakar.com" className="text-orange-500 font-semibold hover:text-orange-600 transition-colors">
              contact@chitrakalakar.com
            </a>
          </div>

          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-8 text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📞</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Phone</h3>
            <p className="text-gray-600 mb-3">Call us to speak with our team</p>
            <a href="tel:+919884984454" className="text-orange-500 font-semibold hover:text-orange-600 transition-colors">
              +91 9884984454
            </a>
          </div>

          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-8 text-center">
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⏰</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Response Time</h3>
            <p className="text-gray-600 mb-3">We typically respond within</p>
            <p className="text-orange-500 font-semibold">24-48 hours</p>
          </div>
        </div>

        {/* How ChitraKalakar Works Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How ChitraKalakar Works</h2>
            <p className="text-xl text-gray-600">A simple and transparent process to commission your custom artwork</p>
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step) => (
              <div key={step.number} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 p-8">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center mb-4 relative">
                    <span className="text-white font-bold text-xl">{step.number}</span>
                    <span className="absolute -bottom-2 -right-2 text-3xl">{step.icon}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Why Choose Us Section */}
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl shadow-lg p-12 mb-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Why Connect With Us?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Transparent Process</h3>
                <p className="text-gray-600">Every step is clear, documented, and designed to protect both artists and collectors.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Fair Pricing</h3>
                <p className="text-gray-600">Artists keep more of their earnings with our sustainable commission model.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure Transactions</h3>
                <p className="text-gray-600">Your payments are held safely until the artwork is delivered and approved.</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-3">What if I'm not satisfied with the artwork?</h3>
              <p className="text-gray-600 text-sm">You have full approval authority. If the artwork doesn't meet your expectations, you can request revisions before final payment is released.</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-3">How long does the entire process take?</h3>
              <p className="text-gray-600 text-sm">The timeline varies based on artwork complexity and artist availability. Most projects are completed within 2-4 weeks.</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Can I request revisions?</h3>
              <p className="text-gray-600 text-sm">Yes! During the creation process, you can request reasonable revisions to ensure the final artwork matches your vision.</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Is my artwork copyrighted to me?</h3>
              <p className="text-gray-600 text-sm">Upon final payment, you own the artwork. The terms regarding reproduction rights are agreed upon between you and the artist.</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-3">What payment methods do you accept?</h3>
              <p className="text-gray-600 text-sm">We support multiple payment methods including credit cards, debit cards, and digital wallets for your convenience.</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-3">How do I contact an artist directly?</h3>
              <p className="text-gray-600 text-sm">Once an artist accepts your request, you'll have a dedicated communication channel to discuss details and updates.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactPage;
