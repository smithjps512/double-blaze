import { isDemo } from "@/lib/data";

/** Every page says so when it is showing invented sample animals. */
export function DemoBanner() {
  if (!isDemo()) return null;
  return (
    <div className="bg-pine px-4 py-2 text-center text-sm text-white" role="note">
      <strong>Demo mode.</strong> These shelters and animals are invented samples. Nothing you do here is saved.
    </div>
  );
}
