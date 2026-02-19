import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { membershipAPI } from '../services/api';

function SubscriptionPage() {
  const { profiles, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [plans] = useState([
    {
      id: 'basic',
      name: 'Basic',
      price: 999,
      duration: '1 Month',
      features: [
        'Appear in Artists Directory',
        'Upload up to 10 artworks',
        'Basic portfolio page',
        'Email support',
      ],
      popular: false,
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 2499,
      duration: '3 Months',
      features: [
        'Everything in Basic',
        'Upload unlimited artworks',
        'Featured artist placement',
        'Priority support',
        'Analytics dashboard',
      ],
      popular: true,
    },
    {
      id: 'annual',
      name: 'Annual',
      price: 7999,
      duration: '12 Months',
      features: [
        'Everything in Premium',
        'Custom portfolio URL',
        'Exhibition priority',
        'Dedicated account manager',
        'Marketing features',
        '2 months FREE',
      ],
      popular: false,
    },
  ]);

  const isActiveMember = profiles?.is_member && profiles?.membership_expiry && 
    new Date(profiles.membership_expiry) > new Date();

  const handleSubscribe = async (planId) => {
    setLoading(true);
    try {
      const response = await membershipAPI.initiateMembership(planId);
      if (response.razorpay_order_id) {
        // Initialize Razorpay
        const options = {
          key: response.razorpay_key,
          amount: response.amount,
          currency: 'INR',
          name: 'ChitraKalakar',
          description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Membership`,
          order_id: response.razorpay_order_id,
          handler: async function (razorpayResponse) {
            await membershipAPI.verifyPayment({
              razorpay_order_id: razorpayResponse.razorpay_order_id,
              razorpay_payment_id: razorpayResponse.razorpay_payment_id,
              razorpay_signature: razorpayResponse.razorpay_signature,
            });
            await refreshProfile();
            alert('Membership activated successfully!');
          },
          prefill: {
            email: profiles?.email,
            name: profiles?.full_name,
          },
          theme: {
            color: '#F97316',
          },
        };
        
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      }
    } catch (error) {
      alert(error.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Subscription Plans</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Upgrade your membership to get more visibility, sell your artworks, and connect with art lovers worldwide.
          </p>
        </div>

        {/* Current Status */}
        {isActiveMember && (
          <div className="mb-8 bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">✓</span>
                </div>
                <div>
                  <h3 className="font-semibold text-green-800">Active Membership</h3>
                  <p className="text-green-600">
                    Plan: <span className="font-medium">{profiles?.membership_plan || 'Basic'}</span> • 
                    Expires: {new Date(profiles.membership_expiry).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <span className="px-4 py-2 bg-green-500 text-white rounded-full text-sm font-medium">
                Active
              </span>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-sm overflow-hidden ${
                plan.popular ? 'ring-2 ring-orange-500' : 'border border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-orange-500 text-white text-center py-1 text-sm font-medium">
                  Most Popular
                </div>
              )}
              
              <div className={`p-6 ${plan.popular ? 'pt-10' : ''}`}>
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-gray-500 text-sm">{plan.duration}</p>
                
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-bold text-gray-900">₹{plan.price.toLocaleString()}</span>
                  <span className="text-gray-500">/{plan.duration.toLowerCase()}</span>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading || (isActiveMember && profiles?.membership_plan === plan.id)}
                  className={`w-full py-3 rounded-lg font-medium transition-colors ${
                    plan.popular
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  } disabled:opacity-50`}
                >
                  {isActiveMember && profiles?.membership_plan === plan.id
                    ? 'Current Plan'
                    : loading
                    ? 'Processing...'
                    : 'Subscribe Now'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Benefits */}
        <div className="mt-12 bg-orange-50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Why Subscribe?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">👁️</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Get Discovered</h3>
              <p className="text-sm text-gray-600">Appear in our Artists directory and get discovered by art collectors</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💰</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Sell Your Art</h3>
              <p className="text-sm text-gray-600">List your artworks in our marketplace and reach buyers globally</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎨</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Join Exhibitions</h3>
              <p className="text-sm text-gray-600">Participate in virtual and physical exhibitions to showcase your work</p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4 max-w-2xl mx-auto">
            {[
              {
                q: 'Can I upgrade my plan later?',
                a: 'Yes, you can upgrade anytime. The remaining days from your current plan will be added to your new plan.',
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit/debit cards, UPI, net banking, and wallets through Razorpay.',
              },
              {
                q: 'Is there a refund policy?',
                a: 'We offer a 7-day refund policy if you\'re not satisfied with your membership.',
              },
            ].map((faq, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubscriptionPage;
