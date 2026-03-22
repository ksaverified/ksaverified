import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Shield, BookOpen, FileText, ChevronRight } from 'lucide-react';
import './index.css';

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans text-zinc-300">
      <header className="fixed top-0 inset-x-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-black text-white tracking-tighter">
              KSA<span className="text-amber-500">Verified</span>
            </span>
            <span className="bg-white/10 text-zinc-400 text-xs px-2 py-0.5 rounded-full font-medium ml-2">Corporate</span>
          </Link>
          <nav className="flex items-center space-x-8 text-sm font-medium">
            <Link to="/about" className="hover:text-white transition-colors">About Us</Link>
            <Link to="/legal/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/legal/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <a href="https://ksaverified.com" className="bg-amber-500 text-black px-4 py-2 rounded-lg font-bold hover:bg-amber-400 transition-colors">
              Go to App
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-grow pt-24 pb-16 px-6 max-w-7xl mx-auto w-full">
        {children}
      </main>

      <footer className="border-t border-white/5 bg-zinc-950/50 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-sm text-zinc-500 gap-4">
          <p>© {new Date().getFullYear()} KSAVerified. All rights reserved.</p>
          <div className="flex space-x-6">
            <Link to="/legal/privacy" className="hover:text-zinc-300">Privacy</Link>
            <Link to="/legal/terms" className="hover:text-zinc-300">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Home() {
  return (
    <div className="space-y-16 animate-in fade-in duration-500">
      <div className="space-y-6 max-w-3xl">
        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
          Trust & Transparency <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Built for Business.</span>
        </h1>
        <p className="text-xl text-zinc-400 leading-relaxed max-w-2xl">
          Welcome to the corporate portal for KSAVerified. Review our regulatory compliances, terms of operation, and structural frameworks.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: BookOpen, title: 'About the Company', desc: 'Our mission to verify and operationalize local businesses.', to: '/about' },
          { icon: Shield, title: 'Privacy & Data', desc: 'How we protect consumer and business information.', to: '/legal/privacy' },
          { icon: FileText, title: 'Terms of Service', desc: 'The legal framework for utilizing our platform.', to: '/legal/terms' },
        ].map((item) => (
          <Link key={item.title} to={item.to} className="group block p-8 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-amber-500/50 transition-all">
            <item.icon className="w-8 h-8 text-amber-500 mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">{item.desc}</p>
            <div className="flex items-center text-amber-500 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
              Read Document <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function LegalDoc({ title, children }) {
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pt-8">
      <div>
        <Link to="/" className="text-amber-500 hover:text-amber-400 flex items-center mb-6 text-sm font-medium">
          <ChevronRight className="w-4 h-4 rotate-180 mr-1" /> Back to Home
        </Link>
        <h1 className="text-4xl font-bold text-white tracking-tight">{title}</h1>
      </div>
      <div className="prose prose-invert prose-zinc max-w-none text-zinc-300">
        {children}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={
            <LegalDoc title="About Us">
              <p>KSAVerified is dedicated to unlocking the ultimate local marketplace directory for Saudi business.</p>
              <h3 className="text-white text-xl font-bold mt-8 mb-4">Our Mission</h3>
              <p>We believe every business deserves an incredible online presence. We streamline discovery, aesthetic presentation, and lead funnel tracking into a single seamless offering.</p>
            </LegalDoc>
          } />
          <Route path="/legal/privacy" element={
            <LegalDoc title="Privacy Policy">
              <p>Effective Date: March 2026</p>
              <h3 className="text-white text-xl font-bold mt-8 mb-4">Data Collection</h3>
              <p>We are fully compliant with relevant data protection directives in Saudi Arabia. We collect analytical metadata and interaction logs exclusively for optimizing your presence on KSAVerified.</p>
            </LegalDoc>
          } />
          <Route path="/legal/terms" element={
            <LegalDoc title="Terms of Service">
              <p>Last Updated: March 2026</p>
              <h3 className="text-white text-xl font-bold mt-8 mb-4">1. Acceptance of Terms</h3>
              <p>By operating under the KSAVerified umbrella, independent businesses agree to abide by our fair usage models...</p>
            </LegalDoc>
          } />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
