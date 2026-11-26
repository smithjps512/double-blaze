import { getStore } from "@/lib/store";

/** Every screen says so when it is running on invented sample data. */
export function DemoBanner() {
  if (!getStore().demo) return null;
  return (
    <div className="bg-ink px-4 py-1.5 text-center text-sm text-white" role="note">
      <strong>Demo mode.</strong> Sample parties and servers. Server codes are 1111, 2222, 3333, 4444. Nothing is saved.
    </div>
  );
}
