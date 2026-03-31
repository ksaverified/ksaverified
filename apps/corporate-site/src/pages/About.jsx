import React from 'react';

const About = ({ lang, t }) => {
  return (
    <div className={`space-y-8 animate-in fade-in duration-500 pt-8 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
      <h1 className="text-4xl font-bold text-white tracking-tight">{t.aboutTitle}</h1>
      <div className="prose prose-invert prose-zinc max-w-none text-zinc-300">
        <p className="text-lg leading-relaxed text-zinc-200">{t.aboutIntro}</p>

        <h3 className="text-white text-xl font-bold mt-8 mb-4">{t.aboutMissionTitle}</h3>
        <p>{t.aboutMissionDesc}</p>

        <h3 className="text-white text-xl font-bold mt-8 mb-4">{t.aboutVisionTitle}</h3>
        <p>{t.aboutVisionDesc}</p>
        
        <div className="mt-12 p-6 bg-white/5 border border-amber-500/20 rounded-2xl flex items-center gap-6">
           <div className="w-16 h-16 shrink-0 bg-brand/20 rounded-full flex items-center justify-center border border-brand/30">
             <span className="text-2xl font-black text-brand">2030</span>
           </div>
           <div>
             <h4 className="text-white font-bold mb-2">{t.aboutSaudiTitle}</h4>
             <p className="text-sm">{t.aboutSaudiDesc}</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default About;
