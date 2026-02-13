import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const TermsAndConditions: React.FC = () => {
  const { language } = useLanguage();

  const getCurrentDate = () => {
    return new Date().toLocaleDateString(
      language === 'en' ? 'en-US' : language === 'zh' ? 'zh-CN' : language === 'ja' ? 'ja-JP' : 'en-US'
    );
  };

  return (
    <div className="terms-policy">
      <div className="container terms-policy__container">
        <Link to="/" className="terms-policy__back">
          ← Back to Home
        </Link>
        <h1 className="terms-policy__title">Terms &amp; Conditions</h1>
        <p className="terms-policy__updated">Expiry Alert · Last updated: {getCurrentDate()}</p>

        <div className="terms-policy__content">
          <p className="terms-policy__intro">
            Welcome to Expiry Alert. These Terms &amp; Conditions (“Terms”) govern your use of the Expiry Alert mobile application (“App”) provided by Sun Tzu Technologies (“we”, “our”, “us”).
          </p>
          <p>
            By downloading or using the App, you agree to these Terms. If you do not agree, please do not use the App.
          </p>

          <hr className="terms-policy__hr" />

          <section>
            <h2>1. Purpose of the App</h2>
            <p>Expiry Alert is a personal reminder tool designed to help users track expiration dates for food, medicine, and other items.</p>
            <ul>
              <li>The App provides notifications and reminders only.</li>
              <li>It does NOT guarantee product safety, freshness, or usability.</li>
              <li>Users remain fully responsible for checking actual product conditions before use or consumption.</li>
            </ul>
          </section>

          <hr className="terms-policy__hr" />

          <section>
            <h2>2. User Responsibilities</h2>
            <p>You agree that:</p>
            <ul>
              <li>You will use the App for lawful purposes only</li>
              <li>You understand reminders may fail due to device settings, OS restrictions, or connectivity issues</li>
              <li>You will not rely solely on the App for health, medical, or safety decisions</li>
              <li>You are responsible for verifying expiration dates manually</li>
            </ul>
            <p>We are not liable for any damage, illness, loss, or injury caused by expired or unsafe items.</p>
          </section>

          <hr className="terms-policy__hr" />

          <section>
            <h2>3. Notifications Disclaimer</h2>
            <p>The App depends on:</p>
            <ul>
              <li>Device notification permissions</li>
              <li>Battery optimization settings</li>
              <li>Operating system limitations</li>
              <li>Internet availability (for some features)</li>
            </ul>
            <p>Therefore, notifications are not guaranteed to always be delivered on time or at all.</p>
          </section>

          <hr className="terms-policy__hr" />

          <section>
            <h2>4. Data &amp; Storage</h2>
            <p>The App may store data locally on your device and/or cloud storage (if enabled). You are responsible for maintaining backups of important information.</p>
            <p>We are not responsible for data loss caused by: device reset, app uninstall, OS updates, or system failure.</p>
          </section>

          <hr className="terms-policy__hr" />

          <section>
            <h2>5. Prohibited Use</h2>
            <p>You may not:</p>
            <ul>
              <li>Reverse engineer the App</li>
              <li>Attempt to hack or modify the App</li>
              <li>Use the App for illegal purposes</li>
              <li>Copy or redistribute the App without permission</li>
            </ul>
          </section>

          <hr className="terms-policy__hr" />

          <section>
            <h2>6. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Sun Tzu Technologies shall not be liable for:</p>
            <ul>
              <li>spoiled food</li>
              <li>expired medicine usage</li>
              <li>health issues</li>
              <li>financial loss</li>
              <li>missed reminders</li>
              <li>data loss</li>
            </ul>
            <p>The App is provided “AS IS” without warranties of any kind.</p>
          </section>

          <hr className="terms-policy__hr" />

          <section>
            <h2>7. Updates &amp; Changes</h2>
            <p>We may update the App and modify these Terms at any time. Continued use of the App after changes means you accept the updated Terms.</p>
          </section>

          <hr className="terms-policy__hr" />

          <section>
            <h2>8. Termination</h2>
            <p>We may suspend or terminate access to the App if the Terms are violated.</p>
          </section>

          <hr className="terms-policy__hr" />

          <section>
            <h2>9. Governing Law</h2>
            <p>These Terms shall be governed by applicable international consumer software regulations and digital service laws.</p>
          </section>

          <hr className="terms-policy__hr" />

          <section>
            <h2>10. Contact</h2>
            <p>For any questions regarding these Terms:</p>
            <p>
              <a href="mailto:suntzutechnologies@gmail.com">suntzutechnologies@gmail.com</a>
            </p>
          </section>

          <hr className="terms-policy__hr" />

          <section>
            <h2>11. Copyright</h2>
            <p>© Sun Tzu Technologies. All rights reserved.</p>
            <p>You may not copy, reproduce, or distribute any part of the App without written permission.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
