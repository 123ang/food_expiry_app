import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const PrivacyPolicy: React.FC = () => {
  const { language } = useLanguage();

  const getCurrentDate = () => {
    return new Date().toLocaleDateString(language === 'en' ? 'en-US' : 
           language === 'zh' ? 'zh-CN' : language === 'ja' ? 'ja-JP' : 'ms-MY');
  };

  return (
    <div className="privacy-policy">
      <div className="container">
        <Link to="/" className="privacy-policy__back">
          ← Back to Home
        </Link>
        <h1 className="privacy-policy__title">Privacy Policy – Expiry Alert</h1>
        <p className="privacy-policy__updated">Last updated: {getCurrentDate()}</p>

        <div className="privacy-policy__content">
          <section>
            <h2>1. Introduction</h2>
            <p>
              Welcome to Expiry Alert ("we," "our," or "us"). This Privacy Policy explains how we handle your information when you use our mobile application and web service. Our app helps you track food expiration dates and manage your pantry to reduce food waste.
            </p>
            <p>
              <strong>Important Note:</strong> This privacy policy covers both our mobile application and web service, which have different data handling practices:
            </p>
            <ul>
              <li><strong>Mobile Application:</strong> All data is stored locally on your device. No personal information is collected or transmitted to our servers.</li>
              <li><strong>Web Application:</strong> Requires account creation and data is stored in the cloud for synchronization across devices.</li>
            </ul>
          </section>

          <section>
            <h2>2. Information We Collect</h2>
            <h3>Mobile Application – NO DATA COLLECTION</h3>
            <div className="privacy-policy__highlight">
              <p>Our mobile application does NOT collect any personal information or data from your device. All information is stored locally on your phone and never transmitted to our servers.</p>
              <ul>
                <li>No account creation required</li>
                <li>No login credentials collected</li>
                <li>All food item data stays on your device</li>
                <li>No photos are uploaded to our servers</li>
                <li>No usage analytics collected</li>
                <li>No personal information transmitted</li>
              </ul>
            </div>

            <h3>Web Application – Data Collection</h3>
            <p>The following applies ONLY to our web application (accessed through a browser):</p>
            <h4>Personal Information (Web App Only)</h4>
            <ul>
              <li>Email address (for account creation and authentication)</li>
              <li>Food item data (names, expiration dates, categories, locations, notes)</li>
              <li>Photos of food items (optional, stored securely in cloud)</li>
              <li>User preferences and settings</li>
            </ul>
            <h4>Device Information (Web App Only)</h4>
            <ul>
              <li>Browser type and version</li>
              <li>Basic usage analytics (anonymized)</li>
              <li>Error logs (for app improvement)</li>
              <li>Language and timezone preferences</li>
            </ul>
          </section>

          <section>
            <h2>3. How We Use Your Information</h2>
            <h3>Mobile Application</h3>
            <div className="privacy-policy__highlight">
              <p>Since our mobile application does not collect any data, we do not use your information in any way. All functionality operates entirely on your device.</p>
            </div>
            <h3>Web Application Only</h3>
            <p>For users of our web application, we use collected information to:</p>
            <ul>
              <li>Provide and maintain the food tracking service</li>
              <li>Send expiration date notifications and reminders</li>
              <li>Sync your data across devices when logged in</li>
              <li>Improve app performance and user experience</li>
              <li>Provide customer support and respond to inquiries</li>
              <li>Generate anonymized usage statistics for app improvement</li>
            </ul>
          </section>

          <section>
            <h2>4. Data Storage and Security</h2>
            <h3>Mobile Application</h3>
            <div className="privacy-policy__highlight">
              <p>All data in the mobile application is stored locally on your device using your phone's secure storage. We do not have access to this data and cannot view, modify, or delete it. Your data security depends on your device's security features.</p>
              <ul>
                <li>Data stored in your device's local database</li>
                <li>Protected by your device's security features</li>
                <li>No transmission to external servers</li>
                <li>You have complete control over your data</li>
              </ul>
            </div>
            <h3>Web Application</h3>
            <p>
              For our web application, your data is stored securely using Google Firebase services with industry-standard encryption. We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. Data is backed up regularly and stored in secure, geographically distributed data centers.
            </p>
            <ul>
              <li>All data transmission is encrypted using HTTPS/TLS</li>
              <li>Personal data is encrypted at rest</li>
              <li>Access to user data is restricted to authorized personnel only</li>
              <li>Regular security audits and vulnerability assessments</li>
            </ul>
          </section>

          <section>
            <h2>5. Data Sharing and Third Parties</h2>
            <h3>Mobile Application</h3>
            <div className="privacy-policy__highlight">
              <p>Since our mobile application does not collect any data, there is no data to share with third parties. Your information never leaves your device.</p>
            </div>
            <h3>Web Application</h3>
            <p>For our web application, we do not sell, trade, or rent your personal information to third parties. We may share information only in the following circumstances:</p>
            <ul>
              <li>With your explicit consent</li>
              <li>To comply with legal obligations or court orders</li>
              <li>With trusted service providers (like Firebase) who assist in app operations</li>
              <li>In case of a business merger or acquisition (users will be notified)</li>
            </ul>
          </section>

          <section>
            <h2>6. Your Rights and Choices</h2>
            <ul>
              <li>Access and download your data at any time through the app</li>
              <li>Edit or delete your food items and personal information</li>
              <li>Delete your account and all associated data permanently</li>
              <li>Opt out of notifications (though this may affect app functionality)</li>
              <li>Request data portability or correction of inaccurate information</li>
              <li>Withdraw consent for data processing (where applicable)</li>
            </ul>
          </section>

          <section>
            <h2>7. Data Retention</h2>
            <p>
              We retain your personal information only as long as necessary to provide our services and fulfill the purposes outlined in this Privacy Policy. When you delete your account, we will permanently delete your data within 30 days, except where we are required to retain it by law.
            </p>
            <ul>
              <li>Active accounts: Data retained while account is active</li>
              <li>Inactive accounts: Data may be deleted after 2 years of inactivity</li>
              <li>Deleted accounts: Data permanently removed within 30 days</li>
              <li>Legal requirements: Some data may be retained longer if required by law</li>
            </ul>
          </section>

          <section>
            <h2>8. Children's Privacy</h2>
            <p>
              Our app is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us to have that information deleted.
            </p>
          </section>

          <section>
            <h2>9. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own. We ensure that such transfers comply with applicable data protection laws and that your data receives adequate protection wherever it is processed.
            </p>
          </section>

          <section>
            <h2>10. Cookies and Tracking Technologies</h2>
            <p>Our web application may use cookies and similar tracking technologies to enhance user experience. These include:</p>
            <ul>
              <li>Essential cookies for app functionality</li>
              <li>Analytics cookies to understand app usage (anonymized)</li>
              <li>Preference cookies to remember your settings</li>
            </ul>
            <p>You can control cookie settings through your browser preferences.</p>
          </section>

          <section>
            <h2>11. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. Significant changes will be communicated through in-app notifications or email.
            </p>
          </section>

          <section>
            <h2>12. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy or our data practices, please contact us:</p>
            <div className="privacy-policy__contact-box">
              <p><strong>Email:</strong> <a href="mailto:suntzutechnologies@gmail.com">suntzutechnologies@gmail.com</a></p>
              <p><strong>Response time:</strong> We aim to respond within 48 hours.</p>
            </div>
          </section>

          <section>
            <h2>13. Legal Compliance</h2>
            <p>This Privacy Policy complies with applicable data protection regulations including:</p>
            <ul>
              <li>General Data Protection Regulation (GDPR)</li>
              <li>California Consumer Privacy Act (CCPA)</li>
              <li>Personal Data Protection Act (PDPA) – Malaysia</li>
              <li>Personal Information Protection Law (PIPL) – China</li>
              <li>Other applicable regional privacy laws</li>
            </ul>
            <p>Our legal basis for processing your data includes consent, legitimate interests, contract performance, and legal obligations.</p>
          </section>

          <section>
            <h2>14. Mobile App Permissions</h2>
            <p>
              Our mobile app requests the following permissions to function properly. <strong>All data remains on your device and is never transmitted to our servers:</strong>
            </p>
            <ul>
              <li><strong>Camera:</strong> To take photos of food items for better organization (photos stored locally only)</li>
              <li><strong>Photo Library:</strong> To select existing photos for food items (photos remain on your device)</li>
              <li><strong>Notifications:</strong> To send local expiration reminders (generated on your device)</li>
              <li><strong>Storage:</strong> To save app data and photos locally on your device</li>
            </ul>
            <p>All permissions are optional and can be revoked at any time through your device settings. The app will continue to function with limited features if permissions are denied.</p>
            <div className="privacy-policy__highlight privacy-policy__highlight--guarantee">
              <p>🔒 Privacy Guarantee: Even with these permissions, no data is transmitted from your mobile device to our servers.</p>
            </div>
          </section>
        </div>

        <div className="privacy-policy__footer">
          <p>By using Expiry Alert, you acknowledge that you have read and understood this Privacy Policy.</p>
          <p className="privacy-policy__footer-copy">© {new Date().getFullYear()} Sun Tzu Technologies. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 