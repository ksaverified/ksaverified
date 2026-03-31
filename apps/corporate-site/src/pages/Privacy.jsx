import React from 'react';

const Privacy = ({ lang, t }) => {
  return (
    <div className={`space-y-8 animate-in fade-in duration-500 pt-8 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
      <h1 className="text-4xl font-bold text-white tracking-tight">{t.privacyTitle}</h1>
      <div className="prose prose-invert prose-zinc max-w-none text-zinc-300">
        <p className="text-sm text-zinc-500">{t.lastUpdated}: March 2026</p>
        
        <h3 className="text-white text-xl font-bold mt-8 mb-4">{t.priv1Title}</h3>
        <p>{t.priv1Desc}</p>

        <h3 className="text-white text-xl font-bold mt-8 mb-4">{t.priv2Title}</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>{t.priv2Point1}</li>
          <li>{t.priv2Point2}</li>
          <li>{t.priv2Point3}</li>
        </ul>

        <h3 className="text-white text-xl font-bold mt-8 mb-4">{t.priv3Title}</h3>
        <p>{t.priv3Desc}</p>

        <h3 className="text-white text-xl font-bold mt-8 mb-4">{t.priv4Title}</h3>
        <p>{t.priv4Desc}</p>
      </div>
    </div>
  );
};

export default Privacy;
