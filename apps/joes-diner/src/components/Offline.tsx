/** Shown when a screen loses the connection. */
export function Offline({ show, children }: { show: boolean; children?: React.ReactNode }) {
  if (!show) return null;
  return (
    <div role="alert" className="fixed inset-x-0 top-0 z-50 bg-ink px-4 py-3 text-center text-lg font-bold text-white">
      Offline. Use the bell and the clipboard until this clears. {children}
    </div>
  );
}
