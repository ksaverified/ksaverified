import { useEffect, useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { useLanguage } from '../components/LanguageContext';
import { 
    Layout, Eye, CloudLightning, Shield, ChevronRight, 
    CheckCircle, AlertCircle, RefreshCw, BarChart2,
    Settings, LogOut, PlusCircle, Trash2, Plus, Search, Globe, Save
} from 'lucide-react';
import ComplianceOnboarding from '../components/ComplianceOnboarding';

export default function SEOHub() {
    const { user } = useAuth();
    const { language, translations: t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [indexing, setIndexing] = useState(false);
    const [lead, setLead] = useState(null);
    const [stats, setStats] = useState({ views: 0, engaged: 0 });
    const [showCompliance, setShowCompliance] = useState(!sessionStorage.getItem('gbp_compliance_accepted'));
    
    const [seoData, setSeoData] = useState({
        seo_title: '',
        seo_description: '',
        seo_score: 0,
        indexing_status: 'not_indexed',
        on_page_checklist: {}
    });

    const fetchData = async () => {
        try {
            const placeId = user.user_metadata?.place_id;
            if (!placeId) return;

            const res = await fetch(`/api/seo?action=details&id=${placeId}`);
            const result = await res.json();
            if (result.success) {
                setSeoData(result.data);
                setLead(result.data); // For metrics
            }

            // Fetch metrics
            const metricsRes = await fetch(`/api/portal?action=metrics&id=${placeId}`);
            const metricsData = await metricsRes.json();
            if (metricsData.success) {
                setStats(metricsData.stats);
            }
        } catch (e) {
            console.error('[SEO Hub] Fetch error:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchData();
    }, [user]);

    const handleAcceptCompliance = () => {
        sessionStorage.setItem('gbp_compliance_accepted', 'true');
        setShowCompliance(false);
    };

    const handleUpdate = async () => {
        setSaving(true);
        try {
            const placeId = user.user_metadata?.place_id;
            const res = await fetch(`/api/seo?action=update&id=${placeId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(seoData)
            });
            if (res.ok) alert('SEO metadata updated successfully!');
        } catch (e) {
            alert('Failed to update: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleIndex = async () => {
        setIndexing(true);
        try {
            const placeId = user.user_metadata?.place_id;
            const res = await fetch(`/api/seo?action=ping-google&id=${placeId}`, { method: 'POST' });
            const data = await res.json();
            if (data.success) alert(data.message);
        } catch (e) {
            alert('Indexing failed: ' + e.message);
        } finally {
            setIndexing(false);
        }
    };

    const handleRelinquish = async () => {
        if (!confirm('Are you sure you want to remove ksaverified.com as a manager from your Google Business Profile? This cannot be undone.')) return;
        
        setSaving(true);
        try {
            const placeId = user.user_metadata?.place_id;
            const res = await fetch(`/api/seo?action=relinquish&id=${placeId}`, { method: 'POST' });
            if (res.ok) {
                alert('Management privileges removed successfully.');
                window.location.reload();
            } else {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to relinquish.');
            }
        } catch (e) {
            alert('Error: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    if (showCompliance) return <ComplianceOnboarding onAccept={handleAcceptCompliance} />;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                    <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase flex items-center gap-4">
                        <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 amber-glow">
                            <Shield className="w-8 h-8 text-amber-500" />
                        </div>
                        <span className="text-gradient-amber">SEO & Analytics</span>
                    </h1>
                    <p className="text-zinc-500 mt-2 font-bold tracking-[0.2em] uppercase text-[10px]">
                        Visibility Infrastructure & Google Search Performance
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleIndex}
                        disabled={indexing}
                        className="flex items-center gap-3 px-6 py-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-500 transition-all text-[11px] font-black uppercase tracking-widest disabled:opacity-50 active:scale-95"
                    >
                        {indexing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                        {indexing ? 'Indexing...' : 'Index Website'}
                    </button>
                    <button 
                        onClick={handleRelinquish}
                        className="flex items-center gap-3 px-6 py-3 rounded-2xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 transition-all text-[11px] font-black uppercase tracking-widest active:scale-95"
                    >
                        <Trash2 className="w-4 h-4" /> Stop Management
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Stats */}
                <div className="glass-card rounded-[2rem] p-8 border border-white/5 lg:col-span-1 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <BarChart2 className="w-24 h-24 text-amber-500" />
                    </div>
                    
                    <div className="relative z-10 space-y-10">
                        <div>
                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-6">Performance Snapshot</p>
                            <div className="space-y-8">
                                <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                                    <p className="text-4xl font-black text-white tracking-tighter italic">{stats.views.toLocaleString()}</p>
                                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-2 flex items-center gap-2">
                                        <Eye className="w-3 h-3 text-amber-500" /> Google Search Views
                                    </p>
                                </div>
                                <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                                    <p className="text-4xl font-black text-emerald-500 tracking-tighter italic">{stats.engaged.toLocaleString()}</p>
                                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-2 flex items-center gap-2">
                                        <CloudLightning className="w-3 h-3 text-emerald-500" /> Engaged Sessions
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Editor */}
                <div className="glass-card rounded-[2rem] p-10 border border-white/5 lg:col-span-2 space-y-10 luminous-card">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">On-Page Optimization</h3>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Update your presence across Google networks</p>
                        </div>
                        <button 
                            onClick={handleUpdate}
                            disabled={saving}
                            className="px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 active:scale-95"
                        >
                            {saving ? 'Saving...' : 'Sync Meta Data'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-amber-500/70 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                                <Search className="w-3 h-3" /> Meta Title (Google Listing Header)
                            </label>
                            <input 
                                type="text"
                                className="w-full bg-obsidian-surface-highest/40 border border-white/5 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-amber-500/50 focus:bg-obsidian-surface-highest/60 transition-all font-bold text-sm tracking-wide"
                                value={seoData.seo_title}
                                onChange={e => setSeoData({...seoData, seo_title: e.target.value})}
                                placeholder="Best Restaurant in Riyadh | Quality Food"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-amber-500/70 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                                <Globe className="w-3 h-3" /> Meta Description (Search Snippet)
                            </label>
                            <textarea 
                                className="w-full bg-obsidian-surface-highest/40 border border-white/5 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-amber-500/50 focus:bg-obsidian-surface-highest/60 transition-all font-bold text-sm tracking-wide min-h-[160px] leading-relaxed"
                                value={seoData.seo_description}
                                onChange={e => setSeoData({...seoData, seo_description: e.target.value})}
                                placeholder="Looking for the best experience in Riyadh? Visit us for authentic taste and premium service. Book now..."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
