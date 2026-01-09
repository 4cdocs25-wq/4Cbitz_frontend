import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import App from './App.jsx';

// Capture affiliate and UTM tracking params on page load
(function captureTrackingParams() {
  const urlParams = new URLSearchParams(window.location.search);

  // Check if we have any tracking params
  const affiliateCode = urlParams.get('ref');
  const utmSource = urlParams.get('utm_source');
  const utmMedium = urlParams.get('utm_medium');
  const utmCampaign = urlParams.get('utm_campaign');
  const utmContent = urlParams.get('utm_content');

  // Only store if we have at least one param (new visit with tracking)
  if (affiliateCode || utmSource || utmMedium || utmCampaign || utmContent) {
    const trackingData = {
      affiliate_code: affiliateCode,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      utm_content: utmContent,
      referrer: document.referrer || null,
      captured_at: Date.now()
    };

    localStorage.setItem('lead_tracking_data', JSON.stringify(trackingData));
  }
})();

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <App />
  </GoogleOAuthProvider>
);
