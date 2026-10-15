import assert from "node:assert/strict";
import test from "node:test";
import {
  ASSESSMENT_DRAFT_KEY,
  clearAssessmentDraft,
  createAssessmentDraft,
  decodeAssessmentDraft,
  encodeAssessmentDraft,
  loadAssessmentDraft,
  saveAssessmentDraft,
  type AssessmentDraft,
  type DraftStorage,
} from "../src/lib/assessment-draft.ts";

function completeDraft(): AssessmentDraft {
  return {
    ...createAssessmentDraft(),
    step: 5,
    buildingType: "house",
    solution: "storage",
    address: "Example building",
    electricityMode: "kwh",
    electricityValues: { bill: "250.50", kwh: "150" },
  };
}

function memoryStorage(): DraftStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: (key) => { values.delete(key); },
  };
}

function decodeDraft(draft: unknown) {
  return decodeAssessmentDraft(JSON.stringify({ version: 1, draft }));
}

test("a valid completed draft round-trips both consumption modes and roof", () => {
  const draft = completeDraft();
  assert.deepEqual(decodeAssessmentDraft(encodeAssessmentDraft(draft)), draft);
  const storage = memoryStorage();
  assert.equal(saveAssessmentDraft(storage, draft), true);
  assert.deepEqual(loadAssessmentDraft(storage), draft);
  assert.ok(storage.getItem(ASSESSMENT_DRAFT_KEY));
});

test("missing, malformed, oversized, and unknown-version drafts are ignored", () => {
  for (const raw of [null, "", "{", "null", "[]", "1", '{}', '{"version":2,"draft":{}}', '{"version":1,"draft":[]}', " ".repeat(10_001)]) {
    assert.equal(decodeAssessmentDraft(raw), null);
  }
});

test("partial drafts default missing fields and cannot restore a report", () => {
  assert.deepEqual(decodeDraft({ step: 5 }), createAssessmentDraft());
  assert.equal(decodeDraft({ step: 5, buildingType: "house" })?.step, 2);
  const missingRoof = { ...completeDraft(), roofBox: undefined };
  assert.equal(decodeDraft(missingRoof)?.step, 3);
});

test("only known option IDs and integer steps can be restored", () => {
  assert.equal(decodeDraft({ ...completeDraft(), buildingType: "unknown" })?.step, 1);
  assert.equal(decodeDraft({ ...completeDraft(), solution: "unknown" })?.step, 2);
  for (const step of [-1, 0, 6, 2.5, "5", null]) {
    assert.equal(decodeDraft({ ...completeDraft(), step })?.step, 1);
  }
});

test("invalid mode or consumption cannot revive a completed report", () => {
  const invalidValues = ["Infinity", "NaN", "1e3", "0x10", "-3", "0", "0.001", "1000001", {}, null];
  for (const kwh of invalidValues) {
    const restored = decodeDraft({ ...completeDraft(), electricityValues: { bill: "250", kwh } });
    assert.equal(restored?.step, 4);
    assert.equal(restored?.electricityValues.kwh, "");
  }
  const restored = decodeDraft({ ...completeDraft(), electricityMode: "unknown" });
  assert.equal(restored?.electricityMode, "bill");
  assert.equal(restored?.step, 4);
  assert.equal(restored?.electricityValues.bill, "250.50");
});

test("hostile geometry is replaced and sent back to the roof step", () => {
  const roofs = [null, {}, { x: -1, y: 0, width: 10, height: 10 }, { x: 95, y: 0, width: 10, height: 10 }, { x: 0, y: 0, width: 101, height: 10 }, { x: 0, y: 0, width: 10, height: 0 }, { x: "0", y: 0, width: 10, height: 10 }, { x: 0, y: 0, width: Infinity, height: 10 }];
  for (const roofBox of roofs) {
    const restored = decodeDraft({ ...completeDraft(), roofBox });
    assert.deepEqual(restored?.roofBox, createAssessmentDraft().roofBox);
    assert.equal(restored?.step, 3);
  }
  assert.equal(decodeDraft({ ...completeDraft(), roofBox: { x: 0, y: 0, width: 100, height: 100 } })?.step, 5);
});

test("the optional address is bounded and does not gate progress", () => {
  for (const address of ["", 123, "x".repeat(501)]) {
    const restored = decodeDraft({ ...completeDraft(), address });
    assert.equal(restored?.address, "");
    assert.equal(restored?.step, 5);
  }
  assert.equal(decodeDraft({ ...completeDraft(), address: "  Example\u0000building  " })?.address, "Example building");
});

test("storage access failures are nonthrowing and reported", () => {
  const denied: DraftStorage = {
    getItem() { throw new Error("denied"); },
    setItem() { throw new Error("denied"); },
    removeItem() { throw new Error("denied"); },
  };
  assert.equal(loadAssessmentDraft(denied), null);
  assert.equal(saveAssessmentDraft(denied, completeDraft()), false);
  assert.equal(clearAssessmentDraft(denied), false);
});

test("restart removes only the assessment draft", () => {
  const storage = memoryStorage();
  storage.setItem("unrelated", "keep");
  saveAssessmentDraft(storage, completeDraft());
  assert.equal(clearAssessmentDraft(storage), true);
  assert.equal(loadAssessmentDraft(storage), null);
  assert.equal(storage.getItem("unrelated"), "keep");
  assert.equal(clearAssessmentDraft(storage), true);
});

test("new defaults do not share mutable roof or consumption objects", () => {
  const first = createAssessmentDraft();
  first.roofBox.x = 0;
  first.electricityValues.bill = "99";
  assert.equal(createAssessmentDraft().roofBox.x, 34);
  assert.equal(createAssessmentDraft().electricityValues.bill, "");
});
