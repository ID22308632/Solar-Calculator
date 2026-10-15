import assert from "node:assert/strict";
import test from "node:test";
import {
  CONSUMPTION_FIELDS,
  CONSUMPTION_LIMITS,
  createConsumptionState,
  getConsumptionValue,
  setConsumptionMode,
  setConsumptionValue,
  validateConsumption,
  type ElectricityMode,
} from "../src/lib/consumption.ts";

test("accepts complete decimal amounts and trims surrounding spaces", () => {
  for (const mode of ["bill", "kwh"] as ElectricityMode[]) {
    for (const [draft, expected] of [
      ["0.01", 0.01],
      [".5", 0.5],
      ["250", 250],
      ["250.50", 250.5],
      ["250.", 250],
      [" 250.50 ", 250.5],
    ] as const) {
      assert.deepEqual(validateConsumption(draft, mode), {
        valid: true,
        value: expected,
      });
    }
  }
});

test("rejects alternate numeric syntax, nonfinite values and incomplete drafts", () => {
  const invalidDrafts = [
    "", " ", ".", "-1", "+1", "1e3", "1E3", "0x10", "0b10",
    "NaN", "Infinity", "-Infinity", "1,000", "1,5", "1 2", "1.2.3", "₺200",
  ];
  for (const mode of ["bill", "kwh"] as ElectricityMode[]) {
    for (const draft of invalidDrafts) {
      const result = validateConsumption(draft, mode);
      assert.equal(result.valid, false, `${mode} must reject ${JSON.stringify(draft)}`);
      if (!result.valid) assert.ok(result.error.length > 0);
    }
    assert.equal(validateConsumption("9".repeat(400), mode).valid, false);
  }
});

test("uses the same inclusive minimum for bills and monthly usage", () => {
  for (const mode of ["bill", "kwh"] as ElectricityMode[]) {
    for (const draft of ["0", "0.00", "0.001", "0.009999"]) {
      const result = validateConsumption(draft, mode);
      assert.equal(result.valid, false);
      if (!result.valid) {
        assert.equal(result.error, `Enter at least 0.01 ${CONSUMPTION_FIELDS[mode].unit} per month.`);
      }
    }
    assert.equal(validateConsumption(String(CONSUMPTION_LIMITS.minimum), mode).valid, true);
    assert.equal(CONSUMPTION_FIELDS[mode].min, CONSUMPTION_LIMITS.minimum);
  }
});

test("enforces inclusive unit-specific maximums", () => {
  assert.deepEqual(validateConsumption("10000000", "bill"), { valid: true, value: 10_000_000 });
  assert.deepEqual(validateConsumption("1000000", "kwh"), { valid: true, value: 1_000_000 });
  assert.deepEqual(validateConsumption("10000000.01", "bill"), {
    valid: false,
    error: "Enter no more than 10,000,000 TRY per month.",
  });
  assert.deepEqual(validateConsumption("1000000.01", "kwh"), {
    valid: false,
    error: "Enter no more than 1,000,000 kWh per month.",
  });
  assert.equal(validateConsumption("2000000", "bill").valid, true);
  assert.equal(validateConsumption("2000000", "kwh").valid, false);
});

test("empty and malformed drafts receive field-specific instructions", () => {
  assert.deepEqual(validateConsumption("", "bill"), {
    valid: false,
    error: "Enter your average monthly electricity bill.",
  });
  assert.deepEqual(validateConsumption("", "kwh"), {
    valid: false,
    error: "Enter your average monthly electricity usage.",
  });
  assert.deepEqual(validateConsumption("1e2", "kwh"), {
    valid: false,
    error: "Enter a decimal amount in kWh (for example, 250.50).",
  });
});

test("switching modes keeps independent drafts without converting their units", () => {
  const initial = createConsumptionState();
  const bill = setConsumptionValue(initial, "1500.75");
  const usage = setConsumptionMode(bill, "kwh");
  assert.equal(getConsumptionValue(usage), "");
  const enteredUsage = setConsumptionValue(usage, "340.5");
  const backToBill = setConsumptionMode(enteredUsage, "bill");
  assert.equal(getConsumptionValue(backToBill), "1500.75");
  assert.equal(getConsumptionValue(setConsumptionMode(backToBill, "kwh")), "340.5");
  assert.deepEqual(initial, { mode: "bill", values: { bill: "", kwh: "" } });
  assert.deepEqual(bill.values, { bill: "1500.75", kwh: "" });
});

test("drafts retain incomplete input for editing and restart state is fresh", () => {
  const edited = setConsumptionValue(createConsumptionState(), "0.");
  assert.equal(getConsumptionValue(edited), "0.");
  assert.equal(validateConsumption(getConsumptionValue(edited), edited.mode).valid, false);
  const restarted = createConsumptionState();
  assert.deepEqual(restarted, { mode: "bill", values: { bill: "", kwh: "" } });
  assert.notEqual(restarted.values, createConsumptionState().values);
});
