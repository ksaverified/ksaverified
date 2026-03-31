import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Target, Settings, Save, RefreshCw, Zap, TrendingUp, AlertTriangle,
    Star, Globe, Camera, Clock, MessageSquare, Check, X, Plus, Trash2
} from 'lucide-react';

const DEFAULT_THRESHOLDS = {
    reviewCountLow: 20,
    photoCountMin: 3,
    websiteRequired: true,
    hoursRequired: true,
    bingCheckEnabled: true,
    yelpCheckEnabled: false,
    scoreWeights: {
        website: 30,
        reviews: 35,
        photos: 15,
        hours: 20
    },
    priorityThresholds: {
        hot: 30,
        warm: 50
    }
};

const GAP_TYPES = [
    { key: 'no_website', label: 'No Website', icon: Globe },
    { key: 'outdated_website', label: 'Outdated Website', icon: Globe },
    { key: 'low_reviews', label: 'Low Reviews', icon: Star },
    { key: 'no_photos', label: 'No Photos', icon: Camera },
    { key: 'no_hours', label: 'Missing Hours', icon: Clock },
    { key: 'no_responses', label: 'No Review Responses', icon: MessageSquare }
];

export default function MapGapSettings() {
    const [settings, setSettings] = useState(DEFAULT_THRESHOLDS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    async function fetchSettings() {
        try {
            const { data, error } = await supabase
                .from('settings')
                .select('key, value')
                .eq('key', 'map_gap_config');

            if (error) throw error;

            if (data && data.length > 0 && data[0].value) {
                setSettings(prev => ({ ...prev, ...data[0].value }));
            }
        } catch (e) {
            console.error('Error fetching settings:', e);
        } finally {
            setLoading(false);
        }
    }

    async function saveSettings() {
        setSaving(true);
        setError(null);
        try {
            const { error } = await supabase
                .from('settings')
                .upsert({
                    key: 'map_gap_config',
                    value: settings
                }, { onConflict: 'key' });

            if (error) throw error;

            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (e) {
            setError('Failed to save settings: ' + e.message);
        } finally {
            setSaving(false);
        }
    }

    function updateThreshold(key, value) {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    }

    function updateWeight(key, value) {
        setSettings(prev => ({
            ...prev,
            scoreWeights: {
                ...prev.scoreWeights,
                [key]: parseInt(value) || 0
            }
        }));
    }

    function updatePriorityThreshold(key, value) {
        setSettings(prev => ({
            ...prev,
            priorityThresholds: {
                ...prev.priorityThresholds,
                [key]: parseInt(value) || 0
            }
        }));
    }

    return (
        <div className="min-h-screen bg-obsidian-bg text-white font-['Inter',sans-serif]">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-obsidian-bg/95 backdrop-blur-md border-b border-zinc-800/50">
                <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                            <Settings className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white">Map Gap Configuration</h1>
                            <p className="text-xs text-zinc-500">Configure gap detection thresholds and scoring</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchSettings}
                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Reset
                        </button>
                        <button
                            onClick={saveSettings}
                            disabled={saving}
                            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                                saved
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-amber-500 hover:bg-amber-600 text-white'
                            }`}
                        >
                            {saved ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    Saved!
                                </>
                            ) : saving ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Save Settings
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            <div className="p-6 space-y-6 max-w-4xl mx-auto">
                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-20 text-zinc-500">
                        Loading configuration...
                    </div>
                ) : (
                    <>
                        {/* Gap Detection Thresholds */}
                        <section className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Target className="w-5 h-5 text-amber-500" />
                                Gap Detection Thresholds
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm text-zinc-400 mb-2">
                                        Review Count Threshold
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.reviewCountLow}
                                        onChange={e => updateThreshold('reviewCountLow', parseInt(e.target.value))}
                                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-amber-500/50"
                                    />
                                    <p className="text-xs text-zinc-500 mt-1">
                                        Businesses with fewer reviews are flagged as &quot;low reviews&quot;
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-400 mb-2">
                                        Minimum Photos
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.photoCountMin}
                                        onChange={e => updateThreshold('photoCountMin', parseInt(e.target.value))}
                                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-amber-500/50"
                                    />
                                    <p className="text-xs text-zinc-500 mt-1">
                                        Minimum photos required to pass photo gap check
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                <label className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-xl cursor-pointer hover:bg-zinc-800 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={settings.websiteRequired}
                                        onChange={e => updateThreshold('websiteRequired', e.target.checked)}
                                        className="w-5 h-5 rounded border-zinc-600 text-amber-500 focus:ring-amber-500"
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-white">Website Required</p>
                                        <p className="text-xs text-zinc-500">Flag businesses without websites</p>
                                    </div>
                                </label>
                                <label className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-xl cursor-pointer hover:bg-zinc-800 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={settings.hoursRequired}
                                        onChange={e => updateThreshold('hoursRequired', e.target.checked)}
                                        className="w-5 h-5 rounded border-zinc-600 text-amber-500 focus:ring-amber-500"
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-white">Hours Required</p>
                                        <p className="text-xs text-zinc-500">Flag businesses without opening hours</p>
                                    </div>
                                </label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                <label className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-xl cursor-pointer hover:bg-zinc-800 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={settings.bingCheckEnabled}
                                        onChange={e => updateThreshold('bingCheckEnabled', e.target.checked)}
                                        className="w-5 h-5 rounded border-zinc-600 text-amber-500 focus:ring-amber-500"
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-white">Bing Presence Check</p>
                                        <p className="text-xs text-zinc-500">Check if business appears on Bing</p>
                                    </div>
                                </label>
                                <label className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-xl cursor-pointer hover:bg-zinc-800 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={settings.yelpCheckEnabled}
                                        onChange={e => updateThreshold('yelpCheckEnabled', e.target.checked)}
                                        className="w-5 h-5 rounded border-zinc-600 text-amber-500 focus:ring-amber-500"
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-white">Yelp Consistency Check</p>
                                        <p className="text-xs text-zinc-500">Verify NAP consistency across directories</p>
                                    </div>
                                </label>
                            </div>
                        </section>

                        {/* Score Weights */}
                        <section className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-amber-500" />
                                Conversion Score Weights
                            </h2>
                            <p className="text-sm text-zinc-500 mb-6">
                                Adjust how each factor contributes to the overall conversion score (must total 100%)
                            </p>

                            <div className="space-y-5">
                                {GAP_TYPES.filter(g => ['no_website', 'low_reviews', 'no_photos', 'no_hours'].includes(g.key)).map(gap => {
                                    const weightKey = {
                                        'no_website': 'website',
                                        'low_reviews': 'reviews',
                                        'no_photos': 'photos',
                                        'no_hours': 'hours'
                                    }[gap.key];
                                    const Icon = gap.icon;

                                    return (
                                        <div key={gap.key}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Icon className="w-4 h-4 text-zinc-400" />
                                                    <label className="text-sm text-zinc-300">{gap.label}</label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="50"
                                                        value={settings.scoreWeights[weightKey]}
                                                        onChange={e => updateWeight(weightKey, e.target.value)}
                                                        className="w-32"
                                                    />
                                                    <input
                                                        type="number"
                                                        value={settings.scoreWeights[weightKey]}
                                                        onChange={e => updateWeight(weightKey, e.target.value)}
                                                        className="w-16 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-center text-sm text-white"
                                                    />
                                                    <span className="text-sm text-zinc-500 w-8">%</span>
                                                </div>
                                            </div>
                                            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-amber-500 rounded-full transition-all"
                                                    style={{ width: `${settings.scoreWeights[weightKey]}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-6 p-4 bg-zinc-800/50 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-zinc-300">Total Weight</span>
                                    <span className={`text-lg font-bold ${
                                        Object.values(settings.scoreWeights).reduce((a, b) => a + b, 0) === 100
                                            ? 'text-emerald-400'
                                            : 'text-red-400'
                                    }`}>
                                        {Object.values(settings.scoreWeights).reduce((a, b) => a + b, 0)}%
                                    </span>
                                </div>
                                {Object.values(settings.scoreWeights).reduce((a, b) => a + b, 0) !== 100 && (
                                    <p className="text-xs text-red-400 mt-1">Weights must total 100%</p>
                                )}
                            </div>
                        </section>

                        {/* Priority Thresholds */}
                        <section className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-amber-500" />
                                Priority Thresholds
                            </h2>
                            <p className="text-sm text-zinc-500 mb-6">
                                Set score thresholds for lead prioritization
                            </p>

                            <div className="space-y-5">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-red-500" />
                                            <label className="text-sm text-zinc-300">Hot Priority (Below this = Hot)</label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={settings.priorityThresholds.hot}
                                                onChange={e => updatePriorityThreshold('hot', e.target.value)}
                                                className="w-20 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-center text-sm text-white"
                                            />
                                            <span className="text-sm text-zinc-500">score</span>
                                        </div>
                                    </div>
                                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-red-500 rounded-full"
                                            style={{ width: `${settings.priorityThresholds.hot}%` }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-amber-500" />
                                            <label className="text-sm text-zinc-300">Warm Priority (Below this = Warm)</label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={settings.priorityThresholds.warm}
                                                onChange={e => updatePriorityThreshold('warm', e.target.value)}
                                                className="w-20 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-center text-sm text-white"
                                            />
                                            <span className="text-sm text-zinc-500">score</span>
                                        </div>
                                    </div>
                                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-amber-500 rounded-full"
                                            style={{ width: `${settings.priorityThresholds.warm}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 p-4 bg-zinc-800/50 rounded-xl space-y-2">
                                <p className="text-xs text-zinc-400 font-medium">Priority Classification:</p>
                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                    <div className="w-2 h-2 rounded-full bg-red-500" />
                                    <span>HOT: 0 - {settings.priorityThresholds.hot} (Immediate action)</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                                    <span>WARM: {settings.priorityThresholds.hot + 1} - {settings.priorityThresholds.warm} (Follow up)</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                    <span>COLD: Above {settings.priorityThresholds.warm} (Low priority)</span>
                                </div>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}
