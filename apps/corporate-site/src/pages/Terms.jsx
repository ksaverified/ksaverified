import React from 'react';

const Terms = ({ lang, t }) => {
  return (
    <div className={`space-y-8 animate-in fade-in duration-500 pt-8 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
      <h1 className="text-4xl font-bold text-white tracking-tight">{t.termsTitle}</h1>
      <div className="prose prose-invert prose-zinc max-w-none text-zinc-300">
        <p className="text-sm text-zinc-500">{t.lastUpdated}: March 2026</p>

        <h3 className="text-white text-xl font-bold mt-8 mb-4">{t.term1Title}</h3>
        <p>{t.term1Desc}</p>

        <h3 className="text-white text-xl font-bold mt-8 mb-4">{t.term2Title}</h3>
        <p>{t.term2Desc}</p>

        <h3 className="text-white text-xl font-bold mt-8 mb-4">{t.term3Title}</h3>
        <p>{t.term3Desc}</p>

        <h3 className="text-white text-xl font-bold mt-8 mb-4">{t.term4Title}</h3>
        <p>{t.term4Desc}</p>
      </div>
    </div>
  );
};

export default Terms;
