/** Roof coordinates and dimensions, as percentages of the demo map. */
export type RoofBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type RoofCorner = "tl" | "tr" | "bl" | "br";

export const initialRoofBox: Readonly<RoofBox> = Object.freeze({
  x: 34,
  y: 30,
  width: 28,
  height: 24,
});

const minimumSize = 10;
const mapSize = 100;

export function clamp(value: number, minimum: number, maximum: number) {
  return Number.isNaN(value)
    ? minimum
    : Math.min(Math.max(value, minimum), maximum);
}

function boundedRoof(box: RoofBox): RoofBox {
  const width = clamp(box.width, minimumSize, mapSize);
  const height = clamp(box.height, minimumSize, mapSize);

  return {
    x: clamp(box.x, 0, mapSize - width),
    y: clamp(box.y, 0, mapSize - height),
    width,
    height,
  };
}

function validDelta(delta: number) {
  return Number.isFinite(delta) ? delta : 0;
}

/** Translate a selection without allowing any edge to leave the map. */
export function moveRoof(box: RoofBox, dx: number, dy: number): RoofBox {
  const roof = boundedRoof(box);

  return {
    ...roof,
    x: clamp(roof.x + validDelta(dx), 0, mapSize - roof.width),
    y: clamp(roof.y + validDelta(dy), 0, mapSize - roof.height),
  };
}

/** Resize a corner, keeping its opposite corner fixed and each size >= 10%. */
export function resizeRoof(
  box: RoofBox,
  corner: RoofCorner,
  dx: number,
  dy: number,
): RoofBox {
  const roof = boundedRoof(box);
  const right = roof.x + roof.width;
  const bottom = roof.y + roof.height;
  const movesLeft = corner === "tl" || corner === "bl";
  const movesTop = corner === "tl" || corner === "tr";

  const x = movesLeft
    ? clamp(roof.x + validDelta(dx), 0, right - minimumSize)
    : roof.x;
  const y = movesTop
    ? clamp(roof.y + validDelta(dy), 0, bottom - minimumSize)
    : roof.y;

  return {
    x,
    y,
    width: movesLeft
      ? right - x
      : clamp(roof.width + validDelta(dx), minimumSize, mapSize - x),
    height: movesTop
      ? bottom - y
      : clamp(roof.height + validDelta(dy), minimumSize, mapSize - y),
  };
}

/** Visual demo scale only; this does not measure a real geographic roof area. */
export function getDemoRoofArea(box: Pick<RoofBox, "width" | "height">) {
  const width = clamp(box.width, minimumSize, mapSize);
  const height = clamp(box.height, minimumSize, mapSize);

  return Math.max(1, Math.round(width * height * 0.08));
}
