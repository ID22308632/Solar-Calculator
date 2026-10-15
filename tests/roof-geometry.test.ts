import assert from "node:assert/strict";
import test from "node:test";

import {
  clamp,
  getDemoRoofArea,
  initialRoofBox,
  moveRoof,
  resizeRoof,
  type RoofBox,
  type RoofCorner,
} from "../src/lib/roof-geometry.ts";

test("clamp handles both boundaries and invalid numeric values", () => {
  assert.equal(clamp(-1, 0, 100), 0);
  assert.equal(clamp(101, 0, 100), 100);
  assert.equal(clamp(42, 0, 100), 42);
  assert.equal(clamp(Number.NaN, 0, 100), 0);
  assert.equal(clamp(Number.POSITIVE_INFINITY, 0, 100), 100);
  assert.equal(clamp(Number.NEGATIVE_INFINITY, 0, 100), 0);
});

test("the reset selection is stable and operations never mutate it", () => {
  assert.deepEqual(initialRoofBox, { x: 34, y: 30, width: 28, height: 24 });
  moveRoof(initialRoofBox, 10, 10);
  resizeRoof(initialRoofBox, "tl", 10, 10);
  assert.deepEqual(initialRoofBox, { x: 34, y: 30, width: 28, height: 24 });
  assert.equal(Object.isFrozen(initialRoofBox), true);
});

test("movement preserves size and keeps every edge within the map", () => {
  assert.deepEqual(moveRoof(initialRoofBox, -1000, -1000), {
    x: 0, y: 0, width: 28, height: 24,
  });
  assert.deepEqual(moveRoof(initialRoofBox, 1000, 1000), {
    x: 72, y: 76, width: 28, height: 24,
  });
  assert.deepEqual(moveRoof(initialRoofBox, 3, -2), {
    x: 37, y: 28, width: 28, height: 24,
  });
});

test("nonfinite drag deltas do not corrupt the selection", () => {
  assert.deepEqual(moveRoof(initialRoofBox, Number.NaN, Infinity), initialRoofBox);
  for (const corner of ["tl", "tr", "bl", "br"] as const) {
    assert.deepEqual(resizeRoof(initialRoofBox, corner, Infinity, Number.NaN), initialRoofBox);
  }
});

test("invalid starting geometry is normalized before movement or resizing", () => {
  const invalid: RoofBox = { x: 200, y: -20, width: 500, height: -5 };
  const bounded: RoofBox = { x: 0, y: 0, width: 100, height: 10 };
  assert.deepEqual(moveRoof(invalid, 0, 0), bounded);
  assert.deepEqual(resizeRoof(invalid, "br", 0, 0), bounded);
  assert.deepEqual(moveRoof({ x: NaN, y: NaN, width: NaN, height: NaN }, 0, 0), {
    x: 0, y: 0, width: 10, height: 10,
  });
});

const cornerCases: {
  corner: RoofCorner;
  grow: [number, number];
  shrink: [number, number];
  largest: RoofBox;
  smallest: RoofBox;
}[] = [
  {
    corner: "tl", grow: [-1000, -1000], shrink: [1000, 1000],
    largest: { x: 0, y: 0, width: 62, height: 54 },
    smallest: { x: 52, y: 44, width: 10, height: 10 },
  },
  {
    corner: "tr", grow: [1000, -1000], shrink: [-1000, 1000],
    largest: { x: 34, y: 0, width: 66, height: 54 },
    smallest: { x: 34, y: 44, width: 10, height: 10 },
  },
  {
    corner: "bl", grow: [-1000, 1000], shrink: [1000, -1000],
    largest: { x: 0, y: 30, width: 62, height: 70 },
    smallest: { x: 52, y: 30, width: 10, height: 10 },
  },
  {
    corner: "br", grow: [1000, 1000], shrink: [-1000, -1000],
    largest: { x: 34, y: 30, width: 66, height: 70 },
    smallest: { x: 34, y: 30, width: 10, height: 10 },
  },
];

for (const { corner, grow, shrink, largest, smallest } of cornerCases) {
  test(`${corner} corner respects map boundaries and the minimum size`, () => {
    assert.deepEqual(resizeRoof(initialRoofBox, corner, ...grow), largest);
    assert.deepEqual(resizeRoof(initialRoofBox, corner, ...shrink), smallest);
  });

  test(`${corner} corner keeps the opposite corner fixed`, () => {
    const result = resizeRoof(initialRoofBox, corner, 3, -2);
    const oppositeX = corner.endsWith("l") ? result.x + result.width : result.x;
    const oppositeY = corner.startsWith("t") ? result.y + result.height : result.y;
    assert.equal(oppositeX, corner.endsWith("l") ? 62 : 34);
    assert.equal(oppositeY, corner.startsWith("t") ? 54 : 30);
  });
}

test("demo area retains the existing scale and bounds invalid dimensions", () => {
  assert.equal(getDemoRoofArea(initialRoofBox), 54);
  assert.equal(getDemoRoofArea({ width: 10, height: 10 }), 8);
  assert.equal(getDemoRoofArea({ width: 100, height: 100 }), 800);
  assert.equal(getDemoRoofArea({ width: NaN, height: -20 }), 8);
  assert.equal(getDemoRoofArea({ width: Infinity, height: Infinity }), 800);
});
