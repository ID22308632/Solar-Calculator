"use client";

import {
  useRef,
  useState,
  type ElementType,
  type PointerEvent,
  type ReactNode,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  BatteryCharging,
  Building2,
  Check,
  Clock3,
  Factory,
  FileText,
  Gauge,
  Home,
  MapPin,
  RotateCcw,
  Store,
  Sun,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

type RoofBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type DragState =
  | {
      type: "move";
      startX: number;
      startY: number;
      box: RoofBox;
    }
  | {
      type: "resize";
      corner: "tl" | "tr" | "bl" | "br";
      startX: number;
      startY: number;
      box: RoofBox;
    }
  | null;

const buildingOptions = [
  {
    id: "house",
    title: "Detached House",
    icon: Home,
  },
  {
    id: "apartment",
    title: "Apartment / Site",
    icon: Building2,
  },
  {
    id: "commercial",
    title: "Commercial",
    icon: Store,
  },
  {
    id: "industrial",
    title: "Industrial",
    icon: Factory,
  },
];

const solutionOptions = [
  {
    id: "solar",
    title: "Solar Energy System",
    description: "Generate electricity using solar panels.",
    icon: Sun,
  },
  {
    id: "storage",
    title: "Solar Energy + Storage",
    description: "Generate solar energy and store it for later use.",
    icon: BatteryCharging,
  },
];

const initialRoofBox: RoofBox = {
  x: 34,
  y: 30,
  width: 28,
  height: 24,
};

export default function AssessmentPage() {
  const [step, setStep] = useState(1);

  const [buildingType, setBuildingType] = useState("");
  const [solution, setSolution] = useState("");

  const [address, setAddress] = useState("");

  const [electricityMode, setElectricityMode] =
    useState<"bill" | "kwh">("bill");

  const [electricityValue, setElectricityValue] = useState("");

  const [roofBox, setRoofBox] =
    useState<RoofBox>(initialRoofBox);

  const [dragState, setDragState] =
    useState<DragState>(null);

  const mapRef = useRef<HTMLDivElement | null>(null);

  function clamp(
    value: number,
    minimum: number,
    maximum: number,
  ) {
    return Math.min(
      Math.max(value, minimum),
      maximum,
    );
  }

  function startMove(
    event: PointerEvent<HTMLDivElement>,
  ) {
    if (!mapRef.current) return;

    mapRef.current.setPointerCapture(event.pointerId);

    setDragState({
      type: "move",
      startX: event.clientX,
      startY: event.clientY,
      box: roofBox,
    });
  }

  function startResize(
    event: PointerEvent<HTMLButtonElement>,
    corner: "tl" | "tr" | "bl" | "br",
  ) {
    event.stopPropagation();

    if (!mapRef.current) return;

    mapRef.current.setPointerCapture(event.pointerId);

    setDragState({
      type: "resize",
      corner,
      startX: event.clientX,
      startY: event.clientY,
      box: roofBox,
    });
  }

  function handlePointerMove(
    event: PointerEvent<HTMLDivElement>,
  ) {
    if (!dragState || !mapRef.current) return;

    const rect =
      mapRef.current.getBoundingClientRect();

    const deltaX =
      ((event.clientX - dragState.startX) /
        rect.width) *
      100;

    const deltaY =
      ((event.clientY - dragState.startY) /
        rect.height) *
      100;

    if (dragState.type === "move") {
      setRoofBox({
        ...dragState.box,

        x: clamp(
          dragState.box.x + deltaX,
          0,
          100 - dragState.box.width,
        ),

        y: clamp(
          dragState.box.y + deltaY,
          0,
          100 - dragState.box.height,
        ),
      });

      return;
    }

    const minWidth = 10;
    const minHeight = 10;

    const nextBox = { ...dragState.box };

    if (dragState.corner === "br") {
      nextBox.width = clamp(
        dragState.box.width + deltaX,
        minWidth,
        100 - dragState.box.x,
      );

      nextBox.height = clamp(
        dragState.box.height + deltaY,
        minHeight,
        100 - dragState.box.y,
      );
    }

    if (dragState.corner === "tr") {
      const bottom =
        dragState.box.y +
        dragState.box.height;

      const newY = clamp(
        dragState.box.y + deltaY,
        0,
        bottom - minHeight,
      );

      nextBox.y = newY;
      nextBox.height = bottom - newY;

      nextBox.width = clamp(
        dragState.box.width + deltaX,
        minWidth,
        100 - dragState.box.x,
      );
    }

    if (dragState.corner === "bl") {
      const right =
        dragState.box.x +
        dragState.box.width;

      const newX = clamp(
        dragState.box.x + deltaX,
        0,
        right - minWidth,
      );

      nextBox.x = newX;
      nextBox.width = right - newX;

      nextBox.height = clamp(
        dragState.box.height + deltaY,
        minHeight,
        100 - dragState.box.y,
      );
    }

    if (dragState.corner === "tl") {
      const right =
        dragState.box.x +
        dragState.box.width;

      const bottom =
        dragState.box.y +
        dragState.box.height;

      const newX = clamp(
        dragState.box.x + deltaX,
        0,
        right - minWidth,
      );

      const newY = clamp(
        dragState.box.y + deltaY,
        0,
        bottom - minHeight,
      );

      nextBox.x = newX;
      nextBox.y = newY;
      nextBox.width = right - newX;
      nextBox.height = bottom - newY;
    }

    setRoofBox(nextBox);
  }

  function stopDragging() {
    setDragState(null);
  }

  function resetRoof() {
    setRoofBox(initialRoofBox);
  }

  const roofArea = Math.max(
    1,
    Math.round(
      roofBox.width *
        roofBox.height *
        0.08,
    ),
  );

  function restartAssessment() {
    setStep(1);
    setBuildingType("");
    setSolution("");
    setAddress("");
    setElectricityMode("bill");
    setElectricityValue("");
    setRoofBox(initialRoofBox);
  }

  const selectedBuilding =
    buildingOptions.find(
      (option) => option.id === buildingType,
    )?.title ?? "";

  const selectedSolution =
    solutionOptions.find(
      (option) => option.id === solution,
    )?.title ?? "";

  return (
    <main className="min-h-screen bg-[#f4f4f6] text-black lg:h-screen lg:overflow-hidden">
      {/* HEADER */}

      <header className="h-14 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <Sun
              size={22}
              className="text-[#b10f3b]"
            />

            <span className="font-bold">
              SolarCheck
            </span>
          </div>

          <button
            type="button"
            className="flex items-center gap-2 text-sm text-gray-500"
          >
            Close
            <X size={16} />
          </button>
        </div>
      </header>

      {/* STEP 1 */}

      {step === 1 && (
        <AssessmentLayout>
          <SideVisual
            smallText="Solar Energy"
            title="Energy for every building"
          />

          <div className="flex h-full min-h-0 flex-col rounded-xl bg-white p-5">
            <StepHeader
              step={1}
              title="Where will the installation be?"
              description="Choose the building type where the solar system will be installed."
            />

            <div className="grid flex-1 content-center gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {buildingOptions.map((option) => {
                const Icon = option.icon;

                const selected =
                  buildingType === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() =>
                      setBuildingType(option.id)
                    }
                    className={`relative flex min-h-28 flex-col items-center justify-center gap-3 rounded-lg border bg-white p-3 text-center transition ${
                      selected
                        ? "border-[#b10f3b] bg-[#fff8fa]"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {selected && (
                      <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#b10f3b] text-white">
                        <Check size={12} />
                      </div>
                    )}

                    <Icon
                      size={24}
                      className={
                        selected
                          ? "text-[#b10f3b]"
                          : "text-gray-600"
                      }
                    />

                    <span className="text-sm font-medium">
                      {option.title}
                    </span>
                  </button>
                );
              })}
            </div>

            <Navigation
              showBack={false}
              continueDisabled={!buildingType}
              onContinue={() => setStep(2)}
            />
          </div>
        </AssessmentLayout>
      )}

      {/* STEP 2 */}

      {step === 2 && (
        <AssessmentLayout>
          <SideVisual
            smallText="Solar Energy"
            title="Energy for every need"
          />

          <div className="flex h-full min-h-0 flex-col rounded-xl bg-white p-5">
            <StepHeader
              step={2}
              title="Which solution do you need?"
              description="Choose the solar energy solution that fits your needs."
            />

            <div className="grid flex-1 content-center gap-4 md:grid-cols-2">
              {solutionOptions.map((option) => {
                const Icon = option.icon;

                const selected =
                  solution === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() =>
                      setSolution(option.id)
                    }
                    className={`relative rounded-lg border bg-white p-5 text-left transition ${
                      selected
                        ? "border-[#b10f3b] bg-[#fff8fa]"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {selected && (
                      <div className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-[#b10f3b] text-white">
                        <Check size={14} />
                      </div>
                    )}

                    <Icon
                      size={26}
                      className="text-[#b10f3b]"
                    />

                    <h2 className="mt-3 font-semibold">
                      {option.title}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>

            <Navigation
              onBack={() => setStep(1)}
              continueDisabled={!solution}
              onContinue={() => setStep(3)}
            />
          </div>
        </AssessmentLayout>
      )}

      {/* STEP 3 */}

      {step === 3 && (
        <div className="mx-auto grid h-[calc(100dvh-56px)] max-w-7xl lg:grid-cols-[1.65fr_0.85fr]">
          {/* MAP */}

          <div className="min-h-0 bg-[#55585c] p-3">
            <div
              ref={mapRef}
              onPointerMove={handlePointerMove}
              onPointerUp={stopDragging}
              onPointerCancel={stopDragging}
              className="relative h-full min-h-[430px] touch-none overflow-hidden rounded-xl bg-[#696c70]"
            >
              {/* MOCK MAP */}

              <div className="absolute left-[4%] top-0 h-full w-[17%] bg-[#4f5256]" />

              <div className="absolute left-[36%] top-[11%] h-[72%] w-[23%] rounded-sm bg-[#b7b9bb]" />

              <div className="absolute right-[7%] top-[6%] h-[25%] w-[25%] bg-[#505358]" />

              <div className="absolute bottom-[7%] right-[7%] grid h-[28%] w-[30%] grid-cols-4 gap-2 bg-[#5d6065] p-4">
                {Array.from({
                  length: 12,
                }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-sm bg-[#c5c7c9]"
                  />
                ))}
              </div>

              {/* ADDRESS SEARCH */}

              <div className="absolute left-3 right-3 top-3 z-30">
                <div className="flex gap-2">
                  <Input
                    value={address}
                    onChange={(event) =>
                      setAddress(
                        event.target.value,
                      )
                    }
                    placeholder="Search address..."
                    className="h-10 border-0 bg-white text-black shadow-md"
                  />

                  <Button
                    type="button"
                    className="h-10 bg-[#b10f3b] px-4 text-white hover:bg-[#8f0c30]"
                  >
                    <MapPin size={16} />
                  </Button>
                </div>
              </div>

              {/* ROOF SELECTION */}

              <div
                onPointerDown={startMove}
                className="absolute z-20 cursor-move border-2 border-[#b10f3b] bg-[#b10f3b]/25 shadow-lg"
                style={{
                  left: `${roofBox.x}%`,
                  top: `${roofBox.y}%`,
                  width: `${roofBox.width}%`,
                  height: `${roofBox.height}%`,
                }}
              >
                <div className="pointer-events-none flex h-full items-center justify-center">
                  <div className="rounded-md bg-white/95 px-2 py-1 text-center shadow">
                    <p className="text-[11px] text-gray-500">
                      Selected area
                    </p>

                    <p className="text-sm font-semibold text-[#b10f3b]">
                      {roofArea} m²
                    </p>
                  </div>
                </div>

                <ResizeHandle
                  position="tl"
                  onPointerDown={startResize}
                />

                <ResizeHandle
                  position="tr"
                  onPointerDown={startResize}
                />

                <ResizeHandle
                  position="bl"
                  onPointerDown={startResize}
                />

                <ResizeHandle
                  position="br"
                  onPointerDown={startResize}
                />
              </div>
            </div>
          </div>

          {/* RIGHT PANEL */}

          <div className="flex min-h-0 flex-col bg-white p-5">
            <StepHeader
              step={3}
              title="Find your roof"
              description="Move and resize the selection over your roof."
            />

            <div className="rounded-lg bg-[#faeef2] p-4">
              <p className="text-xs text-gray-500">
                Selected area
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {roofArea} m²
              </p>
            </div>

            <div className="mt-4 text-sm leading-6 text-gray-500">
              <p>
                Drag the box to position it.
              </p>

              <p>
                Drag a corner to adjust the roof size.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={resetRoof}
              className="mt-4 w-fit gap-2"
            >
              <RotateCcw size={14} />
              Reset
            </Button>

            <Navigation
              onBack={() => setStep(2)}
              onContinue={() => setStep(4)}
            />
          </div>
        </div>
      )}

      {/* STEP 4 */}

      {step === 4 && (
        <AssessmentLayout>
          <SideVisual
            smallText="Electricity"
            title="Your energy consumption"
          />

          <div className="flex h-full min-h-0 flex-col rounded-xl bg-white p-5">
            <StepHeader
              step={4}
              title="Your electricity consumption"
              description="Enter your average electricity consumption."
            />

            <div className="flex flex-1 flex-col justify-center">
              <div className="flex w-fit rounded-full bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() =>
                    setElectricityMode("bill")
                  }
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    electricityMode === "bill"
                      ? "bg-[#b10f3b] text-white"
                      : "text-gray-600"
                  }`}
                >
                  Monthly Bill
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setElectricityMode("kwh")
                  }
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    electricityMode === "kwh"
                      ? "bg-[#b10f3b] text-white"
                      : "text-gray-600"
                  }`}
                >
                  Monthly kWh
                </button>
              </div>

              <div className="mt-6">
                <label
                  htmlFor="electricity"
                  className="text-sm font-medium"
                >
                  {electricityMode === "bill"
                    ? "Average monthly electricity bill"
                    : "Average monthly electricity usage"}
                </label>

                <div className="relative mt-2 max-w-lg">
                  <Input
                    id="electricity"
                    type="number"
                    min="1"
                    value={electricityValue}
                    onChange={(event) =>
                      setElectricityValue(
                        event.target.value,
                      )
                    }
                    placeholder="0"
                    className="h-11 pr-20"
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                    {electricityMode === "bill"
                      ? "₺"
                      : "kWh"}
                  </span>
                </div>
              </div>
            </div>

            <Navigation
              onBack={() => setStep(3)}
              continueDisabled={
                Number(electricityValue) <= 0
              }
              onContinue={() => setStep(5)}
            />
          </div>
        </AssessmentLayout>
      )}

      {/* STEP 5 */}

      {step === 5 && (
        <div className="mx-auto flex h-[calc(100dvh-56px)] max-w-7xl flex-col px-5 py-3">
          {/* PAGE TOP */}

          <div className="shrink-0">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold text-[#b10f3b]">
                  Step 5 / 5
                </p>

                <h1 className="mt-1 text-2xl font-bold">
                  Preliminary feasibility report
                </h1>
              </div>

              <span className="text-xs text-gray-400">
                Report
              </span>
            </div>

            <Progress
              value={100}
              className="mt-2"
            />
          </div>

          {/* REPORT */}

          <Card className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border-gray-200 bg-white shadow-sm">
            <div className="h-1 shrink-0 bg-[#b10f3b]" />

            {/* REPORT HEADER */}

            <CardHeader className="shrink-0 border-b border-gray-200 px-5 py-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Sun
                      size={17}
                      className="text-[#b10f3b]"
                    />

                    <span className="text-sm font-bold">
                      SolarCheck
                    </span>
                  </div>

                  <CardTitle className="mt-1 text-base">
                    Solar Energy Preliminary Feasibility Report
                  </CardTitle>
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <FileText size={14} />
                  Preliminary
                </div>
              </div>
            </CardHeader>

            {/* REPORT CONTENT */}

            <CardContent className="p-4">
              {/* MAIN RESULTS */}

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <ResultCard
                  icon={Gauge}
                  label="Installed Capacity"
                  value="354.7"
                  unit="kWp"
                />

                <ResultCard
                  icon={Zap}
                  label="Annual Production"
                  value="526,133"
                  unit="kWh"
                />

                <ResultCard
                  icon={TrendingUp}
                  label="Annual Savings"
                  value="₺944,244"
                  unit="/ year"
                />

                <ResultCard
                  icon={Clock3}
                  label="Payback"
                  value="8.7"
                  unit="years"
                />
              </div>

              {/* PROJECT DETAILS */}

              <div className="mt-3">
                <h2 className="text-sm font-semibold">
                  Project Details
                </h2>

                <div className="mt-2 grid grid-cols-2 gap-x-8 gap-y-2 lg:grid-cols-3">
                  <ReportRow
                    label="Building"
                    value={selectedBuilding}
                  />

                  <ReportRow
                    label="Solution"
                    value={selectedSolution}
                  />

                  <ReportRow
                    label="Roof Area"
                    value={`${roofArea} m²`}
                  />

                  <ReportRow
                    label="Electricity"
                    value={
                      electricityMode === "bill"
                        ? `₺${electricityValue} / month`
                        : `${electricityValue} kWh / month`
                    }
                  />

                  <ReportRow
                    label="Location"
                    value={
                      address ||
                      "Selected on map"
                    }
                  />

                  <ReportRow
                    label="Status"
                    value="Completed"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* BOTTOM BUTTONS */}

          <div className="mt-2 flex shrink-0 justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(4)}
              className="h-8 gap-1 px-3"
            >
              <ArrowLeft size={14} />
              Back
            </Button>

            <Button
              type="button"
              onClick={restartAssessment}
              className="h-8 gap-1 rounded-full bg-[#b10f3b] px-4 text-white hover:bg-[#8f0c30]"
            >
              <RotateCcw size={14} />
              Start Again
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}

/* REUSABLE COMPONENTS */

function AssessmentLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="mx-auto grid h-[calc(100dvh-56px)] max-w-7xl gap-3 p-3 lg:grid-cols-[0.7fr_1.5fr]">
      {children}
    </div>
  );
}

function SideVisual({
  smallText,
  title,
}: {
  smallText: string;
  title: string;
}) {
  return (
    <div className="relative hidden h-full min-h-0 overflow-hidden rounded-xl bg-[#183648] lg:block">
      <div className="absolute inset-x-0 top-0 h-[34%] bg-sky-300" />

      <div
        className="absolute bottom-0 left-0 right-0 top-[34%] opacity-70"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, #244e62 0px, #244e62 5px, #183648 5px, #183648 12px)",
        }}
      />

      <div className="absolute bottom-5 left-5 z-10 text-white">
        <p className="text-xs opacity-70">
          {smallText}
        </p>

        <h2 className="mt-1 text-xl font-semibold">
          {title}
        </h2>
      </div>
    </div>
  );
}

function StepHeader({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <div className="shrink-0">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#b10f3b]">
          Step {step} / 5
        </span>

        <span className="text-xs text-gray-400">
          Solar Assessment
        </span>
      </div>

      <Progress
        value={step * 20}
        className="mt-2"
      />

      <h1 className="mt-4 text-2xl font-bold">
        {title}
      </h1>

      <p className="mt-1 text-sm text-gray-500">
        {description}
      </p>
    </div>
  );
}

function Navigation({
  showBack = true,
  onBack,
  onContinue,
  continueDisabled = false,
}: {
  showBack?: boolean;
  onBack?: () => void;
  onContinue: () => void;
  continueDisabled?: boolean;
}) {
  return (
    <div className="mt-4 flex shrink-0 items-center justify-between border-t border-gray-200 pt-3">
      {showBack ? (
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="h-9 gap-1"
        >
          <ArrowLeft size={15} />
          Back
        </Button>
      ) : (
        <div />
      )}

      <Button
        type="button"
        onClick={onContinue}
        disabled={continueDisabled}
        className="h-9 gap-1 rounded-full bg-[#b10f3b] px-5 text-white hover:bg-[#8f0c30]"
      >
        Continue
        <ArrowRight size={15} />
      </Button>
    </div>
  );
}

function ResizeHandle({
  position,
  onPointerDown,
}: {
  position: "tl" | "tr" | "bl" | "br";
  onPointerDown: (
    event: PointerEvent<HTMLButtonElement>,
    corner: "tl" | "tr" | "bl" | "br",
  ) => void;
}) {
  const positionClasses = {
    tl: "-left-2 -top-2 cursor-nwse-resize",
    tr: "-right-2 -top-2 cursor-nesw-resize",
    bl: "-bottom-2 -left-2 cursor-nesw-resize",
    br: "-bottom-2 -right-2 cursor-nwse-resize",
  };

  return (
    <button
      type="button"
      aria-label={`Resize ${position}`}
      onPointerDown={(event) =>
        onPointerDown(event, position)
      }
      className={`absolute h-4 w-4 rounded-full border-2 border-white bg-[#b10f3b] shadow ${positionClasses[position]}`}
    />
  );
}

function ReportRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border-b border-gray-200 pb-1.5">
      <p className="text-[9px] uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-0.5 truncate text-xs font-medium">
        {value}
      </p>
    </div>
  );
}

function ResultCard({
  icon: Icon,
  label,
  value,
  unit,
}: {
  icon: ElementType;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#faeef2] text-[#b10f3b]">
          <Icon size={14} />
        </div>

        <p className="text-xs text-gray-500">
          {label}
        </p>
      </div>

      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-xl font-bold">
          {value}
        </span>

        <span className="text-[10px] text-gray-500">
          {unit}
        </span>
      </div>
    </div>
  );
}