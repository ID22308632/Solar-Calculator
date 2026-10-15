export type ElectricityMode = "bill" | "kwh";

export const CONSUMPTION_LIMITS = {
  minimum: 0.01,
  bill: 10_000_000,
  kwh: 1_000_000,
} as const;

export const CONSUMPTION_FIELDS = {
  bill: {
    label: "Average monthly electricity bill",
    unit: "TRY",
    symbol: "₺",
    min: CONSUMPTION_LIMITS.minimum,
    max: CONSUMPTION_LIMITS.bill,
  },
  kwh: {
    label: "Average monthly electricity usage",
    unit: "kWh",
    symbol: "kWh",
    min: CONSUMPTION_LIMITS.minimum,
    max: CONSUMPTION_LIMITS.kwh,
  },
} as const;

export type ConsumptionValidation =
  | { valid: true; value: number }
  | { valid: false; error: string };

/** Validate the complete draft, rather than accepting Number's alternate formats. */
export function validateConsumption(
  raw: string,
  mode: ElectricityMode,
): ConsumptionValidation {
  const text = raw.trim();
  const field = CONSUMPTION_FIELDS[mode];

  if (!text) {
    return {
      valid: false,
      error: `Enter your ${field.label.toLowerCase()}.`,
    };
  }

  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) {
    return {
      valid: false,
      error: `Enter a decimal amount in ${field.unit} (for example, 250.50).`,
    };
  }

  const value = Number(text);

  if (!Number.isFinite(value) || value > field.max) {
    return {
      valid: false,
      error: `Enter no more than ${field.max.toLocaleString("en-US")} ${field.unit} per month.`,
    };
  }

  if (value < field.min) {
    return {
      valid: false,
      error: `Enter at least ${field.min} ${field.unit} per month.`,
    };
  }

  return { valid: true, value };
}

export type ConsumptionState = {
  mode: ElectricityMode;
  values: Record<ElectricityMode, string>;
};

export function createConsumptionState(): ConsumptionState {
  return { mode: "bill", values: { bill: "", kwh: "" } };
}

export function setConsumptionMode(
  state: ConsumptionState,
  mode: ElectricityMode,
): ConsumptionState {
  return { ...state, mode };
}

export function setConsumptionValue(
  state: ConsumptionState,
  value: string,
): ConsumptionState {
  return { ...state, values: { ...state.values, [state.mode]: value } };
}

export function getConsumptionValue(state: ConsumptionState): string {
  return state.values[state.mode];
}
