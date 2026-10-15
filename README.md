# SolarCheck

SolarCheck is a five-step solar assessment **prototype** built with Next.js, React and TypeScript. It records a building type, preferred solution, illustrative roof selection and monthly electricity input, then produces a printable input summary.

## Run locally

Use Node.js 24 or later and npm. From this directory:

```sh
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No environment variables or API keys are required. Fonts use local system fallbacks, so building the application does not fetch a Google font.

```sh
npm run check
npm run build
npm start
```

`check` runs the regression tests, ESLint and TypeScript checks. `build` creates the production application; `start` serves that build. Individual checks are available as `npm run test`, `npm run lint` and `npm run typecheck`.

Validation on this Windows workspace used `npm run build:webpack` successfully. The default Turbopack build encountered a local CSS-worker connection error. If that happens on your machine, use `npm run dev:webpack` and `npm run build:webpack`; both are supported Next.js compiler options. The installed package versions and lockfile were retained.

## What the prototype does

- Validates decimal monthly inputs from `0.01` to `10,000,000 TRY` for bills or `1,000,000 kWh` for usage. Exponents, hexadecimal values and nonfinite numbers are rejected. Bill and kWh drafts remain separate when switching modes.
- Shares bounded roof movement and resizing logic between pointer interactions and labelled keyboard sliders. Width and height stay at least 10% of the demo map.
- Provides keyboard focus indicators, pressed selection states, step headings, validation feedback and layouts that can scroll on smaller screens.
- Saves a versioned draft in `sessionStorage` when available. It survives refresh in the same browser tab and origin. Close returns home; Start resumes that tab's draft. Start Again clears the draft and resets the assessment. If storage is unavailable, the flow remains usable without persistence.
- Builds the summary from current inputs and offers the browser's Print / Save PDF dialog. Print styles hide navigation and controls and format the summary for A4.

## Calculation and data limitations

This is a **prototype input summary**, not a real feasibility assessment. It has no backend, address lookup, geocoding, real map measurement, solar production model, tariff conversion, storage sizing, installation design, savings calculation or payback calculation. Selecting Solar Energy + Storage only records a preference.

The displayed demo area is `max(1, round(width% × height% × 0.08))`. The coefficient is illustrative; percentages of a drawing do not establish geographic roof dimensions. The site label/address is unverified text for the summary.

Annualized input is the selected monthly amount multiplied by 12. A bill remains TRY and usage remains kWh; neither represents predicted solar output or savings. Summary numbers use `en-US` grouping and at most two decimal places.

Drafts are held in this browser's session storage, not an account or database. Tab closing, browser session restoration and privacy settings can affect retention. Avoid relying on the draft as a permanent record; use print/PDF for a copy. Stored data is validated on load, and incompatible or malformed drafts are ignored or restored to a safe earlier step.

## Code map

Start with the [assessment workflow review](docs/assessment-review.md) for a five-step map, validation rules and acceptance checklist to follow in VS Code.

| File | Responsibility |
| --- | --- |
| [src/app/page.tsx](src/app/page.tsx) | Landing page and prototype disclosure |
| [src/app/assessment/page.tsx](src/app/assessment/page.tsx) | Five-step flow, pointer interactions and summary UI |
| [src/components/roof-controls.tsx](src/components/roof-controls.tsx) | Keyboard-accessible roof sliders |
| [src/hooks/use-assessment.ts](src/hooks/use-assessment.ts) | Assessment state, draft restore, save and reset |
| [src/lib/consumption.ts](src/lib/consumption.ts) | Units, numeric validation and separate draft helpers |
| [src/lib/roof-geometry.ts](src/lib/roof-geometry.ts) | Roof bounds, movement, resizing and demo area |
| [src/lib/assessment-draft.ts](src/lib/assessment-draft.ts) | Versioned serialization, validation and storage helpers |
| [src/lib/assessment-report.ts](src/lib/assessment-report.ts) | Dynamic input summary and explicit limitations |
| [src/app/globals.css](src/app/globals.css) | Shared styles and print layout |
| [tests/](tests/) | Node regression tests for validation, geometry, drafts, reports and flow integration |

## Manual validation checklist

These are repeatable checks for handover, not a claim that every browser or printer has been tested. Run `npm run check` and `npm run build`, then check the application in a browser:

1. Start an assessment. Confirm Continue is disabled until a building and solution are selected. Tab through choices and activate them with the keyboard; verify visible focus and selected state.
2. On the demo roof step, enter a site label. Drag the selection and each corner to the edges. Use arrow keys on all four sliders. Confirm the selection stays within the map and both dimensions remain at least 10%. Reset roof and verify the default selection returns.
3. On electricity input, try empty text, `0`, `-1`, `1e3`, `Infinity` and values above each unit's maximum. Confirm feedback and blocked continuation. Confirm `0.01` and each maximum are accepted.
4. Enter bill `1250.50`, switch to kWh and enter `300.25`, then switch back. Confirm both drafts are preserved. Continue with bill mode: the summary should show `1,250.5 TRY / month` and `15,006 TRY / year`. Return and select kWh: expect `300.25 kWh / month` and `3,603 kWh / year`.
5. Confirm changed building, solution, roof and site text appear in the summary. Try a long site label and a narrow viewport; verify text wraps and all controls remain reachable. Confirm the prototype disclosure stays visible.
6. Refresh during the assessment and after reaching the summary. Confirm the same tab restores valid inputs and progress. Use Close and Start to confirm the draft resumes. Use Start Again, refresh, and confirm the empty first step remains.
7. Select Print / Save PDF. Inspect print preview for the summary, long text, units and limitations; verify navigation and buttons are hidden. Save a PDF and inspect the resulting pages. Printing depends on the browser and user-selected print settings.
