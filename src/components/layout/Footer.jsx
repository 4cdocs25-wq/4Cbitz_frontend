import React, { useState, useEffect } from 'react';
import { settingsAPI } from '../../api';

const Footer = ({ onPolicyClick }) => {
  const [footerData, setFooterData] = useState({
    address: 'P O Box 48707, Level 14, Boulevard Plaza Tower 1, Downtown Dubai, Dubai, UAE.',
    email: '4cdoc@4CBZ.com',
    tel: '+971 4 2288006'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFooterData = async () => {
      try {
        const [addressRes, emailRes, telRes] = await Promise.all([
          settingsAPI.getPublicByKey('footer_address').catch(() => ({ data: null })),
          settingsAPI.getPublicByKey('footer_email').catch(() => ({ data: null })),
          settingsAPI.getPublicByKey('footer_tel').catch(() => ({ data: null }))
        ]);

        setFooterData({
          address: addressRes.data?.value || 'P O Box 48707, Level 14, Boulevard Plaza Tower 1, Downtown Dubai, Dubai, UAE.',
          email: emailRes.data?.value || '4cdoc@4CBZ.com',
          tel: telRes.data?.value || '+971 4 2288006'
        });
      } catch (error) {
        console.error('Error fetching footer data:', error);
        // Keep default values on error
      } finally {
        setLoading(false);
      }
    };

    fetchFooterData();
  }, []);

  if (loading) {
    return (
      <footer className="bg-gray-50 border-t border-gray-200 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center text-gray-400">Loading...</div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-gray-900">
                4C BZ MANAGEMENT SERVICES
              </h3>
              <img
                src="/PNG/Vertical_Logo.png"
                alt="4C BZ Management Services Logo"
                className="h-7"
              />
            </div>
            <p className="text-gray-600 text-sm">
              A Vertical of 4C Integrated Communicators
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onPolicyClick && onPolicyClick('terms')}
                  className="text-gray-600 hover:text-red-600 transition-colors text-sm"
                >
                  Terms of Services
                </button>
              </li>
              <li>
                <button
                  onClick={() => onPolicyClick && onPolicyClick('privacy')}
                  className="text-gray-600 hover:text-red-600 transition-colors text-sm"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onPolicyClick && onPolicyClick('refund')}
                  className="text-gray-600 hover:text-red-600 transition-colors text-sm"
                >
                  Refund Policy
                </button>
              </li>
            </ul>
          </div>

          {/* Address */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Address</h4>
            <div className="space-y-2 text-sm">
              <p className="text-gray-600">{footerData.address}</p>
              <p className="text-gray-600">
                Email:{' '}
                <a
                  href={`mailto:${footerData.email}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {footerData.email}
                </a>
              </p>
              <p className="text-gray-600">
                Tel:{' '}
                <a
                  href={`tel:${footerData.tel}`}
                  className="text-gray-900 hover:text-red-600 transition-colors"
                >
                  {footerData.tel}
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-600">
            Copyright @2025 4C BZ Management Services
          </p>
          <p className="text-sm text-gray-600">
            Designed by 4C Integrated Communicators
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
