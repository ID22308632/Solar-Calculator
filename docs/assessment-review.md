# Day 23 work package — SolarCheck assessment review

Review performed: **15 October 2026**, with Codex assistance. “Day 23” is the task slot in the agreed sequence; it does not date this review to September.

## Purpose

Understand the assessment before changing or extending it. Follow each input into the final summary, record the prototype's limits, and define checks for the remaining tasks.

## Five-step workflow

| Step | What the visitor does | Requirement to continue | Information retained |
|---|---|---|---|
| 1 — Building | Select house, apartment/site, commercial or industrial | A building is selected | Building type |
| 2 — Solution | Select solar or solar plus storage | A solution is selected | System preference |
| 3 — Demo roof | Enter an optional site label; move or resize the rectangle with pointer or sliders | The default roof box is valid; address is optional | Site label and roof position/size |
| 4 — Electricity | Enter a monthly bill in TRY or usage in kWh | The active value passes validation | Separate bill and kWh drafts |
| 5 — Summary | Inspect values, go Back, print or Start Again | Known building/solution and valid active electricity input | Input summary and annualized input |

Close returns to the homepage. Start / Resume reopens the same tab's draft. Step changes focus the heading; Back retains the entered selections.

## Where to look in VS Code

| File | Read it to understand |
|---|---|
| [Assessment page](../src/app/assessment/page.tsx) | The five visible steps, events and navigation |
| [Assessment state](../src/hooks/use-assessment.ts) | Updating selections, restoring/saving progress and restarting |
| [Consumption rules](../src/lib/consumption.ts) | Validation messages, limits and units |
| [Roof geometry](../src/lib/roof-geometry.ts) | Movement, corner resizing, bounds and demo area |
| [Saved draft](../src/lib/assessment-draft.ts) | Draft format and validation of stored data |
| [Report builder](../src/lib/assessment-report.ts) | Turning current inputs into summary text |

## Rules and limitations

- Bill and kWh inputs accept ordinary decimals from 0.01 through 10,000,000 TRY or 1,000,000 kWh per month. They reject empty, zero, negative, exponent and nonnumeric values.
- Switching units preserves independent values and performs no tariff conversion.
- Roof coordinates are percentages of the drawing. Width/height remain at least 10%, and every edge stays inside the drawing.
- Demo area is `max(1, round(width × height × 0.08))`. Initial dimensions 28% × 24% display 54 m². The coefficient is illustrative, without a geographic scale.
- Annualized input equals the monthly input × 12. A bill of 1250.50 TRY gives 15,006 TRY/year; usage of 300.25 kWh gives 3,603 kWh/year.
- There is no real map, address lookup, solar-yield model, panel sizing, battery sizing, savings or payback calculation. The address is an unverified report label.
- Drafts use session storage in the current tab and origin. There is no backend/account synchronization. Malformed or incompatible drafts fail safely; invalid prerequisites return the user to an earlier step.

## Initial findings and related improvements

The starting source at `06bfe3c` had weak numeric gating, a shared value reinterpreted when units changed, pointer-only roof controls, an inactive Close control, fixed financial result cards, and no saved draft or print action. The current working copy includes implementations addressing these findings.

The remaining task sequence is: Day 24 input validation; Day 25 roof controls; Day 26 navigation/accessibility; Day 27 draft recovery; Day 28 dynamic summary; Day 29 print/presentation; Day 30 regression checks and handover. Review the existing changes against these requirements before adding more code.

## Acceptance checklist

1. Required building/solution choices block continuation until selected; Back retains them; Close returns home.
2. Pointer and keyboard roof controls obey boundaries and minimum dimensions; Reset restores the initial selection.
3. Invalid electricity inputs block continuation; 1250.50 TRY and 300.25 kWh survive unit switching independently.
4. Summary labels, site text, units, demo area and annualized arithmetic match the current inputs; limitations remain visible.
5. Refresh restores a valid same-tab draft; damaged drafts fail safely; Start Again clears selections and values.
6. Keyboard and narrow-screen layouts remain usable; print/PDF keeps summary content and hides controls.

## Available evidence

- Earlier automated run: **43 tests passed**, plus ESLint and TypeScript checks. These test helper/storage/data contracts; they do not mount the React interface.
- Earlier browser checks confirmed the core journey, keyboard width adjustment, invalid-input blocking, unit preservation, summary arithmetic, reload, Close / Resume, restart and narrow-screen wrapping.
- The user subsequently reported that the supplied manual checklist was working. Native print preview was not independently inspected by Codex; no exported PDF was retained as evidence.
- This review did not rerun checks because it changes documentation only.

## Short task record

Reviewed SolarCheck's five-step workflow and traced building, solution, roof and electricity inputs into the summary. Recorded validation rules, draft recovery, report arithmetic and prototype limitations, and prepared acceptance checks for the remaining improvements.
