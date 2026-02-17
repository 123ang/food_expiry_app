import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import { Button, FeatureCard, SectionHeader, StepCard } from './landing';
import './LandingPage.css';

/** Carousel slides: titleKey, image, altKey, descKey (brief explanation). Add translations in LanguageContext. */
const SCREENSHOT_SLIDES = [
  { titleKey: 'landing.screenshotAddItem', image: '/screenshot-add-item.png', altKey: 'landing.screenshotAddItem', descKey: 'landing.screenshotAddItemDesc' },
  { titleKey: 'landing.screenshotCalendar', image: '/screenshot-calendar.png', altKey: 'landing.screenshotCalendar', descKey: 'landing.screenshotCalendarDesc' },
  { titleKey: 'landing.screenshotShoppingList', image: '/screenshot-shopping-list.png', altKey: 'landing.screenshotShoppingList', descKey: 'landing.screenshotShoppingListDesc' },
  { titleKey: 'landing.screenshotWishlist', image: '/screenshot-wishlist.png', altKey: 'landing.screenshotWishlist', descKey: 'landing.screenshotWishlistDesc' },
  { titleKey: 'landing.screenshotNotifications', image: '/screenshot-notifications.png', altKey: 'landing.screenshotNotifications', descKey: 'landing.screenshotNotificationsDesc' },
  { titleKey: 'landing.screenshotTheme', image: '/screenshot-theme.png', altKey: 'landing.screenshotTheme', descKey: 'landing.screenshotThemeDesc' },
  { titleKey: 'landing.screenshotGroups', image: '/screenshot-groups.png', altKey: 'landing.screenshotGroups', descKey: 'landing.screenshotGroupsDesc' },
] as const;

const LandingPage: React.FC = () => {
  const { t } = useLanguage();
  const [navScrolled, setNavScrolled] = useState(false);
  const [howVisible, setHowVisible] = useState(false);
  const [featuresVisible, setFeaturesVisible] = useState(false);
  const [screenshotIndex, setScreenshotIndex] = useState(0);
  const [displayedScreenshotIndex, setDisplayedScreenshotIndex] = useState(0);
  const [screenshotImageLoaded, setScreenshotImageLoaded] = useState(false);
  const howRef = useRef<HTMLElement | null>(null);
  const featuresRef = useRef<HTMLElement | null>(null);
  const screenshotPanelRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number>(0);

  /* Preload next image before swapping so the panel never goes blank (no glitch). */
  const isPreloading = screenshotIndex !== displayedScreenshotIndex;

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const el = howRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setHowVisible(true);
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = featuresRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setFeaturesVisible(true);
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /* Swipe left/right on screenshot panel (mobile) */
  useEffect(() => {
    const panel = screenshotPanelRef.current;
    if (!panel) return;
    const SWIPE_THRESHOLD = 50;
    const handleStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };
    const handleEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const delta = endX - touchStartX.current;
      if (Math.abs(delta) < SWIPE_THRESHOLD) return;
      if (delta > 0) {
        setScreenshotIndex((i) => (i - 1 + SCREENSHOT_SLIDES.length) % SCREENSHOT_SLIDES.length);
      } else {
        setScreenshotIndex((i) => (i + 1) % SCREENSHOT_SLIDES.length);
      }
    };
    panel.addEventListener('touchstart', handleStart, { passive: true });
    panel.addEventListener('touchend', handleEnd, { passive: true });
    return () => {
      panel.removeEventListener('touchstart', handleStart);
      panel.removeEventListener('touchend', handleEnd);
    };
  }, []);

  return (
    <div className="landing-page lp">
      {/* 1) Top Navbar – sticky, blurred on scroll */}
      <nav className={`lp-nav ${navScrolled ? 'scrolled' : ''}`} aria-label="Main navigation">
        <div className="lp-container">
          <Link to="/" className="lp-nav__brand" aria-label="Expiry Alert home">
            {/* TODO: Replace with final logo asset if different from /food_expiry_logo.png */}
            <img src="/food_expiry_logo.png" alt="" className="lp-nav__logo" />
            <span>Expiry Alert</span>
          </Link>
          <div className="lp-nav__right">
            <LanguageSwitcher className="lp-lang-wrap" />
            <Button to="/login" variant="primary" size="md">
              {t('landing.launchWebApp')}
            </Button>
            <a href="#download" className="lp-btn lp-btn--secondary lp-btn--md">
              {t('landing.download')}
            </a>
          </div>
        </div>
      </nav>

      {/* 2) Hero Section */}
      <section className="lp-hero" aria-labelledby="hero-title">
        <div className="lp-hero__bg" aria-hidden="true" />
        <div className="lp-hero__blob lp-hero__blob--1" aria-hidden="true" />
        <div className="lp-hero__blob lp-hero__blob--2" aria-hidden="true" />
        <div className="lp-container">
          <div className="lp-hero__content">
            <h1 id="hero-title" className="lp-hero__title">
              {t('landing.heroTitle')}
            </h1>
            <p className="lp-hero__subline">
              {t('landing.heroSubline')}
            </p>
            <div className="lp-hero__ctas">
              <Button to="/login" variant="primary" size="lg">
                {t('landing.launchWebApp')}
              </Button>
              <Button href="#download" variant="secondary" size="lg" className="lp-hero__download-btn">
                <span className="lp-hero__download-icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                </span>
                {t('landing.downloadApp')}
              </Button>
            </div>
            <div className="lp-hero__chips">
              <span className="lp-hero__chip">{t('landing.trustOffline')}</span>
              <span className="lp-hero__chip">{t('landing.trustSync')}</span>
              <span className="lp-hero__chip">{t('landing.trustPrivacy')}</span>
            </div>
          </div>
          <div className="lp-hero__visual">
            <div className="lp-hero__phone" aria-hidden="true">
              <img
                src="/hero-dashboard.png"
                alt="Expiry Alert app dashboard (homepage)"
                className="lp-hero__phone-screen"
              />
            </div>
            <div className="lp-hero__badges">
              <span className="lp-hero__badge lp-hero__badge--1">
                <span aria-hidden="true">🍎</span> {t('dashboard.fresh')}
              </span>
              <span className="lp-hero__badge lp-hero__badge--2">
                <span aria-hidden="true">⚠️</span> {t('status.expiring')}
              </span>
              <span className="lp-hero__badge lp-hero__badge--3">
                <span aria-hidden="true">📱</span> {t('landing.smartAlerts')}
              </span>
              <span className="lp-hero__badge lp-hero__badge--4">
                <span aria-hidden="true">📋</span> {t('landing.badgeTrack')}
              </span>
              <span className="lp-hero__badge lp-hero__badge--5">
                <span aria-hidden="true">🔔</span> {t('landing.badgeReminders')}
              </span>
              <span className="lp-hero__badge lp-hero__badge--6">
                <span aria-hidden="true">💰</span> {t('landing.badgeSaveMoney')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3) How it works – vertical timeline, scroll-triggered animation */}
      <section
        ref={howRef}
        className={`lp-how ${howVisible ? 'lp-how--visible' : ''}`}
        aria-labelledby="how-it-works-title"
      >
        <div className="lp-container">
          <SectionHeader id="how-it-works-title" title={t('landing.howItWorks')} />
          <div className="lp-steps" role="list">
            <StepCard step={1} title={t('landing.step1Title')} description={t('landing.step1Desc')} />
            <StepCard step={2} title={t('landing.step2Title')} description={t('landing.step2Desc')} />
            <StepCard step={3} title={t('landing.step3Title')} description={t('landing.step3Desc')} />
          </div>
        </div>
      </section>

      {/* 4) Features grid – scroll reveal + staggered animation */}
      <section
        ref={featuresRef}
        className={`lp-features ${featuresVisible ? 'lp-features--visible' : ''}`}
        aria-labelledby="features-title"
      >
        <div className="lp-container">
          <SectionHeader id="features-title" title={t('landing.whyChoose')} />
          <div className="lp-features-grid" role="list">
            <FeatureCard index={0} variant="green" icon="📅" title={t('landing.smartTracking')} benefit={t('landing.smartTrackingDesc')} description={t('landing.smartTrackingDesc')} />
            <FeatureCard index={1} variant="teal" icon="🔔" title={t('landing.timelyAlerts')} benefit={t('landing.timelyAlertsDesc')} description={t('landing.timelyAlertsDesc')} />
            <FeatureCard index={2} variant="green" icon="📊" title={t('landing.visualDashboard')} benefit={t('landing.visualDashboardDesc')} description={t('landing.visualDashboardDesc')} />
            <FeatureCard index={3} variant="teal" icon="🌱" title={t('landing.reduceWaste')} benefit={t('landing.reduceWasteDesc')} description={t('landing.reduceWasteDesc')} />
            <FeatureCard index={4} variant="green" icon="📱" title={t('landing.crossPlatform')} benefit={t('landing.crossPlatformDesc')} description={t('landing.crossPlatformDesc')} />
            <FeatureCard index={5} variant="teal" icon="🔐" title={t('landing.securePrivate')} benefit={t('landing.securePrivateDesc')} description={t('landing.securePrivateDesc')} />
          </div>
        </div>
      </section>

      {/* 5) App screenshots – left: actions, middle: screenshot, right: brief explanation (desktop); mobile: prev/next + screenshot only */}
      <section className="lp-screenshots" aria-labelledby="screenshots-title">
        <div className="lp-container">
          <SectionHeader id="screenshots-title" title={t('landing.screenshotsTitle')} />
          <div className="lp-screenshots-carousel">
            {/* Desktop: full list of actions */}
            <div className="lp-screenshots-actions" role="tablist" aria-label={t('landing.screenshotsTitle')}>
              {SCREENSHOT_SLIDES.map((slide, i) => (
                <button
                  key={slide.titleKey}
                  type="button"
                  role="tab"
                  aria-selected={screenshotIndex === i}
                  aria-controls="lp-screenshot-panel"
                  id={`lp-screenshot-tab-${i}`}
                  tabIndex={screenshotIndex === i ? 0 : -1}
                  className={`lp-screenshots-action ${screenshotIndex === i ? 'lp-screenshots-action--active' : ''}`}
                  onClick={() => setScreenshotIndex(i)}
                >
                  <span className="lp-screenshots-action__label">{t(slide.titleKey)}</span>
                </button>
              ))}
            </div>
            {/* Mobile: prev/next and current action name only */}
            <div className="lp-screenshots-nav-mobile">
              <button
                type="button"
                className="lp-screenshots-arrow"
                aria-label="Previous"
                onClick={() => setScreenshotIndex((i) => (i - 1 + SCREENSHOT_SLIDES.length) % SCREENSHOT_SLIDES.length)}
              >
                ←
              </button>
              <span className="lp-screenshots-nav-mobile__label">{t(SCREENSHOT_SLIDES[screenshotIndex].titleKey)}</span>
              <button
                type="button"
                className="lp-screenshots-arrow"
                aria-label="Next"
                onClick={() => setScreenshotIndex((i) => (i + 1) % SCREENSHOT_SLIDES.length)}
              >
                →
              </button>
            </div>
            <div
              ref={screenshotPanelRef}
              id="lp-screenshot-panel"
              className="lp-screenshots-panel"
              role="tabpanel"
              aria-labelledby={`lp-screenshot-tab-${screenshotIndex}`}
            >
              <div className="lp-screenshot">
                <img
                  src={SCREENSHOT_SLIDES[displayedScreenshotIndex].image}
                  alt={t(SCREENSHOT_SLIDES[displayedScreenshotIndex].altKey)}
                  className={`lp-screenshot__img ${screenshotImageLoaded ? 'lp-screenshot__img--loaded' : ''}`}
                  onLoad={() => setScreenshotImageLoaded(true)}
                  onError={() => setScreenshotImageLoaded(true)}
                />
                {isPreloading && (
                  <img
                    src={SCREENSHOT_SLIDES[screenshotIndex].image}
                    alt=""
                    aria-hidden="true"
                    className="lp-screenshot__preload"
                    onLoad={() => {
                      setDisplayedScreenshotIndex(screenshotIndex);
                      setScreenshotImageLoaded(true);
                    }}
                  />
                )}
              </div>
            </div>
            <div className="lp-screenshots-desc lp-screenshots-desc--transition" key={screenshotIndex} aria-live="polite">
              <h3 className="lp-screenshots-desc__title">{t(SCREENSHOT_SLIDES[screenshotIndex].titleKey)}</h3>
              <p className="lp-screenshots-desc__text">{t(SCREENSHOT_SLIDES[screenshotIndex].descKey)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6) Download section */}
      <section id="download" className="lp-download" aria-labelledby="download-title">
        <div className="lp-container">
          <SectionHeader id="download-title" title={t('landing.downloadTitle')} subtitle={t('landing.downloadDesc')} />
          <div className="lp-download__stores">
            <a href="https://apps.apple.com/jp/app/myexpiryalert/id6746734448?l=en-US" target="_blank" rel="noopener noreferrer" className="lp-download__store-link" aria-label="Download on the App Store">
              <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="Download on the App Store" />
            </a>
            {/* TODO: Replace with real Google Play URL when app is published */}
            <a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer" className="lp-download__store-link" aria-label="Get it on Google Play">
              <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" />
            </a>
          </div>
          <div className="lp-download__web">
            <p>{t('landing.preferBrowser')}</p>
            <Button to="/login" variant="primary" size="lg">
              {t('landing.launchWebApp')}
            </Button>
            <p className="lp-download__note">{t('landing.worksOfflineSync')}</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer__brand">
            <img src="/food_expiry_logo.png" alt="" className="lp-footer__logo" />
            <p className="lp-footer__copy">© {new Date().getFullYear()} Sun Tzu Technologies. All rights reserved.</p>
          </div>
          <div className="lp-footer__links">
            <Link to="/privacy">{t('landing.privacyPolicyLink')}</Link>
            <span className="lp-footer__sep" aria-hidden="true">|</span>
            <Link to="/terms">{t('landing.termsLink')}</Link>
            <span className="lp-footer__sep" aria-hidden="true">|</span>
            <a href="mailto:suntzutechnologies@gmail.com">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
