"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BatteryCharging, Building2, Factory, Home, Printer, RotateCcw, Store, Sun, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { RoofControls } from "@/components/roof-controls";
import { useAssessment } from "@/hooks/use-assessment";
import { CONSUMPTION_FIELDS, validateConsumption } from "@/lib/consumption";
import { buildAssessmentReport } from "@/lib/assessment-report";
import { getDemoRoofArea, initialRoofBox, moveRoof, resizeRoof, type RoofBox, type RoofCorner } from "@/lib/roof-geometry";

const buildings = [
  { id: "house", title: "Detached House", icon: Home },
  { id: "apartment", title: "Apartment / Site", icon: Building2 },
  { id: "commercial", title: "Commercial", icon: Store },
  { id: "industrial", title: "Industrial", icon: Factory },
] as const;
const solutions = [
  { id: "solar", title: "Solar Energy System", icon: Sun, description: "Generate electricity using solar panels." },
  { id: "storage", title: "Solar Energy + Storage", icon: BatteryCharging, description: "Generate solar energy and store it for later use." },
] as const;
const titles = ["Where will the installation be?", "Which solution do you need?", "Explore a demo roof selection", "Your electricity consumption", "Your assessment summary"];
type DragState = { pointerId: number; corner?: RoofCorner; startX: number; startY: number; box: RoofBox } | null;

export default function AssessmentPage() {
  const { draft, hydrated, restored, storageError, update, restart } = useAssessment();
  const { step, buildingType, solution, address, electricityMode, electricityValues, roofBox } = draft;
  const [drag, setDrag] = useState<DragState>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const electricityValue = electricityValues[electricityMode];
  const validation = validateConsumption(electricityValue, electricityMode);
  const field = CONSUMPTION_FIELDS[electricityMode];
  const roofArea = getDemoRoofArea(roofBox);
  const report = buildAssessmentReport(draft);

  useEffect(() => {
    if (hydrated) headingRef.current?.focus();
  }, [step, hydrated]);

  function startDrag(event: PointerEvent<HTMLElement>, corner?: RoofCorner) {
    if (event.button !== 0 || !event.isPrimary || drag || !mapRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    mapRef.current.setPointerCapture(event.pointerId);
    setDrag({ pointerId: event.pointerId, corner, startX: event.clientX, startY: event.clientY, box: roofBox });
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!drag || event.pointerId !== drag.pointerId || !mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dx = (event.clientX - drag.startX) / rect.width * 100;
    const dy = (event.clientY - drag.startY) / rect.height * 100;
    update({ roofBox: drag.corner ? resizeRoof(drag.box, drag.corner, dx, dy) : moveRoof(drag.box, dx, dy) });
  }

  function stopDrag(event: PointerEvent<HTMLDivElement>) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setDrag(null);
  }

  if (!hydrated) return <main className="p-8" aria-busy="true">Loading assessment…</main>;

  return (
    <main className="min-h-screen bg-[#f4f4f6] text-black">
      <header className="assessment-header border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <Link href="/" className="flex items-center gap-2 font-bold" aria-label="SolarCheck home"><Sun size={22} className="text-[#b10f3b]" />SolarCheck</Link>
          <Link href="/" className="flex min-h-10 items-center gap-2 rounded px-3 text-sm text-gray-600 focus-visible:outline-2 focus-visible:outline-[#b10f3b]">Close<X size={16} aria-hidden="true" /></Link>
        </div>
      </header>
      <div className="assessment-status mx-auto max-w-7xl px-5 pt-3 text-xs text-gray-600" role="status">
        {storageError ? "Draft storage is unavailable. Keep this tab open to retain your progress." : restored ? "Your draft was restored in this tab." : "Progress is saved in this tab. Start Again clears the draft."}
      </div>
      <section className={`mx-auto max-w-7xl px-5 py-6 ${step === 5 ? "report-page" : ""}`} aria-labelledby="assessment-heading">
        <div className="step-heading mb-6">
          <p className="text-xs font-semibold text-[#b10f3b]">Step {step} / 5 · Solar assessment prototype</p>
          <Progress value={step * 20} aria-label={`Assessment progress, step ${step} of 5`} className="mt-3" />
          <h1 ref={headingRef} id="assessment-heading" tabIndex={-1} className="mt-4 text-2xl font-bold outline-none sm:text-3xl">{titles[step - 1]}</h1>
        </div>

        {step === 1 && (
          <div className="rounded-xl bg-white p-5 sm:p-8">
            <p className="mb-6 text-gray-600">Choose the building type for your project.</p>
            <div role="group" aria-label="Building type" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {buildings.map(({ id, title, icon: Icon }) => (
                <button key={id} type="button" aria-pressed={buildingType === id} onClick={() => update({ buildingType: id })} className={`flex min-h-36 flex-col items-center justify-center gap-3 rounded-lg border-2 p-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b10f3b] ${buildingType === id ? "border-[#b10f3b] bg-[#fff8fa]" : "border-gray-200 hover:border-gray-400"}`}>
                  <Icon size={28} aria-hidden="true" /><span className="font-medium">{title}</span>
                </button>
              ))}
            </div>
            <Navigation onContinue={() => update({ step: 2 })} disabled={!buildingType} />
          </div>
        )}

        {step === 2 && (
          <div className="rounded-xl bg-white p-5 sm:p-8">
            <p className="mb-6 text-gray-600">Choose the solution you want to explore.</p>
            <div role="group" aria-label="Solar solution" className="grid gap-4 sm:grid-cols-2">
              {solutions.map(({ id, title, icon: Icon, description }) => (
                <button key={id} type="button" aria-pressed={solution === id} onClick={() => update({ solution: id })} className={`rounded-lg border-2 p-6 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b10f3b] ${solution === id ? "border-[#b10f3b] bg-[#fff8fa]" : "border-gray-200 hover:border-gray-400"}`}>
                  <Icon size={28} aria-hidden="true" /><span className="mt-4 block font-semibold">{title}</span><span className="mt-2 block text-sm text-gray-600">{description}</span>
                </button>
              ))}
            </div>
            <Navigation onBack={() => update({ step: 1 })} onContinue={() => update({ step: 3 })} disabled={!solution} />
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
            <div className="min-w-0 rounded-xl bg-white p-4">
              <label htmlFor="site-label" className="text-sm font-medium">Site label or address (optional)</label>
              <Input id="site-label" value={address} maxLength={500} onChange={(event) => update({ address: event.target.value })} placeholder="For your report only" aria-describedby="map-disclosure" className="mt-2 w-full" />
              <p id="map-disclosure" className="my-3 text-sm text-gray-600">Demo schematic. The address is a label only; location search and geographic measurement are unavailable.</p>
              <div ref={mapRef} data-testid="roof-map" onPointerMove={handlePointerMove} onPointerUp={stopDrag} onPointerCancel={stopDrag} onLostPointerCapture={() => setDrag(null)} className="relative h-80 touch-none overflow-hidden rounded-xl bg-[#696c70] sm:h-96">
                <span className="absolute left-3 top-3 rounded bg-white px-3 py-1 text-xs font-semibold">DEMO SCHEMATIC</span>
                <div aria-hidden="true" className="absolute left-[4%] top-[15%] h-full w-[17%] bg-[#4f5256]" />
                <div aria-hidden="true" className="absolute left-[36%] top-[20%] h-[65%] w-[23%] bg-[#b7b9bb]" />
                <div aria-hidden="true" className="absolute right-[7%] top-[20%] h-[25%] w-[25%] bg-[#505358]" />
                <div data-testid="roof-box" onPointerDown={(event) => startDrag(event)} className="absolute cursor-move border-2 border-[#b10f3b] bg-[#b10f3b]/25 shadow-lg" style={{ left: `${roofBox.x}%`, top: `${roofBox.y}%`, width: `${roofBox.width}%`, height: `${roofBox.height}%` }}>
                  <div className="pointer-events-none flex h-full items-center justify-center"><span className="rounded bg-white/95 p-2 text-center text-xs font-semibold">Demo area<br />{roofArea} m²</span></div>
                  {(["tl", "tr", "bl", "br"] as const).map((corner) => (
                    <span key={corner} aria-hidden="true" onPointerDown={(event) => startDrag(event, corner)} className={`absolute h-6 w-6 rounded-full border-2 border-white bg-[#b10f3b] ${corner[0] === "t" ? "-top-3" : "-bottom-3"} ${corner[1] === "l" ? "-left-3" : "-right-3"} ${corner === "tl" || corner === "br" ? "cursor-nwse-resize" : "cursor-nesw-resize"}`} />
                  ))}
                </div>
              </div>
            </div>
            <div className="min-w-0 rounded-xl bg-white p-5">
              <h2 className="font-semibold">Demo selected area: <span aria-live="polite">{roofArea} m²</span></h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">Drag the box or a corner, or use the keyboard sliders below. The illustrative scale is not a measured roof area.</p>
              <RoofControls value={roofBox} onChange={(box) => update({ roofBox: box })} />
              <Button type="button" variant="outline" onClick={() => { setDrag(null); update({ roofBox: { ...initialRoofBox } }); }} className="mt-4 gap-2"><RotateCcw size={14} />Reset roof</Button>
              <Navigation onBack={() => update({ step: 2 })} onContinue={() => update({ step: 4 })} />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="rounded-xl bg-white p-5 sm:p-8">
            <div role="group" aria-label="Electricity input unit" className="flex flex-wrap gap-2">
              {(["bill", "kwh"] as const).map((mode) => (
                <button key={mode} type="button" aria-pressed={electricityMode === mode} onClick={() => update({ electricityMode: mode })} className={`min-h-11 rounded-full px-5 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b10f3b] ${electricityMode === mode ? "bg-[#b10f3b] text-white" : "bg-gray-100 text-gray-700"}`}>{mode === "bill" ? "Monthly Bill" : "Monthly kWh"}</button>
              ))}
            </div>
            <p id="electricity-help" className="mt-4 max-w-xl text-sm leading-6 text-gray-600">Bill and kWh are separate inputs. Switching units keeps both values; no tariff conversion is performed. Enter a decimal amount from {field.min} to {field.max.toLocaleString("en-US")} {field.unit}.</p>
            <label htmlFor="electricity" className="mt-6 block text-sm font-medium">{field.label} ({field.unit})</label>
            <Input id="electricity" type="text" inputMode="decimal" maxLength={32} value={electricityValue} onChange={(event) => update({ electricityValues: { ...electricityValues, [electricityMode]: event.target.value } })} placeholder="e.g. 250.50" aria-invalid={!validation.valid && electricityValue !== ""} aria-describedby="electricity-help electricity-error" className="mt-2 max-w-lg" />
            <p id="electricity-error" aria-live="polite" className="mt-2 min-h-6 text-sm text-[#a00d34]">{!validation.valid ? validation.error : ""}</p>
            <Navigation onBack={() => update({ step: 3 })} onContinue={() => { if (validation.valid) update({ step: 5 }); }} disabled={!validation.valid} />
          </div>
        )}

        {step === 5 && report && (
          <>
            <article className="report rounded-xl border border-gray-200 bg-white p-5 sm:p-8" aria-label="SolarCheck input summary">
              <div className="border-b border-gray-200 pb-4"><p className="font-bold text-[#b10f3b]">SolarCheck</p><h2 className="mt-1 text-xl font-semibold">{report.status}</h2></div>
              <p className="mt-5 rounded-lg bg-[#faeef2] p-4 text-sm leading-6">{report.disclosure}</p>
              <dl className="mt-6 grid gap-5 sm:grid-cols-2">
                <ReportRow label="Building" value={report.building} />
                <ReportRow label="Solution" value={report.solution} />
                <ReportRow label="Demo roof area (illustrative)" value={`${report.roofArea} m²`} />
                <ReportRow label={field.label} value={report.consumption} />
                <ReportRow label="Site label / address (not verified)" value={report.location} />
                <ReportRow label={report.annualLabel} value={report.annualValue} />
              </dl>
              <p className="mt-6 text-xs leading-5 text-gray-600">Annualized input is the monthly amount × 12, with no tariff conversion. Demo area: round(width % × height % × 0.08), minimum 1 m². Site data and a reviewed calculation model are required for installation design.</p>
            </article>
            <div className="report-controls mt-5 flex flex-wrap justify-between gap-3">
              <Button type="button" variant="outline" onClick={() => update({ step: 4 })}><ArrowLeft size={15} />Back</Button>
              <Button type="button" variant="outline" onClick={() => window.print()}><Printer size={15} />Print / Save PDF</Button>
              <Button type="button" onClick={() => { setDrag(null); restart(); }} className="bg-[#b10f3b] text-white hover:bg-[#8f0c30]"><RotateCcw size={15} />Start Again</Button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function Navigation({ onBack, onContinue, disabled = false }: { onBack?: () => void; onContinue: () => void; disabled?: boolean }) {
  return <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4">
    {onBack ? <Button type="button" variant="ghost" onClick={onBack} className="min-h-11"><ArrowLeft size={15} />Back</Button> : <span />}
    <Button type="button" onClick={onContinue} disabled={disabled} className="min-h-11 rounded-full bg-[#b10f3b] px-6 text-white hover:bg-[#8f0c30]">Continue<ArrowRight size={15} /></Button>
  </div>;
}

function ReportRow({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 border-b border-gray-200 pb-3"><dt className="text-xs font-medium text-gray-600">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm font-semibold [overflow-wrap:anywhere]">{value}</dd></div>;
}
