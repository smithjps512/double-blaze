import type { Block } from "@/lib/plant-showcase";

/**
 * Renders the blocks a plant file parsed into. Deliberately small: the students
 * write headings, bullets, numbered steps and paragraphs, so those are the four
 * things this knows how to draw.
 */
export function PlantProse({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        switch (block.kind) {
          case "heading":
            return (
              <h3
                key={index}
                className="pt-2 font-display text-lg font-bold text-blaze-maroon"
              >
                {block.text}
              </h3>
            );
          case "paragraph":
            return (
              <p key={index} className="leading-relaxed text-ink/80">
                {block.text}
              </p>
            );
          case "bullets":
            return (
              <ul key={index} className="space-y-2">
                {block.items.map((item, i) => (
                  <li key={i} className="flex gap-3 leading-relaxed text-ink/80">
                    <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ridge-green" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            );
          case "steps":
            return (
              <ol key={index} className="space-y-2">
                {block.items.map((item, i) => (
                  <li key={i} className="flex gap-3 leading-relaxed text-ink/80">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ridge-green/10 text-sm font-bold text-ridge-green">
                      {i + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            );
        }
      })}
    </div>
  );
}
