import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { handleGoogleLogin, user } = useAuth();
  const navigate = useNavigate();
  const loginSectionRef = useRef(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

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
            backgroundImage: 'url(https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070)',
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
                    Sign in to access our comprehensive business setup guide
                  </p>
                </div>

                <div className="space-y-4 lg:space-y-6">
                  {/* Google Login Button */}
                  <div className="flex justify-center">
                    <GoogleLogin
                      onSuccess={onGoogleSuccess}
                      onError={onGoogleError}
                      theme="filled_blue"
                      size="large"
                      text="continue_with"
                      shape="pill"
                      width="100%"
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/30"></div>
                    </div>
                    <div className="relative flex justify-center text-xs lg:text-sm">
                      <span className="px-3 lg:px-4 bg-red-600 text-white/70">Secure & Fast</span>
                    </div>
                  </div>

                  <div className="bg-white/10 rounded-lg p-3 lg:p-4 backdrop-blur-sm">
                    <p className="text-white/90 text-xs lg:text-sm text-center leading-relaxed">
                      By signing in, you agree to our Terms of Service and Privacy Policy
                    </p>
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
                  src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2070"
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
    </>
  );
};

export default Home;
