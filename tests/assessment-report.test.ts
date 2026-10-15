import assert from "node:assert/strict";
import test from "node:test";
import { createAssessmentDraft, type AssessmentDraft } from "../src/lib/assessment-draft.ts";
import { buildAssessmentReport, REPORT_DISCLOSURE } from "../src/lib/assessment-report.ts";
import { getDemoRoofArea } from "../src/lib/roof-geometry.ts";

function completedDraft(): AssessmentDraft {
  return {
    ...createAssessmentDraft(),
    step: 5,
    buildingType: "house",
    solution: "solar",
    address: "  Example Street 12, Nicosia  ",
    electricityValues: { bill: "1250.50", kwh: "300.25" },
  };
}

test("summarizes bill inputs using currency and an explicit prototype disclosure", () => {
  const draft = completedDraft();
  const report = buildAssessmentReport(draft);
  assert.deepEqual(report, {
    building: "Detached House",
    solution: "Solar Energy System",
    location: "Example Street 12, Nicosia",
    consumption: "1,250.5 TRY / month",
    roofArea: getDemoRoofArea(draft.roofBox),
    annualLabel: "Annualized electricity bill",
    annualValue: "15,006 TRY / year",
    status: "Prototype input summary",
    disclosure: REPORT_DISCLOSURE,
  });
  assert.equal(REPORT_DISCLOSURE, "Demo roof area is illustrative; no real map measurement or solar production, savings, or payback calculation is available.");
  assert.ok(!Object.hasOwn(report!, "annualProduction"));
  assert.ok(!Object.hasOwn(report!, "annualSavings"));
  assert.ok(!Object.hasOwn(report!, "payback"));
});

test("summaries update from changed building, solution, roof and active consumption", () => {
  const original = completedDraft();
  const changed: AssessmentDraft = {
    ...original,
    buildingType: "industrial",
    solution: "storage",
    electricityMode: "kwh",
    roofBox: { x: 10, y: 10, width: 40, height: 30 },
  };
  const report = buildAssessmentReport(changed);
  assert.ok(report);
  assert.equal(report.building, "Industrial");
  assert.equal(report.solution, "Solar Energy + Storage");
  assert.equal(report.roofArea, 96);
  assert.equal(report.consumption, "300.25 kWh / month");
  assert.equal(report.annualLabel, "Annualized electricity usage");
  assert.equal(report.annualValue, "3,603 kWh / year");
  assert.notEqual(report.roofArea, buildAssessmentReport(original)?.roofArea);
  assert.equal(original.electricityMode, "bill");
});

test("all supported building types use their visible labels", () => {
  for (const [buildingType, expected] of [
    ["house", "Detached House"],
    ["apartment", "Apartment / Site"],
    ["commercial", "Commercial"],
    ["industrial", "Industrial"],
  ]) {
    assert.equal(buildAssessmentReport({ ...completedDraft(), buildingType })?.building, expected);
  }
});

test("blank addresses remain unmeasured and long addresses are retained", () => {
  assert.equal(buildAssessmentReport({ ...completedDraft(), address: " \t " })?.location, "Not provided");
  const address = "A long building and street description with entrance details, ".repeat(7);
  assert.equal(buildAssessmentReport({ ...completedDraft(), address })?.location, address.trim());
});

test("rejects invalid active values and incomplete choices instead of fabricating a report", () => {
  for (const value of ["", "0", "0.001", "-10", "1e3", "NaN", "Infinity", "10000000.01"]) {
    assert.equal(buildAssessmentReport({
      ...completedDraft(),
      electricityValues: { bill: value, kwh: "300" },
    }), null, `invalid bill ${JSON.stringify(value)} must not produce a report`);
  }
  assert.equal(buildAssessmentReport({ ...completedDraft(), buildingType: "" }), null);
  assert.equal(buildAssessmentReport({ ...completedDraft(), buildingType: "toString" }), null);
  assert.equal(buildAssessmentReport({ ...completedDraft(), solution: "unknown" }), null);
  assert.equal(buildAssessmentReport({ ...completedDraft(), electricityMode: "kwh", electricityValues: { bill: "10", kwh: "1000000.01" } }), null);
});

test("only the selected draft is validated and bill amounts never convert to energy", () => {
  const draft = { ...completedDraft(), electricityValues: { bill: "500", kwh: "" } };
  const bill = buildAssessmentReport(draft);
  assert.equal(bill?.consumption, "500 TRY / month");
  assert.equal(bill?.annualValue, "6,000 TRY / year");
  assert.equal(buildAssessmentReport({ ...draft, electricityMode: "kwh" }), null);
  const usage = buildAssessmentReport({
    ...draft,
    electricityMode: "kwh",
    electricityValues: { bill: "bad draft", kwh: "0.01" },
  });
  assert.equal(usage?.consumption, "0.01 kWh / month");
  assert.equal(usage?.annualValue, "0.12 kWh / year");
});
