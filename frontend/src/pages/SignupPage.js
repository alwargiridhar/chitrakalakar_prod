import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ART_CATEGORIES } from '../utils/branding';
import LocationAutocomplete from '../components/LocationAutocomplete';

function SignupPage() {
  const [step, setStep] = useState('role');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    categories: [],
    location: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { signup, loginWithGoogle, isAuthenticated, isSupabaseConfigured } = useAuth();

  // Single source of navigation truth
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleRoleSelect = (role) => {
    setFormData((prev) => ({ ...prev, role }));
    setStep('details');
  };

  const handleCategoryToggle = (category) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  const handleGoogleSignup = async () => {
    setError('');
    setIsGoogleLoading(true);

    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err.message || 'Google signup failed. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        location: formData.location,
        categories: formData.categories,
      });
      // navigation happens via auth state
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-gray-50 via-white to-orange-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-lg rounded-xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-center mb-2">
            {step === 'role' ? 'Create Your Account' : 'Tell Us About You'}
          </h2>
          <p className="text-center text-sm text-gray-500 mb-6">
            {step === 'role'
              ? 'Choose your role to get started'
              : 'Complete your profile'}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {step === 'role' ? (
            <div className="space-y-3">
              {/* Google Sign Up Button */}
              <button
                onClick={handleGoogleSignup}
                disabled={isGoogleLoading || !isSupabaseConfigured}
                className="w-full py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-3 mb-4"
                data-testid="google-signup-btn"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {isGoogleLoading ? 'Signing up...' : 'Continue with Google'}
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or select your role</span>
                </div>
              </div>

              <button
                onClick={() => handleRoleSelect('user')}
                className="w-full h-24 bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-lg flex flex-col items-center justify-center gap-2"
                data-testid="role-user-btn"
              >
                <span className="text-2xl">🛒</span>
                <div>
                  <div className="font-semibold">I Want to Commission</div>
                  <div className="text-xs opacity-90">
                    Browse & order artwork
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleRoleSelect('artist')}
                className="w-full h-24 bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-lg flex flex-col items-center justify-center gap-2"
                data-testid="role-artist-btn"
              >
                <span className="text-2xl">🎨</span>
                <div>
                  <div className="font-semibold">I am an Artist</div>
                  <div className="text-xs opacity-90">
                    Sell your artworks (requires approval)
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleRoleSelect('institution')}
                className="w-full h-24 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-lg flex flex-col items-center justify-center gap-2"
                data-testid="role-institution-btn"
              >
                <span className="text-2xl">🏛️</span>
                <div>
                  <div className="font-semibold">
                    I Represent an Institution
                  </div>
                  <div className="text-xs opacity-90">
                    Bulk commissions
                  </div>
                </div>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Your name"
                  data-testid="signup-name-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="your@email.com"
                  data-testid="signup-email-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="••••••••"
                  data-testid="signup-password-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <LocationAutocomplete
                  value={formData.location}
                  onChange={(location) => setFormData({ ...formData, location })}
                  placeholder="Start typing your city..."
                />
              </div>

              {formData.role === 'artist' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Art Categories (select multiple)</label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3">
                    {ART_CATEGORIES.map((cat) => (
                      <label key={cat} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.categories.includes(cat)}
                          onChange={() => handleCategoryToggle(cat)}
                          className="w-4 h-4 text-orange-500 border-gray-300 rounded"
                        />
                        <span className="text-sm">{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
                data-testid="signup-submit-btn"
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </button>

              <button
                type="button"
                onClick={() => setStep('role')}
                className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Back to Role Selection
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-orange-500 font-semibold hover:text-orange-600"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
