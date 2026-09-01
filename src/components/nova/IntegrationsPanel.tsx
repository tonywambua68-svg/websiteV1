import { useState } from "react";
import {
  disconnect, getSettings, INTEGRATIONS, isConnected, saveSettings, type Integration,
} from "../../lib/nova/integrations";
import { useStore } from "../../lib/store";

const CAT_LABEL: Record<Integration["category"], string> = {
  automation: "Automation", ads: "Ads & retargeting", analytics: "Analytics", email: "Email", messaging: "Messaging",
};

/** Connect the store to Zapier / Meta / GA4 / Mailchimp / Sheets / Twilio. */
export default function IntegrationsPanel() {
  const { toast } = useStore();
  const [editing, setEditing] = useState<Integration["id"] | null>(null);
  const [, force] = useState(0);
  const refresh = () => force((n) => n + 1);

  return (
    <div className="space-y-4">
      <p className="rounded-xl border border-amber/40 bg-amber/10 px-4 py-3 text-[12px] font-bold leading-relaxed text-amberdeep">
        Keys & webhook URLs are stored only in this browser (localStorage) — never committed to Git, and in
        production they belong in server-side environment variables. NOVA sends a standard JSON payload; the
        connected service does the actual posting.
      </p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {INTEGRATIONS.map((it) => {
          const connected = isConnected(it.id);
          const isOpen = editing === it.id;
          const settings = getSettings(it.id);
          return (
            <div key={it.id} className={`flex flex-col rounded-xl border p-4 transition ${connected ? "border-success/50 bg-success/[0.04]" : "border-line bg-card"}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-[15px] font-bold">{it.name}</p>
                  <p className="text-[10.5px] font-extrabold uppercase tracking-wider text-muted">{CAT_LABEL[it.category]}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${connected ? "bg-success/15 text-success" : "bg-mist text-muted"}`}>
                  {connected ? "Connected" : "Off"}
                </span>
              </div>
              <p className="mt-2 flex-1 text-[12.5px] font-semibold leading-relaxed text-muted">{it.tagline}</p>

              {isOpen && (
                <div className="animate-pop mt-3 space-y-2.5 border-t border-line pt-3">
                  {it.fields.map((f) => (
                    <label key={f.key} className="block text-[10.5px] font-extrabold uppercase tracking-wider text-muted">
                      {f.label}
                      <input
                        className="input mt-1 !h-9 !text-[12.5px]"
                        type={f.secret ? "password" : "text"}
                        placeholder={f.placeholder}
                        defaultValue={settings[f.key] ?? ""}
                        data-field={f.key}
                      />
                    </label>
                  ))}
                  <p className="rounded-lg bg-mist p-2.5 text-[11px] font-semibold leading-relaxed text-muted">{it.docs}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn btn-teal btn-sm flex-1"
                      onClick={() => {
                        const values: Record<string, string> = {};
                        document.querySelectorAll<HTMLInputElement>(`[data-field]`).forEach((el) => {
                          const k = el.getAttribute("data-field");
                          if (k) values[k] = el.value;
                        });
                        saveSettings(it.id, values);
                        setEditing(null); refresh();
                        toast(`${it.name} connected.`);
                      }}
                    >
                      Save & connect
                    </button>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditing(null)}>Cancel</button>
                  </div>
                </div>
              )}

              <div className="mt-3 flex gap-2">
                {connected ? (
                  <button type="button" className="btn btn-outline btn-sm flex-1" onClick={() => { disconnect(it.id); refresh(); toast(`${it.name} disconnected.`, "info"); }}>
                    Disconnect
                  </button>
                ) : (
                  <button type="button" className="btn btn-dark btn-sm flex-1" onClick={() => setEditing(isOpen ? null : it.id)}>
                    {isOpen ? "Close" : "Connect"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
