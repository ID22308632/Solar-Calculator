"use client";

import { useId } from "react";

import { moveRoof, resizeRoof, type RoofBox } from "@/lib/roof-geometry";

type RoofControlsProps = {
  value: RoofBox;
  onChange: (box: RoofBox) => void;
};

export function RoofControls({ value, onChange }: RoofControlsProps) {
  const id = useId();
  const roof = moveRoof(value, 0, 0);
  const controls = [
    { key: "x", label: "Horizontal position", minimum: 0, maximum: 100 - roof.width },
    { key: "y", label: "Vertical position", minimum: 0, maximum: 100 - roof.height },
    { key: "width", label: "Width", minimum: 10, maximum: 100 - roof.x },
    { key: "height", label: "Height", minimum: 10, maximum: 100 - roof.y },
  ] as const;

  function update(key: keyof RoofBox, nextValue: number) {
    if (key === "x" || key === "y") {
      onChange(
        moveRoof(
          roof,
          key === "x" ? nextValue - roof.x : 0,
          key === "y" ? nextValue - roof.y : 0,
        ),
      );
      return;
    }

    onChange(
      resizeRoof(
        roof,
        "br",
        key === "width" ? nextValue - roof.width : 0,
        key === "height" ? nextValue - roof.height : 0,
      ),
    );
  }

  return (
    <fieldset className="mt-4 rounded-lg border border-gray-200 p-3">
      <legend className="px-1 text-sm font-medium">Roof selection controls</legend>
      <p id={`${id}-help`} className="mb-3 text-xs leading-5 text-gray-500">
        Use arrow keys on the sliders to move or resize the selection. All values
        are percentages of the demo map.
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {controls.map(({ key, label, minimum, maximum }) => (
          <div key={key}>
            <div className="flex items-center justify-between gap-2 text-xs">
              <label htmlFor={`${id}-${key}`}>{label} (%)</label>
              <output htmlFor={`${id}-${key}`} aria-hidden="true">
                {Math.round(roof[key])}%
              </output>
            </div>
            <input
              id={`${id}-${key}`}
              type="range"
              min={minimum}
              max={maximum}
              step={1}
              value={roof[key]}
              aria-describedby={`${id}-help`}
              aria-valuetext={`${Math.round(roof[key])} percent`}
              onChange={(event) => update(key, event.currentTarget.valueAsNumber)}
              className="mt-2 w-full cursor-pointer accent-[#b52a54] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b52a54]"
            />
          </div>
        ))}
      </div>
    </fieldset>
  );
}
