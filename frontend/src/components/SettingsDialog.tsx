import { useEffect, useRef } from "react";

// ponytail: hardcoded — public deploys only ship the toy fixture (real
// scenarios are gitignored for licensing), so a filesystem scan would 404
// in prod anyway. Add IDs here as local scenarios are built.
export const SCENARIO_IDS = ["toy-chipmaker-rally", "tsmc-2023-ai-rally", "nflx-2022-subscriber-shock"];

export type Settings = {
  scenarioId: string;
  revealAll: boolean;
  falsePositiveWeight: number;
  cutoffOverride: string;
  debug: boolean;
};

type SettingsDialogProps = {
  open: boolean;
  settings: Settings;
  onChange: (settings: Settings) => void;
  onClose: () => void;
};

export function SettingsDialog({ open, settings, onChange, onClose }: SettingsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="w-[min(28rem,calc(100%-2rem))] rounded border border-slate-200 bg-white p-0 text-slate-950 shadow-lg backdrop:bg-slate-950/40"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold">Settings (dev)</h3>
          <button
            type="button"
            aria-label="Close settings"
            onClick={() => dialogRef.current?.close()}
            className="rounded border border-slate-300 px-2 py-1 text-sm text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <label className="mt-5 block text-sm font-medium text-slate-700">
          Scenario
          <select
            value={settings.scenarioId}
            onChange={(e) => onChange({ ...settings, scenarioId: e.target.value })}
            className="mt-1 h-10 w-full rounded border border-slate-300 bg-white px-2 text-sm"
          >
            {SCENARIO_IDS.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-5 flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={settings.revealAll}
            onChange={(e) => onChange({ ...settings, revealAll: e.target.checked })}
          />
          Reveal everything before submit (ignore cutoff)
        </label>

        <label className="mt-5 block text-sm font-medium text-slate-700">
          Manual cutoff
          <input
            type="date"
            value={settings.cutoffOverride}
            onChange={(e) => onChange({ ...settings, cutoffOverride: e.target.value })}
            className="mt-1 h-10 w-full rounded border border-slate-300 bg-white px-2 text-sm"
          />
        </label>

        <label className="mt-5 block text-sm font-medium text-slate-700">
          False-positive penalty
          <select
            value={settings.falsePositiveWeight}
            onChange={(e) => onChange({ ...settings, falsePositiveWeight: Number(e.target.value) })}
            className="mt-1 h-10 w-full rounded border border-slate-300 bg-white px-2 text-sm"
          >
            <option value={0}>0x</option>
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
          </select>
        </label>

        <label className="mt-5 flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={settings.debug}
            onChange={(e) => onChange({ ...settings, debug: e.target.checked })}
          />
          Debug overlay
        </label>
      </div>
    </dialog>
  );
}
