import React, { useMemo, useState } from "react";

const BASE = {
  fixedCost: 120,
  variableCost: 8,
  marketShare: 50,
  economies: 40,
};

const SCENARIOS = [
  {
    id: "fixedCost",
    button: "Fixed Cost",
    title: "Fixed Cost Changes",
    description: "Only the AC curve changes. MC, AR and MR remain unchanged.",
    min: 50,
    max: 300,
    step: 1,
    unit: "$",
    defaultAfter: 220,
    changedCurves: ["ac"],
    curveText: "AC₁ → AC₂",
    examples: ["Higher rent", "Purchase of new machinery"],
  },
  {
    id: "variableCost",
    button: "Variable Cost",
    title: "Variable Cost Changes",
    description: "The AC and MC curves change together. AR and MR remain unchanged.",
    min: 2,
    max: 20,
    step: 0.1,
    unit: "$",
    defaultAfter: 14,
    changedCurves: ["ac", "mc"],
    curveText: "AC₁ → AC₂ and MC₁ → MC₂",
    examples: ["Higher wages", "Higher raw-material prices"],
  },
  {
    id: "marketShare",
    button: "Market Share",
    title: "Market Share Changes",
    description: "The AR and MR curves change together. AC and MC remain unchanged.",
    min: 10,
    max: 90,
    step: 1,
    unit: "%",
    defaultAfter: 75,
    changedCurves: ["ar", "mr"],
    curveText: "AR₁ → AR₂ and MR₁ → MR₂",
    examples: ["More effective advertising", "Improved product quality"],
  },
  {
    id: "economies",
    button: "Economies of Scale",
    title: "Economies of Scale",
    description: "The AC and MC curves shift rightward and downward.",
    min: 0,
    max: 80,
    step: 1,
    unit: "%",
    defaultAfter: 70,
    changedCurves: ["ac", "mc"],
    curveText: "AC₁ → AC₂ and MC₁ → MC₂",
    examples: ["Bulk-buying discounts", "Greater specialisation"],
  },
];

function buildGraph(values) {
  const { fixedCost, variableCost, marketShare, economies } = values;

  const demandShift = marketShare * 0.5;
  const arIntercept = 68 + demandShift;
  const mrIntercept = arIntercept;
  const eosRight = economies * 0.28;
  const eosDown = economies * 0.22;

  const baseCentre = 48 + eosRight;
  const baseMinCost = 18 + variableCost * 1.25 - eosDown;
  const fixedCostGap = fixedCost - 120;

  const acMinQ = Math.max(12, Math.min(92, baseCentre + fixedCostGap * 0.13));

  const mcAt = (q) =>
    baseMinCost + 18 * (Math.exp(0.035 * (q - baseCentre)) - 1);

  const minAC = mcAt(acMinQ);
  const acAt = (q) => minAC + Math.pow(q - acMinQ, 2) / 70;
  const arAt = (q) => Math.max(0, arIntercept - q * 0.82);
  const mrAt = (q) => mrIntercept - q * 1.64;

  let q = 1;
  let smallestGap = Infinity;

  for (let i = 1; i <= 95; i += 0.25) {
    const gap = Math.abs(mcAt(i) - mrAt(i));
    if (gap < smallestGap) {
      smallestGap = gap;
      q = i;
    }
  }

  const acAtQ = acAt(q);
  const mcAtQ = mcAt(q);
  const arAtQ = arAt(q);
  const mrAtQ = mrAt(q);

  return {
    q,
    acMinQ,
    minAC,
    acAt,
    mcAt,
    arAt,
    mrAt,
    acAtQ,
    mcAtQ,
    arAtQ,
    mrAtQ,
    profitPerUnit: arAtQ - acAtQ,
    totalProfit: (arAtQ - acAtQ) * q,
  };
}

export default function App() {
  const [selectedId, setSelectedId] = useState("fixedCost");
  const [scenarioValues, setScenarioValues] = useState(() =>
    Object.fromEntries(SCENARIOS.map((item) => [item.id, item.defaultAfter]))
  );

  const selected = SCENARIOS.find((item) => item.id === selectedId);
  const afterValues = { ...BASE, [selected.id]: scenarioValues[selected.id] };

  const beforeGraph = useMemo(() => buildGraph(BASE), []);
  const afterGraph = useMemo(
    () => buildGraph(afterValues),
    [selected.id, scenarioValues[selected.id]]
  );

  const formatValue = (scenario, value) => {
    if (scenario.unit === "$") {
      return `$${Number(value).toFixed(scenario.step < 1 ? 1 : 0)}`;
    }
    return `${Number(value).toFixed(0)}%`;
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <p className="eyebrow">H2 Economics • Firms and Decisions</p>
        <h1>Combined Before-and-After Scenarios</h1>
        <p className="hero-copy">
          Select a scenario. The original and changed curves are shown together on one diagram.
        </p>
      </header>

      <nav className="scenario-tabs">
        {SCENARIOS.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={item.id === selectedId ? "scenario-button active" : "scenario-button"}
            onClick={() => setSelectedId(item.id)}
          >
            {index + 1}. {item.button}
          </button>
        ))}
      </nav>

      <main className="scenario-panel">
        <div className="scenario-heading">
          <div>
            <p className="eyebrow">Selected scenario</p>
            <h2>{selected.title}</h2>
            <p>{selected.description}</p>
          </div>
          <div className="change-rule">{selected.curveText}</div>
        </div>

        <div className="combined-layout">
          <section className="graph-card">
            <div className="graph-header">
              <div>
                <h3>Combined diagram</h3>
                <p>Dashed curves show the original position. Solid curves show the new position.</p>
              </div>
              <div className="legend">
                <span><i className="legend-line original" /> Original</span>
                <span><i className="legend-line changed" /> Changed</span>
              </div>
            </div>

            <CombinedDiagram
              before={beforeGraph}
              after={afterGraph}
              changedCurves={selected.changedCurves}
            />
          </section>

          <aside className="summary-card">
            <h3>Before and after</h3>

            <div className="summary-block">
              <span className="summary-label">Original value</span>
              <strong>{formatValue(selected, BASE[selected.id])}</strong>
            </div>

            <div className="summary-arrow">↓</div>

            <div className="summary-block changed-block">
              <span className="summary-label">Changed value</span>
              <strong>{formatValue(selected, scenarioValues[selected.id])}</strong>
            </div>

            <div className="outcomes">
              <OutcomeRow
                label="Output"
                before={`Q₁ = ${beforeGraph.q.toFixed(1)}`}
                after={`Q₂ = ${afterGraph.q.toFixed(1)}`}
              />
              <OutcomeRow
                label="Price"
                before={`$${beforeGraph.arAtQ.toFixed(1)}`}
                after={`$${afterGraph.arAtQ.toFixed(1)}`}
              />
              <OutcomeRow
                label="Average cost"
                before={`$${beforeGraph.acAtQ.toFixed(1)}`}
                after={`$${afterGraph.acAtQ.toFixed(1)}`}
              />
              <OutcomeRow
                label="Profit per unit"
                before={`$${beforeGraph.profitPerUnit.toFixed(1)}`}
                after={`$${afterGraph.profitPerUnit.toFixed(1)}`}
              />
            </div>
          </aside>
        </div>

        <section className="control-panel">
          <div className="control-topline">
            <div>
              <p className="control-label">{selected.title}</p>
              <p className="control-note">{selected.description}</p>
            </div>
            <div className="value-badge">
              {formatValue(selected, scenarioValues[selected.id])}
            </div>
          </div>

          <input
            type="range"
            min={selected.min}
            max={selected.max}
            step={selected.step}
            value={scenarioValues[selected.id]}
            onChange={(event) =>
              setScenarioValues((current) => ({
                ...current,
                [selected.id]: Number(event.target.value),
              }))
            }
          />

          <div className="range-labels">
            <span>{formatValue(selected, selected.min)}</span>
            <span>Original: {formatValue(selected, BASE[selected.id])}</span>
            <span>{formatValue(selected, selected.max)}</span>
          </div>

          <div className="control-footer">
            <span><strong>Possible causes:</strong> {selected.examples.join(" • ")}</span>
            <button
              type="button"
              className="reset-button"
              onClick={() =>
                setScenarioValues((current) => ({
                  ...current,
                  [selected.id]: selected.defaultAfter,
                }))
              }
            >
              Reset scenario
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

function OutcomeRow({ label, before, after }) {
  return (
    <div className="outcome-row">
      <span>{label}</span>
      <div>
        <small>Before</small>
        <strong>{before}</strong>
      </div>
      <div>
        <small>After</small>
        <strong>{after}</strong>
      </div>
    </div>
  );
}

function CombinedDiagram({ before, after, changedCurves }) {
  const W = 900;
  const H = 560;
  const L = 95;
  const T = 35;
  const B = 65;
  const plotW = W - L - 40;
  const plotH = H - T - B;

  const x = (q) => L + (q / 100) * plotW;
  const y = (p) => T + (1 - p / 100) * plotH;

  const points = (graph) =>
    Array.from({ length: 101 }, (_, q) => ({
      q,
      ac: graph.acAt(q),
      mc: graph.mcAt(q),
      ar: graph.arAt(q),
      mr: Math.max(0, graph.mrAt(q)),
    }));

  const beforePoints = points(before);
  const afterPoints = points(after);

  const makePath = (pts, key) =>
    pts
      .map((point, index) => `${index === 0 ? "M" : "L"}${x(point.q)},${y(point[key])}`)
      .join(" ");

  const keys = ["ar", "mr", "ac", "mc"];
  const labels = { ar: "AR", mr: "MR", ac: "AC", mc: "MC" };

  const beforeQX = x(before.q);
  const afterQX = x(after.q);
  const beforePY = y(before.arAtQ);
  const afterPY = y(after.arAtQ);

  const labelPosition = (key, graph, version) => {
    const qMap = { mc: 88, ac: 90, ar: 91, mr: 55 };
    const q = qMap[key];
    const fn = graph[`${key}At`];
    const value = key === "mr" ? Math.max(0, fn(q)) : fn(q);
    const offsetY = key === "ar" ? 18 : key === "mr" ? 28 : -8;
    const offsetX = version === 1 ? -10 : 8;
    return { x: x(q) + offsetX, y: y(value) + offsetY };
  };

  return (
    <div className="diagram-wrap">
      <svg viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <marker id="axis-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
            <path d="M0,0 L0,6 L9,3 z" fill="black" />
          </marker>
        </defs>

        <line x1={L} y1={H - B} x2={W - 18} y2={H - B} stroke="black" strokeWidth="3" markerEnd="url(#axis-arrow)" />
        <line x1={L} y1={H - B} x2={L} y2={15} stroke="black" strokeWidth="3" markerEnd="url(#axis-arrow)" />

        <text x={W - 30} y={H - 25} fontSize="28" fontStyle="italic">Q</text>
        <text x={18} y={35} fontSize="16" fontWeight="600">Price /</text>
        <text x={18} y={56} fontSize="16" fontWeight="600">Cost /</text>
        <text x={18} y={77} fontSize="16" fontWeight="600">Revenue</text>
        <text x={L + 8} y={H - B + 26} fontSize="18">0</text>

        {keys.map((key) => {
          const changes = changedCurves.includes(key);

          if (!changes) {
            return (
              <path
                key={key}
                d={makePath(beforePoints, key)}
                fill="none"
                stroke="black"
                strokeWidth="2.8"
              />
            );
          }

          return (
            <g key={key}>
              <path
                d={makePath(beforePoints, key)}
                fill="none"
                stroke="#64748b"
                strokeWidth="2.4"
                strokeDasharray="9 7"
              />
              <path
                d={makePath(afterPoints, key)}
                fill="none"
                stroke="black"
                strokeWidth="3"
              />
            </g>
          );
        })}

        <line x1={beforeQX} y1={H - B} x2={beforeQX} y2={beforePY} stroke="#64748b" strokeDasharray="7 6" strokeWidth="1.6" />
        <line x1={L} y1={beforePY} x2={beforeQX} y2={beforePY} stroke="#64748b" strokeDasharray="7 6" strokeWidth="1.6" />
        <circle cx={beforeQX} cy={beforePY} r="5" fill="white" stroke="#64748b" strokeWidth="2.5" />

        <line x1={afterQX} y1={H - B} x2={afterQX} y2={afterPY} stroke="black" strokeDasharray="5 4" strokeWidth="1.6" />
        <line x1={L} y1={afterPY} x2={afterQX} y2={afterPY} stroke="black" strokeDasharray="5 4" strokeWidth="1.6" />
        <circle cx={afterQX} cy={afterPY} r="5.5" fill="black" />

        <text x={beforeQX - 12} y={H - B + 28} fontSize="17" fill="#64748b">Q₁</text>
        <text x={afterQX - 12} y={H - B + 48} fontSize="17">Q₂</text>
        <text x={L - 34} y={beforePY + 5} fontSize="17" fill="#64748b">P₁</text>
        <text x={L - 34} y={afterPY + 5} fontSize="17">P₂</text>

        {keys.map((key) => {
          const changes = changedCurves.includes(key);
          const beforePos = labelPosition(key, before, 1);
          const afterPos = labelPosition(key, after, 2);

          if (!changes) {
            return (
              <text
                key={key}
                x={afterPos.x}
                y={afterPos.y}
                fontSize="25"
                fontStyle="italic"
              >
                {labels[key]}
              </text>
            );
          }

          return (
            <g key={key}>
              <text
                x={beforePos.x}
                y={beforePos.y}
                fontSize="23"
                fontStyle="italic"
                fill="#64748b"
              >
                {labels[key]}₁
              </text>
              <text
                x={afterPos.x}
                y={afterPos.y}
                fontSize="25"
                fontStyle="italic"
              >
                {labels[key]}₂
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
