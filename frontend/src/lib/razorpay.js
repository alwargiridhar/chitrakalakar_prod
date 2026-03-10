export const loadRazorpayScript = async () => {
  if (window.Razorpay) return true;

  return new Promise((resolve) => {
    const existing = document.querySelector('script[data-razorpay-sdk="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true), { once: true });
      existing.addEventListener('error', () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.setAttribute('data-razorpay-sdk', 'true');
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};
