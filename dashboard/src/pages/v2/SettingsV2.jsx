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
            <div className="p-6 space-y-5 max-w-3xl">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Settings className="w-6 h-6 text-zinc-400" /> Agent Configuration
                    </h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Fine-tune the behavior of the KSA Verified pipeline</p>
                </div>

                {loading ? (
                    <div className="py-16 text-center text-zinc-600 animate-pulse text-sm">Loading settings...</div>
                ) : (
                    <div className="space-y-4">
                        {settingsData.map(setting => (
                            <div key={setting.key} className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="text-sm font-bold text-zinc-200 capitalize">
                                            {setting.key.replace(/_/g, ' ')}
                                        </h3>
                                        {setting.description && (
                                            <p className="text-xs text-zinc-500 mt-1 flex items-start gap-1.5">
                                                <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> {setting.description}
                                            </p>
                                        )}
                                    </div>
                                    <button onClick={() => handleSave(setting.key)} disabled={saving[setting.key]}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ml-4
                                            ${saved[setting.key] ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                : 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:border-zinc-600 hover:text-white disabled:opacity-40'}`}>
                                        {saving[setting.key] ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            : saved[setting.key] ? <><CheckCircle className="w-3.5 h-3.5" /> Saved</>
                                            : <><Save className="w-3.5 h-3.5" /> Save</>}
                                    </button>
                                </div>
                                <textarea
                                    value={values[setting.key] || ''}
                                    onChange={e => setValues(p => ({ ...p, [setting.key]: e.target.value }))}
                                    spellCheck={false}
                                    className="w-full h-40 bg-[#0d0f14] border border-zinc-800 rounded-lg p-3 font-mono text-xs text-zinc-300 focus:outline-none focus:border-zinc-600 resize-y transition-all"
                                />
                            </div>
                        ))}
                        {settingsData.length === 0 && (
                            <div className="py-12 text-center text-zinc-600 text-sm border border-dashed border-zinc-800 rounded-xl">
                                No settings found in database
                            </div>
                        )}
                    </div>
                )}
            </div>
        </V2Shell>
    );
}
