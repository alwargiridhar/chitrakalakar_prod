import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { membershipAPI } from '../services/api';

function SubscriptionPage() {
  const { profiles, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [applyingVoucher, setApplyingVoucher] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await membershipAPI.getPlans();
      setPlans(response.plans || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      // Fallback to default plans
      setPlans([
        {
          id: 'basic',
          name: 'Basic',
          price: 999,
          duration: '1 Month',
          duration_days: 30,
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
          duration_days: 90,
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
          duration_days: 365,
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
    } finally {
      setPlansLoading(false);
    }
  };

  const isActiveMember = profiles?.is_member && profiles?.membership_expiry && 
    new Date(profiles.membership_expiry) > new Date();

  const handleApplyVoucher = async (planId) => {
    if (!voucherCode.trim()) return;
    
    setApplyingVoucher(true);
    try {
      const response = await membershipAPI.applyVoucher(voucherCode, planId);
      setAppliedVoucher({
        ...response,
        code: voucherCode,
        planId: planId,
      });
    } catch (error) {
      alert(error.message || 'Invalid voucher code');
      setAppliedVoucher(null);
    } finally {
      setApplyingVoucher(false);
    }
  };

  const calculateDiscountedPrice = (plan) => {
    if (!plan || plan.price === undefined || plan.price === null) return 0;
    if (!appliedVoucher || appliedVoucher.planId !== plan.id) return plan.price;
    
    if (appliedVoucher.discount_type === 'percentage') {
      return Math.round(plan.price * (1 - appliedVoucher.discount_value / 100));
    } else {
      return Math.max(0, plan.price - appliedVoucher.discount_value);
    }
  };

  const handleSubscribe = async (planId) => {
    setLoading(true);
    try {
      const response = await membershipAPI.initiateMembership(
        planId, 
        appliedVoucher?.planId === planId ? appliedVoucher.code : null
      );
      
      if (response.razorpay_order_id) {
        // Initialize Razorpay
        const options = {
          key: response.razorpay_key || response.key_id,
          amount: response.amount,
          currency: 'INR',
          name: 'ChitraKalakar',
          description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Membership`,
          order_id: response.razorpay_order_id,
          handler: async function (razorpayResponse) {
            try {
              await membershipAPI.verifyPayment({
                razorpay_order_id: razorpayResponse.razorpay_order_id,
                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                razorpay_signature: razorpayResponse.razorpay_signature,
              });
              await refreshProfile();
              alert('Membership activated successfully!');
            } catch (error) {
              alert('Payment verification failed. Please contact support.');
            }
          },
          prefill: {
            email: profiles?.email,
            name: profiles?.full_name,
          },
          theme: {
            color: '#F97316',
          },
          modal: {
            ondismiss: function() {
              setLoading(false);
            }
          }
        };
        
        const razorpay = new window.Razorpay(options);
        razorpay.on('payment.failed', function (response) {
          alert('Payment failed: ' + response.error.description);
          setLoading(false);
        });
        razorpay.open();
      } else {
        alert('Failed to create payment order. Please try again.');
      }
    } catch (error) {
      alert(error.message || 'Failed to initiate payment. Please ensure Razorpay is configured.');
    } finally {
      setLoading(false);
    }
  };

  if (plansLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-6 h-96"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8" data-testid="subscription-page">
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
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">✓</span>
                </div>
                <div>
                  <h3 className="font-semibold text-green-800">Active Membership</h3>
                  <p className="text-green-600">
                    Plan: <span className="font-medium capitalize">{profiles?.membership_type || profiles?.membership_plan || 'Basic'}</span> • 
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

        {/* Voucher Code Input */}
        <div className="mb-8 bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">Have a voucher code?</h3>
          <div className="flex gap-3 flex-wrap">
            <input
              type="text"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              placeholder="Enter voucher code"
              className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 font-mono uppercase"
              data-testid="voucher-input"
            />
            <button
              onClick={() => handleApplyVoucher(plans[0]?.id)}
              disabled={applyingVoucher || !voucherCode.trim()}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
            >
              {applyingVoucher ? 'Applying...' : 'Apply'}
            </button>
          </div>
          {appliedVoucher && (
            <div className="mt-3 flex items-center gap-2 text-green-600">
              <span>✓</span>
              <span>
                Voucher applied! {appliedVoucher.discount_type === 'percentage' 
                  ? `${appliedVoucher.discount_value}% off` 
                  : `₹${appliedVoucher.discount_value} off`}
              </span>
              <button 
                onClick={() => { setAppliedVoucher(null); setVoucherCode(''); }}
                className="ml-2 text-red-500 hover:underline text-sm"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const discountedPrice = calculateDiscountedPrice(plan);
            const hasDiscount = appliedVoucher?.planId === plan.id && discountedPrice < plan.price;
            
            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-sm overflow-hidden ${
                  plan.popular ? 'ring-2 ring-orange-500' : 'border border-gray-200'
                }`}
                data-testid={`plan-${plan.id}`}
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
                    {hasDiscount ? (
                      <>
                        <span className="text-2xl text-gray-400 line-through mr-2">₹{plan.price.toLocaleString()}</span>
                        <span className="text-4xl font-bold text-green-600">₹{discountedPrice.toLocaleString()}</span>
                      </>
                    ) : (
                      <span className="text-4xl font-bold text-gray-900">₹{plan.price.toLocaleString()}</span>
                    )}
                    <span className="text-gray-500">/{plan.duration.toLowerCase()}</span>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {(plan.features || []).map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={loading || (isActiveMember && (profiles?.membership_type === plan.id || profiles?.membership_plan === plan.id))}
                    className={`w-full py-3 rounded-lg font-medium transition-colors ${
                      plan.popular
                        ? 'bg-orange-500 text-white hover:bg-orange-600'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    } disabled:opacity-50`}
                    data-testid={`subscribe-${plan.id}-btn`}
                  >
                    {isActiveMember && (profiles?.membership_type === plan.id || profiles?.membership_plan === plan.id)
                      ? 'Current Plan'
                      : loading
                      ? 'Processing...'
                      : 'Subscribe Now'}
                  </button>
                </div>
              </div>
            );
          })}
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
