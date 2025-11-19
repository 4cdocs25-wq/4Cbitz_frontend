import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import { settingsAPI } from '../api';
import PolicyModal from '../components/PolicyModal';
import Footer from '../components/layout/Footer';

const Home = () => {
  const { handleGoogleLogin, user } = useAuth();
  const navigate = useNavigate();
  const loginSectionRef = useRef(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [policyModal, setPolicyModal] = useState({ isOpen: false, title: '', content: '' });

  const onGoogleSuccess = async (credentialResponse) => {
    setIsLoggingIn(true); // Show loader

    const result = await handleGoogleLogin(credentialResponse);

    if (result.success) {
      // Redirect based on role
      // Loader will stay visible until component unmounts
      if (result.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/documents');
      }
    } else {
      // Hide loader if login fails
      setIsLoggingIn(false);
    }
  };

  const onGoogleError = () => {
    console.error('Google Sign-In failed');
    alert('Failed to sign in with Google. Please try again.');
  };

  const handleAccessNow = () => {
    if (!user) {
      // Not logged in - trigger shake animation
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);

      // Then scroll to login section
      loginSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    } else {
      // Logged in - navigate to documents
      // (Documents page will handle payment check and redirect to /subscription if needed)
      navigate('/documents');
    }
  };

  const handlePolicyClick = async (policyType) => {
    try {
      let key, title;

      if (policyType === 'terms') {
        key = 'terms_of_service';
        title = 'Terms of Service';
      } else if (policyType === 'privacy') {
        key = 'privacy_policy';
        title = 'Privacy Policy';
      } else if (policyType === 'refund') {
        key = 'refund_policy';
        title = 'Refund Policy';
      }

      const response = await settingsAPI.getPublicByKey(key);

      if (response.success && response.data) {
        setPolicyModal({
          isOpen: true,
          title: title,
          content: response.data.value
        });
      }
    } catch (error) {
      console.error('Error fetching policy:', error);
      alert('Failed to load policy. Please try again.');
    }
  };

  const closePolicyModal = () => {
    setPolicyModal({ isOpen: false, title: '', content: '' });
  };

  return (
    <>
      <style>
        {`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
            20%, 40%, 60%, 80% { transform: translateX(10px); }
          }

          .animate-shake {
            animation: shake 0.5s ease-in-out;
          }
        `}
      </style>
      <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 min-h-[600px] flex items-center">
        {/* Background overlay with pattern */}
        <div className="absolute inset-0 bg-black/40"></div>
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'url(/background.jpeg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        ></div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Side - Text Content */}
            <div className="text-white space-y-6 sm:space-y-8">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                Establish and Launch Your Business Venture in the UAE with us
              </h1>
              <div>
                <button onClick={handleAccessNow} className="bg-white text-blue-900 hover:bg-gray-100 px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl">
                  Access Now →
                </button>
              </div>
            </div>

            {/* Right Side - Google Sign In Card */}
            <div ref={loginSectionRef} className="mt-8 lg:mt-0">
              <div className={`bg-gradient-to-br from-red-600 to-red-700 rounded-3xl p-8 lg:p-10 shadow-2xl border-2 border-red-400/50 backdrop-blur-sm ${isShaking ? 'animate-shake' : ''}`}>
                <div className="text-center mb-6 lg:mb-8">
                  <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2 lg:mb-3">
                    Start Your Journey Here!
                  </h2>
                  <p className="text-white/90 text-sm lg:text-base">
                    Sign in to access our comprehensive guide
                  </p>
                </div>

                <div className="space-y-4 lg:space-y-6">
                  {/* Terms Acceptance Checkbox */}
                  <div className="flex items-start gap-3 px-2">
                    <input
                      type="checkbox"
                      id="acceptTerms"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-0.5 w-5 h-5 rounded border-2 border-white bg-white/20 text-red-600 focus:ring-2 focus:ring-white/50 cursor-pointer flex-shrink-0"
                    />
                    <label htmlFor="acceptTerms" className="text-white text-xs lg:text-sm leading-relaxed">
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePolicyClick('terms');
                        }}
                        className="font-bold underline hover:text-white/80 transition-colors"
                      >
                        Terms of Service
                      </button>
                      {', '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePolicyClick('privacy');
                        }}
                        className="font-bold underline hover:text-white/80 transition-colors"
                      >
                        Privacy Policy
                      </button>
                      {' '}and{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePolicyClick('refund');
                        }}
                        className="font-bold underline hover:text-white/80 transition-colors"
                      >
                        Refund Policy
                      </button>
                    </label>
                  </div>

                  {/* Google Login Button */}
                  <div className={`flex justify-center ${!acceptedTerms ? 'opacity-50 pointer-events-none' : ''}`}>
                    <GoogleLogin
                      onSuccess={onGoogleSuccess}
                      onError={onGoogleError}
                      theme="filled_blue"
                      size="large"
                      text="continue_with"
                      shape="pill"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What You'll Discover Section */}
      <div className="bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Side - Professional Image */}
            <div className="order-2 lg:order-1">
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="/card.jpeg"
                  alt="Professional business team"
                  className="w-full h-[400px] sm:h-[500px] object-cover"
                />
              </div>
            </div>

            {/* Right Side - Content */}
            <div className="order-1 lg:order-2 text-white space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold">
                What You'll Discover Inside the Guide
              </h2>
              <p className="text-lg text-gray-200">
                A comprehensive guide to establishing and launching businesses in the UAE. Collated by experts
                in the field, to help entrepreneurs, business owners save time, money and efforts.
                Find relevant and updated information on:
              </p>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-semibold text-lg">Company Structures</h3>
                    <p className="text-gray-300">Mainland, Free Zone & Offshore</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-semibold text-lg">Licensing Requirements</h3>
                    <p className="text-gray-300">Choose the right activity and licence</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-semibold text-lg">Legal & Regulatory Compliance</h3>
                    <p className="text-gray-300">Going by the book</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-semibold text-lg">Step-by-Step Application Process</h3>
                    <p className="text-gray-300">From documentation and preapprovals to licence</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-semibold text-lg">Business Essentials</h3>
                    <p className="text-gray-300">
                      Industry specific, Authority approvals, Certifications, Banking, Immigration
                      services, Customs, Offices and warehousing
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-semibold text-lg">Market Insights</h3>
                    <p className="text-gray-300">Market dynamics explained</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button onClick={handleAccessNow} className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                  Access Now →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Login Loading Overlay */}
      {isLoggingIn && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-gray-700 font-semibold text-lg">Signing you in...</p>
              <p className="text-gray-500 text-sm">Please wait</p>
            </div>
          </div>
        </div>
      )}

      {/* Policy Modal */}
      <PolicyModal
        isOpen={policyModal.isOpen}
        onClose={closePolicyModal}
        title={policyModal.title}
        content={policyModal.content}
      />

      {/* Footer */}
      <Footer onPolicyClick={handlePolicyClick} />
    </>
  );
};

export default Home;
