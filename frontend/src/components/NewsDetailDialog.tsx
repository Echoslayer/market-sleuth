import { useEffect, useRef } from "react";
import type { NewsItem } from "../types/scenario";

type NewsDetailDialogProps = {
  item: NewsItem | null;
  onClose: () => void;
};

export function NewsDetailDialog({ item, onClose }: NewsDetailDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (item && !dialog.open) dialog.showModal();
    if (!item && dialog.open) dialog.close();
  }, [item]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="w-[min(40rem,calc(100%-2rem))] rounded border border-slate-200 bg-white p-0 text-slate-950 shadow-lg backdrop:bg-slate-950/40"
    >
      {item ? (
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">{item.headline}</h3>
              <p className="mt-1 text-sm text-slate-500">{item.date}</p>
            </div>
            <button
              type="button"
              aria-label="Close news dialog"
              onClick={() => dialogRef.current?.close()}
              className="rounded border border-slate-300 px-2 py-1 text-sm text-slate-600 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {item.content || "請點連結閱讀原文"}
          </p>
          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener"
              className="mt-4 inline-block text-sm font-medium text-slate-900 underline"
            >
              閱讀原文
            </a>
          ) : null}
        </div>
      ) : null}
    </dialog>
  );
}
