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
    button: "1. Fixed Cost",
    title: "Fixed Cost Changes",
    description: "Compare the original diagram with a change in fixed cost.",
    note: "Only AC changes. MC remains unchanged.",
    min: 50,
    max: 300,
    step: 1,
    unit: "$",
    defaultAfter: 220,
    examples: ["Higher rent", "Purchase of new machinery"],
  },
  {
    id: "variableCost",
    button: "2. Variable Cost",
    title: "Variable Cost Changes",
    description: "Compare the original diagram with a change in variable cost per unit.",
    note: "Both AC and MC shift.",
    min: 2,
    max: 20,
    step: 0.1,
    unit: "$",
    defaultAfter: 14,
    examples: ["Higher wages", "Higher raw-material prices"],
  },
  {
    id: "marketShare",
    button: "3. Market Share",
    title: "Market Share Changes",
    description: "Compare the original diagram with a change in the firm's market share.",
    note: "AR and MR shift together.",
    min: 10,
    max: 90,
    step: 1,
    unit: "%",
    defaultAfter: 75,
    examples: ["More effective advertising", "Improved product quality"],
  },
  {
    id: "economies",
    button: "4. Economies of Scale",
    title: "Economies of Scale",
    description: "Compare the original diagram with a change in economies of scale.",
    note: "AC and MC shift rightward and downward.",
    min: 0,
    max: 80,
    step: 1,
    unit: "%",
    defaultAfter: 70,
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
    Object.fromEntries(SCENARIOS.map((scenario) => [scenario.id, scenario.defaultAfter]))
  );

  const selected = SCENARIOS.find((scenario) => scenario.id === selectedId);
  const beforeValues = BASE;
  const afterValues = {
    ...BASE,
    [selected.id]: scenarioValues[selected.id],
  };

  const beforeGraph = useMemo(() => buildGraph(beforeValues), []);
  const afterGraph = useMemo(
    () => buildGraph(afterValues),
    [selected.id, scenarioValues[selected.id]]
  );

  const formatValue = (scenario, value) => {
    if (scenario.unit === "$") {
      const digits = scenario.step < 1 ? 1 : 0;
      return `$${Number(value).toFixed(digits)}`;
    }
    return `${Number(value).toFixed(0)}%`;
  };

  const resetScenario = () => {
    setScenarioValues((current) => ({
      ...current,
      [selected.id]: selected.defaultAfter,
    }));
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <p className="eyebrow">H2 Economics • Firms and Decisions</p>
        <h1>Before-and-After Cost and Revenue Scenarios</h1>
        <p className="hero-copy">
          Select one scenario. The left diagram always shows the original position,
          while the right diagram shows the effect of changing one slider only.
        </p>
      </header>

      <nav className="scenario-tabs" aria-label="Scenario selection">
        {SCENARIOS.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            className={scenario.id === selectedId ? "scenario-button active" : "scenario-button"}
            onClick={() => setSelectedId(scenario.id)}
          >
            {scenario.button}
          </button>
        ))}
      </nav>

      <section className="scenario-panel">
        <div className="scenario-heading">
          <div>
            <p className="eyebrow">Selected scenario</p>
            <h2>{selected.title}</h2>
            <p>{selected.description}</p>
          </div>
          <div className="change-rule">{selected.note}</div>
        </div>

        <div className="comparison-grid">
          <DiagramCard
            label="Before"
            subtitle="Original position"
            graph={beforeGraph}
            values={beforeValues}
            highlighted={selected.id}
          />
          <DiagramCard
            label="After"
            subtitle={`Only ${selected.title.toLowerCase()} changes`}
            graph={afterGraph}
            values={afterValues}
            highlighted={selected.id}
          />
        </div>

        <div className="control-panel">
          <div className="control-topline">
            <div>
              <p className="control-label">{selected.title}</p>
              <p className="control-note">{selected.note}</p>
            </div>
            <div className="value-badge">
              {formatValue(selected, scenarioValues[selected.id])}
            </div>
          </div>

          <input
            aria-label={selected.title}
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
            <div>
              <strong>Possible causes:</strong> {selected.examples.join(" • ")}
            </div>
            <button type="button" className="reset-button" onClick={resetScenario}>
              Reset scenario
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function DiagramCard({ label, subtitle, graph, values, highlighted }) {
  const outcome = graph.totalProfit >= 0 ? "Supernormal profit" : "Subnormal profit / loss";

  return (
    <article className="diagram-card">
      <div className="diagram-card-header">
        <div>
          <span className={`status-pill ${label === "Before" ? "before" : "after"}`}>
            {label}
          </span>
          <h3>{subtitle}</h3>
        </div>
        <span className={graph.totalProfit >= 0 ? "profit-pill positive" : "profit-pill negative"}>
          {outcome}
        </span>
      </div>

      <MonopolyDiagram graph={graph} />

      <div className="metrics-grid">
        <Metric label="Output" value={`Q* = ${graph.q.toFixed(1)}`} />
        <Metric label="Price" value={`$${graph.arAtQ.toFixed(1)}`} />
        <Metric label="Average cost" value={`$${graph.acAtQ.toFixed(1)}`} />
        <Metric label="Profit per unit" value={`$${graph.profitPerUnit.toFixed(1)}`} />
      </div>

      <div className="settings-strip">
        <Setting label="Fixed cost" value={`$${values.fixedCost}`} active={highlighted === "fixedCost"} />
        <Setting label="Variable cost" value={`$${values.variableCost}`} active={highlighted === "variableCost"} />
        <Setting label="Market share" value={`${values.marketShare}%`} active={highlighted === "marketShare"} />
        <Setting label="Economies" value={`${values.economies}%`} active={highlighted === "economies"} />
      </div>
    </article>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Setting({ label, value, active }) {
  return (
    <div className={active ? "setting active" : "setting"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MonopolyDiagram({ graph }) {
  const W = 760;
  const H = 480;
  const L = 90;
  const T = 25;
  const B = 55;
  const plotW = W - L - 35;
  const plotH = H - T - B;
  const x = (q) => L + (q / 100) * plotW;
  const y = (p) => T + (1 - p / 100) * plotH;

  const pts = Array.from({ length: 101 }, (_, q) => ({
    q,
    ac: graph.acAt(q),
    mc: graph.mcAt(q),
    ar: graph.arAt(q),
    mr: Math.max(0, graph.mrAt(q)),
  }));

  const makePath = (key) =>
    pts
      .map((point, index) => `${index === 0 ? "M" : "L"}${x(point.q)},${y(point[key])}`)
      .join(" ");

  const qx = x(graph.q);
  const priceY = y(graph.arAtQ);
  const acY = y(graph.acAtQ);
  const mcY = y(graph.mcAtQ);
  const mrY = y(Math.max(0, graph.mrAtQ));
  const acMinX = x(graph.acMinQ);
  const acMinY = y(graph.minAC);

  return (
    <div className="diagram-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Firm cost and revenue diagram">
        <defs>
          <marker
            id="axis-arrow"
            markerWidth="10"
            markerHeight="10"
            refX="8"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="black" />
          </marker>
        </defs>

        <line x1={L} y1={H - B} x2={W - 20} y2={H - B} stroke="black" strokeWidth="3" markerEnd="url(#axis-arrow)" />
        <line x1={L} y1={H - B} x2={L} y2={10} stroke="black" strokeWidth="3" markerEnd="url(#axis-arrow)" />

        <text x={W - 25} y={H - 22} fontSize="28" fontStyle="italic">Q</text>
        <text x={18} y={30} fontSize="16" fontWeight="600">Price /</text>
        <text x={18} y={50} fontSize="16" fontWeight="600">Cost /</text>
        <text x={18} y={70} fontSize="16" fontWeight="600">Revenue</text>
        <text x={L + 8} y={H - B + 25} fontSize="18">0</text>

        <path d={makePath("ar")} fill="none" stroke="black" strokeWidth="2.5" />
        <path d={makePath("mr")} fill="none" stroke="black" strokeWidth="2.5" />
        <path d={makePath("ac")} fill="none" stroke="black" strokeWidth="2.5" />
        <path d={makePath("mc")} fill="none" stroke="black" strokeWidth="2.5" />

        {graph.profitPerUnit > 0 ? (
          <rect
            x={L}
            y={priceY}
            width={Math.max(0, qx - L)}
            height={Math.max(0, acY - priceY)}
            fill="rgba(34,197,94,0.18)"
            stroke="rgba(34,197,94,0.55)"
          />
        ) : (
          <rect
            x={L}
            y={acY}
            width={Math.max(0, qx - L)}
            height={Math.max(0, priceY - acY)}
            fill="rgba(244,63,94,0.15)"
            stroke="rgba(244,63,94,0.55)"
          />
        )}

        <line x1={qx} y1={H - B} x2={qx} y2={priceY} stroke="black" strokeDasharray="5 4" strokeWidth="1.5" />
        <line x1={L} y1={priceY} x2={qx} y2={priceY} stroke="black" strokeDasharray="5 4" strokeWidth="1.5" />
        <line x1={L} y1={acY} x2={qx} y2={acY} stroke="black" strokeDasharray="5 4" strokeWidth="1.5" />
        <line x1={acMinX} y1={H - B} x2={acMinX} y2={acMinY} stroke="black" strokeDasharray="3 4" strokeWidth="1" opacity="0.6" />

        <circle cx={qx} cy={priceY} r="5" fill="black" />
        <circle cx={qx} cy={acY} r="5" fill="black" />
        <circle cx={qx} cy={mrY} r="5" fill="black" />
        <circle cx={qx} cy={mcY} r="5" fill="black" />
        <circle cx={acMinX} cy={acMinY} r="6" fill="white" stroke="black" strokeWidth="2.5" />

        <text x={x(88)} y={y(graph.mcAt(88)) - 8} fontSize="28" fontStyle="italic">MC</text>
        <text x={x(90)} y={y(graph.acAt(90)) - 8} fontSize="28" fontStyle="italic">AC</text>
        <text x={x(92)} y={y(graph.arAt(92)) + 18} fontSize="28" fontStyle="italic">AR</text>
        <text x={x(55)} y={y(Math.max(0, graph.mrAt(55))) + 28} fontSize="28" fontStyle="italic">MR</text>
        <text x={qx - 8} y={H - B + 28} fontSize="18">Q*</text>
        <text x={L - 32} y={priceY + 5} fontSize="18">P</text>
        <text x={L - 34} y={acY + 5} fontSize="18">AC</text>
      </svg>
    </div>
  );
}
