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
        <div className="p-6 max-w-7xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase flex items-center gap-3">
                        <Shield className="w-8 h-8 text-amber-500" />
                        SEO & Analytics Hub
                    </h1>
                    <p className="text-zinc-500 mt-1 font-bold tracking-wide">
                        Monitor your visibility and reach on Google Search.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleIndex}
                        disabled={indexing}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-500 transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                    >
                        {indexing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
                        {indexing ? 'Indexing...' : 'Index Website'}
                    </button>
                    <button 
                        onClick={handleRelinquish}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 transition-all text-[10px] font-black uppercase tracking-widest"
                    >
                        <Trash2 className="w-3.5 h-3.5" /> Stop Management
                    </button>
                    <button 
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black transition-all text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-amber-500/20"
                    >
                        <Plus className="w-4 h-4" /> Add Business
                    </button>
                </div>
            </div>

            {/* Main Content (Rest of the SEO Hub UI) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats */}
                <div className="glass-card rounded-3xl p-6 border-t border-white/5 md:col-span-1">
                    <div className="flex items-center justify-between mb-6">
                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Visibility Stats</p>
                        <BarChart2 className="w-4 h-4 text-zinc-500" />
                    </div>
                    <div className="space-y-6">
                        <div>
                            <p className="text-3xl font-black text-white">{stats.views.toLocaleString()}</p>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Total Page Views</p>
                        </div>
                        <div>
                            <p className="text-3xl font-black text-emerald-500">{stats.engaged.toLocaleString()}</p>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Engaged Sessions</p>
                        </div>
                    </div>
                </div>

                {/* Editor */}
                <div className="glass-card rounded-3xl p-8 border-t border-white/5 md:col-span-2 space-y-8">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-white italic uppercase tracking-tight">Search Engine Optimization</h3>
                        <button 
                            onClick={handleUpdate}
                            disabled={saving}
                            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-500/10 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Meta Data'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Meta Title</label>
                            <input 
                                type="text"
                                className="w-full bg-obsidian-surface-high/50 border border-white/5 rounded-2xl px-5 py-4 text-zinc-100 focus:outline-none focus:border-amber-500/50 transition-all font-medium"
                                value={seoData.seo_title}
                                onChange={e => setSeoData({...seoData, seo_title: e.target.value})}
                                placeholder="Best Restaurant in Riyadh | Quality Food"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Meta Description</label>
                            <textarea 
                                className="w-full bg-obsidian-surface-high/50 border border-white/5 rounded-2xl px-5 py-4 text-zinc-100 focus:outline-none focus:border-amber-500/50 transition-all font-medium min-h-[120px]"
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
