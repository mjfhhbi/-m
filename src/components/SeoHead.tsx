import React, { useEffect } from 'react';
import { StoreSettings, Product } from '../types';

interface SeoHeadProps {
  settings: StoreSettings;
  selectedProduct?: Product | null;
}

export const SeoHead: React.FC<SeoHeadProps> = ({ settings, selectedProduct }) => {
  useEffect(() => {
    // 1. Dynamic Page Title
    const pageTitle = selectedProduct
      ? `${selectedProduct.title} | ${settings.storeName || 'عینک استوک جهانی'}`
      : (settings.seoTitle || `${settings.storeName || 'فروشگاه عینک استوک جهانی'} | عینک آفتابی و طبی اورجینال`);
    document.title = pageTitle;

    // 2. Helper to set/update meta tag
    const setMetaTag = (nameAttr: string, attrVal: string, contentVal: string) => {
      if (!contentVal) return;
      let element = document.querySelector(`meta[${nameAttr}="${attrVal}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(nameAttr, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute('content', contentVal);
    };

    // Description & Keywords
    const metaDesc = selectedProduct
      ? selectedProduct.description || `${selectedProduct.title} - ${selectedProduct.frameType} با عدسی ${selectedProduct.lensColor}`
      : (settings.seoDescription || settings.tagline || 'فروشگاه آنلاین عینک‌های استوک اورجینال آفتابی و طبی ساخت اروپا');
    
    setMetaTag('name', 'description', metaDesc);
    setMetaTag('name', 'keywords', settings.seoKeywords || 'عینک استوک, عینک آفتابی, عینک طبی, عینک خلبانی, عینک ورزشی');

    // Google Search Console Verification
    if (settings.googleSiteVerification) {
      setMetaTag('name', 'google-site-verification', settings.googleSiteVerification);
    }

    // Bing Verification
    if (settings.bingSiteVerification) {
      setMetaTag('name', 'msvalidate.01', settings.bingSiteVerification);
    }

    // OpenGraph Social Tags
    setMetaTag('property', 'og:title', pageTitle);
    setMetaTag('property', 'og:description', metaDesc);
    setMetaTag('property', 'og:type', selectedProduct ? 'product' : 'website');
    if (selectedProduct && selectedProduct.images && selectedProduct.images[0]) {
      setMetaTag('property', 'og:image', selectedProduct.images[0]);
    }

    // 3. Inject JSON-LD Schema.org Structured Data
    const schemaId = 'seo-structured-data';
    let scriptTag = document.getElementById(schemaId) as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = schemaId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    if (selectedProduct) {
      const productSchema = {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        'name': selectedProduct.title,
        'image': selectedProduct.images || [],
        'description': selectedProduct.description,
        'sku': selectedProduct.code || selectedProduct.id,
        'brand': {
          '@type': 'Brand',
          'name': 'Stock Jahani'
        },
        'offers': {
          '@type': 'Offer',
          'url': window.location.href,
          'priceCurrency': 'IRR',
          'price': selectedProduct.price * 10, // Toman to Rial for Schema
          'availability': selectedProduct.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          'itemCondition': 'https://schema.org/NewCondition'
        }
      };
      scriptTag.textContent = JSON.stringify(productSchema);
    } else {
      const storeSchema = {
        '@context': 'https://schema.org',
        '@type': 'OnlineStore',
        'name': settings.storeName || 'فروشگاه عینک استوک جهانی',
        'description': settings.tagline || 'فروشگاه آنلاین عینک‌های آفتابی و طبی استوک اورجینال',
        'url': window.location.origin,
        'telephone': settings.phone,
        'address': {
          '@type': 'PostalAddress',
          'streetAddress': settings.address,
          'addressCountry': 'IR'
        }
      };
      scriptTag.textContent = JSON.stringify(storeSchema);
    }

    // 4. Inject Google Analytics if configured
    if (settings.googleAnalyticsId && settings.googleAnalyticsId.startsWith('G-')) {
      const gaScriptId = 'ga-gtag-script';
      if (!document.getElementById(gaScriptId)) {
        const gaScript = document.createElement('script');
        gaScript.id = gaScriptId;
        gaScript.async = true;
        gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${settings.googleAnalyticsId}`;
        document.head.appendChild(gaScript);

        const gaInitScript = document.createElement('script');
        gaInitScript.id = 'ga-init-script';
        gaInitScript.textContent = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${settings.googleAnalyticsId}');
        `;
        document.head.appendChild(gaInitScript);
      }
    }

  }, [settings, selectedProduct]);

  return null;
};
