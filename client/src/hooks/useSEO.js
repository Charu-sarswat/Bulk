/**
 * useSEO - Dynamic SEO hook for Bombay Chowpati
 * Updates document <title>, meta description, og:tags and canonical link on each page.
 *
 * Usage:
 *   useSEO({
 *     title: 'Page Title',
 *     description: 'Page description...',
 *     canonical: 'https://bombaychowpati.com/menu',
 *     ogImage: 'https://...',
 *   });
 */

import { useEffect } from 'react';

const SITE_NAME = 'Bombay Chowpati';
const BASE_URL = 'https://bombaychowpati.com';
const DEFAULT_OG_IMAGE =
  'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=1200&h=630&fit=crop';

export function useSEO({
  title,
  description,
  canonical,
  ogImage,
  ogType = 'website',
  noIndex = false,
} = {}) {
  useEffect(() => {
    const fullTitle = title
      ? `${title} | ${SITE_NAME}`
      : `${SITE_NAME} - Chaat Bhandar | 100% Pure Veg Mumbai Street Food, Hyderabad`;

    // ── Document Title ───────────────────────────────────────────
    document.title = fullTitle;

    // ── Helper: upsert a <meta> tag ──────────────────────────────
    const setMeta = (selector, value) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        const [attr, ...rest] = selector.replace('[', '').replace(']', '').split('=');
        el.setAttribute(attr, rest.join('=').replace(/"/g, ''));
        document.head.appendChild(el);
      }
      el.setAttribute('content', value);
    };

    // ── Helper: upsert a <link> tag ──────────────────────────────
    const setLink = (rel, href) => {
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    // ── Meta Description ─────────────────────────────────────────
    if (description) {
      setMeta('meta[name="description"]', description);
      setMeta('meta[property="og:description"]', description);
      setMeta('meta[name="twitter:description"]', description);
    }

    // ── OG Title & Twitter Title ─────────────────────────────────
    setMeta('meta[property="og:title"]', fullTitle);
    setMeta('meta[name="twitter:title"]', fullTitle);

    // ── OG Type ──────────────────────────────────────────────────
    setMeta('meta[property="og:type"]', ogType);

    // ── OG Image ─────────────────────────────────────────────────
    const image = ogImage || DEFAULT_OG_IMAGE;
    setMeta('meta[property="og:image"]', image);
    setMeta('meta[name="twitter:image"]', image);

    // ── Canonical & OG URL ───────────────────────────────────────
    if (canonical) {
      setLink('canonical', canonical);
      setMeta('meta[property="og:url"]', canonical);
      setMeta('meta[name="twitter:url"]', canonical);
    }

    // ── Robots ───────────────────────────────────────────────────
    setMeta(
      'meta[name="robots"]',
      noIndex
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    );

    // ── GA4 page_view event ──────────────────────────────────────
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_title: fullTitle,
        page_location: canonical || window.location.href,
        page_path: window.location.pathname,
      });
    }
  }, [title, description, canonical, ogImage, ogType, noIndex]);
}

export default useSEO;
