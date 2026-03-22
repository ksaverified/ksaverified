import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Settings, Save, Loader2, Info, CheckCircle } from 'lucide-react';
import V2Shell from './V2Shell';

export default function SettingsV2() {
    const [settingsData, setSettingsData] = useState([]);
    const [values, setValues] = useState({});
    const [saving, setSaving] = useState({});
    const [saved, setSaved] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchSettings(); }, []);

    async function fetchSettings() {
        try {
            const { data } = await supabase.from('settings').select('*');
            if (data) {
                setSettingsData(data);
                const v = {};
                data.forEach(s => { v[s.key] = JSON.stringify(s.value, null, 2); });
                setValues(v);
            }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    }

    async function handleSave(key) {
        setSaving(p => ({ ...p, [key]: true }));
        try {
            const parsed = JSON.parse(values[key]);
            const { error } = await supabase.from('settings').update({ value: parsed, updated_at: new Date().toISOString() }).eq('key', key);
            if (error) throw error;
            setSaved(p => ({ ...p, [key]: true }));
            setTimeout(() => setSaved(p => ({ ...p, [key]: false })), 2000);
        } catch (err) {
            alert(`Error saving ${key}:\n${err.message}\n\nMake sure input is valid JSON.`);
        } finally {
            setSaving(p => ({ ...p, [key]: false }));
        }
    }

    return (
        <V2Shell>
            <div className="p-8 space-y-8 max-w-4xl">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
                        <Settings className="w-6 h-6 text-amber-500" /> System Configuration
                    </h1>
                    <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest mt-1.5 opacity-60">High-Precision Parametric Tuning for Autonomous Operations</p>
                </div>

                {loading ? (
                    <div className="py-24 text-center">
                        <Loader2 className="w-6 h-6 text-amber-500 animate-spin mx-auto mb-3 opacity-40" />
                        <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">Querying System Registry...</span>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {settingsData.map(setting => (
                            <div key={setting.key} className="glass-card border-t border-white/5 rounded-3xl p-6 shadow-xl relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.02] to-transparent pointer-events-none" />
                                <div className="flex items-start justify-between mb-5 relative z-10">
                                    <div className="flex-1 pr-6">
                                        <h3 className="text-xs font-black text-white uppercase tracking-[0.1em]">
                                            {setting.key.replace(/_/g, ' ')}
                                        </h3>
                                        {setting.description && (
                                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-2 flex items-start gap-2 leading-relaxed opacity-60">
                                                <Info className="w-3.5 h-3.5 flex-shrink-0 text-amber-500/50" /> {setting.description}
                                            </p>
                                        )}
                                    </div>
                                    <button onClick={() => handleSave(setting.key)} disabled={saving[setting.key]}
                                        className={`h-10 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg
                                            ${saved[setting.key] ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                                : 'bg-obsidian-surface-high border border-white/10 text-zinc-400 hover:text-amber-500 hover:border-amber-500/50 active:scale-95 disabled:opacity-40'}`}>
                                        {saving[setting.key] ? <Loader2 className="w-4 h-4 animate-spin" />
                                            : saved[setting.key] ? <><CheckCircle className="w-4 h-4" /> Commited</>
                                            : <><Save className="w-4 h-4" /> Save Change</>}
                                    </button>
                                </div>
                                <div className="relative z-10">
                                    <div className="absolute right-4 top-4 text-[9px] font-mono text-zinc-800 pointer-events-none group-focus-within:text-amber-500/20 transition-colors uppercase font-black tracking-widest">
                                        JSON ENGINE / V2.0
                                    </div>
                                    <textarea
                                        value={values[setting.key] || ''}
                                        onChange={e => setValues(p => ({ ...p, [setting.key]: e.target.value }))}
                                        spellCheck={false}
                                        className="w-full h-48 bg-obsidian-dark/80 border border-white/5 rounded-2xl p-5 font-mono text-xs text-amber-500/80 focus:text-amber-400 placeholder-zinc-800 focus:outline-none focus:border-amber-500/30 resize-y transition-all shadow-inner"
                                    />
                                </div>
                            </div>
                        ))}
                        {settingsData.length === 0 && (
                            <div className="py-24 text-center glass-card border-dashed border-zinc-800 rounded-3xl">
                                <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">No Schema Entries Found</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </V2Shell>
    );
}
