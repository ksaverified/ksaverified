import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ShoppingBag, Star, TrendingUp, Search, Store } from 'lucide-react';
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
            <span className="bg-amber-500/10 text-amber-500 text-xs px-2 py-0.5 rounded-full font-bold ml-2">STORE</span>
          </Link>
          <nav className="flex items-center space-x-8 text-sm font-medium">
            <Link to="/products" className="hover:text-white transition-colors">Digital Products</Link>
            <Link to="/services" className="hover:text-white transition-colors">Partner Services</Link>
            <a href="https://ksaverified.com" className="bg-white/10 text-white px-4 py-2 rounded-lg font-bold hover:bg-white/20 transition-colors">
              Vendor Login
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-grow pt-24 pb-16 px-6 max-w-7xl mx-auto w-full">
        {children}
      </main>

      <footer className="border-t border-white/5 bg-zinc-950/50 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-sm text-zinc-500 gap-4">
          <p>© {new Date().getFullYear()} KSAVerified Marketplace. All rights reserved.</p>
          <div className="flex space-x-6">
            <a href="https://ksaverified.info/legal/privacy" className="hover:text-zinc-300">Privacy</a>
            <a href="https://ksaverified.info/legal/terms" className="hover:text-zinc-300">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Home() {
  return (
    <div className="space-y-16 animate-in fade-in duration-500">
      {/* Hero */}
      <div className="space-y-6 max-w-4xl pt-10">
        <div className="inline-flex items-center space-x-2 bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-sm font-medium">
          <Star className="w-4 h-4" /> <span>The Premium Saudi Digital Market</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-tight">
          Discover vetted digital services and platforms.
        </h1>
        <p className="text-xl text-zinc-400 leading-relaxed max-w-2xl">
          Purchase premium KSAVerified subscriptions, unlock exclusive templates, or hire services from our verified network of businesses.
        </p>
        
        <div className="flex items-center space-x-4 pt-4">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search products or services..." 
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
          </div>
          <button className="bg-amber-500 text-black px-8 py-4 rounded-xl font-bold hover:bg-amber-400 transition-colors">
            Search
          </button>
        </div>
      </div>

      {/* Featured Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10">
        <Link to="/products" className="group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-zinc-900 to-black p-8 hover:border-amber-500/30 transition-all">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShoppingBag className="w-32 h-32 text-amber-500" />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-6">
              <ShoppingBag className="w-6 h-6 text-amber-500" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Platform Products</h2>
            <p className="text-zinc-400 max-w-sm mb-8">Unlock premium capabilities for your KSAVerified website, including custom domains and advanced AI tools.</p>
            <span className="text-amber-500 font-bold group-hover:underline">Browse Products →</span>
          </div>
        </Link>
        
        <Link to="/services" className="group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-zinc-900 to-black p-8 hover:border-amber-500/30 transition-all">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Store className="w-32 h-32 text-amber-500" />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-6">
              <Store className="w-6 h-6 text-amber-500" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Partner Services</h2>
            <p className="text-zinc-400 max-w-sm mb-8">Hire vetted KSAVerified customers directly. From legal consultants to graphic designers.</p>
            <span className="text-amber-500 font-bold group-hover:underline">Explore Services →</span>
          </div>
        </Link>
      </div>
      
      {/* Trending Section */}
      <div className="pt-10">
        <h3 className="text-2xl font-bold text-white flex items-center mb-6">
          <TrendingUp className="w-6 h-6 mr-3 text-amber-500" /> Trending Subscriptions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white/5 border border-white/5 rounded-xl p-6 hover:bg-white/10 transition-colors cursor-pointer">
              <div className="w-full h-32 bg-black/50 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-zinc-600 font-medium">Image Preview</span>
              </div>
              <h4 className="text-white font-bold mb-1">Premium Website Unlock</h4>
              <p className="text-zinc-400 text-sm mb-4">By KSAVerified</p>
              <div className="flex items-center justify-between">
                <span className="text-amber-500 font-bold">500 SAR</span>
                <span className="text-xs bg-white/10 px-2 py-1 rounded text-white">Digital</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Products() {
  return (
    <div className="max-w-4xl animate-in fade-in duration-500 pt-8">
      <h1 className="text-4xl font-bold text-white mb-6">Digital Products</h1>
      <p className="text-zinc-400 mb-10">Official KSAVerified platform upgrades and add-ons.</p>
      
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center py-20">
        <ShoppingBag className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
        <h3 className="text-xl text-white font-bold mb-2">Loading Products...</h3>
        <p className="text-zinc-400">Our product catalog is currently syncing with the database.</p>
      </div>
    </div>
  );
}

function Services() {
  return (
    <div className="max-w-4xl animate-in fade-in duration-500 pt-8">
      <h1 className="text-4xl font-bold text-white mb-6">Partner Services</h1>
      <p className="text-zinc-400 mb-10">Hire trusted professionals from our verified business network.</p>
      
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center py-20">
        <Store className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
        <h3 className="text-xl text-white font-bold mb-2">Loading Directory...</h3>
        <p className="text-zinc-400">We are fetching the latest verified providers.</p>
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
          <Route path="/products" element={<Products />} />
          <Route path="/services" element={<Services />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
