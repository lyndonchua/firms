import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { RotateCcw } from 'lucide-react';
import './styles.css';

const scenarios = [
  {
    id: 'fixedCost',
    short: 'Fixed Cost',
    title: 'Change in Fixed Cost',
    min: -40,
    max: 40,
    step: 5,
    unit: '%',
    explanation: 'A change in fixed cost changes AC only. MC remains unchanged, and the new AC minimum remains on the MC curve.',
  },
  {
    id: 'variableCost',
    short: 'Variable Cost',
    title: 'Change in Variable Cost per Unit',
    min: -40,
    max: 40,
    step: 5,
    unit: '%',
    explanation: 'A change in variable cost shifts both AC and MC. Their relationship is preserved, with MC cutting AC at its minimum point.',
  },
  {
    id: 'marketShare',
    short: 'Market Share',
    title: 'Change in Market Share',
    min: -40,
    max: 40,
    step: 5,
    unit: '%',
    explanation: 'A larger market share shifts AR and MR outward. Cost curves remain unchanged.',
  },
  {
    id: 'economies',
    short: 'Economies of Scale',
    title: 'Change in Economies of Scale',
    min: -40,
    max: 40,
    step: 5,
    unit: '%',
    explanation: 'Stronger economies of scale lower unit costs over a wider output range, moving the efficient scale to the right.',
  },
];

const W = 520;
const H = 360;
const plot = { left: 58, right: 492, top: 24, bottom: 316 };
const qMax = 100;
const cMax = 120;

const sx = q => plot.left + (q / qMax) * (plot.right - plot.left);
const sy = c => plot.bottom - (c / cMax) * (plot.bottom - plot.top);

function pathFrom(fn, start = 6, end = 96, steps = 90) {
  let d = '';
  for (let i = 0; i <= steps; i += 1) {
    const q = start + ((end - start) * i) / steps;
    const value = Math.max(0, Math.min(cMax, fn(q)));
    d += `${i === 0 ? 'M' : 'L'} ${sx(q).toFixed(1)} ${sy(value).toFixed(1)} `;
  }
  return d;
}

function modelFor(kind, amount) {
  const t = amount / 40;
  const baseMC = q => 18 + 0.72 * q;
  const baselineQ = 46;
  const makeAC = (qMin, curvature, mcFn) => {
    const minCost = mcFn(qMin);
    return q => minCost + curvature * Math.pow(q - qMin, 2);
  };

  let mc = baseMC;
  let ac = makeAC(baselineQ, 0.025, mc);
  let ar = q => 104 - 0.60 * q;
  let mr = q => 104 - 1.20 * q;
  let note = '';

  if (kind === 'fixedCost') {
    // MC is fixed. The AC vertex moves along the unchanged MC curve.
    const qMin = baselineQ + 13 * t;
    ac = makeAC(qMin, 0.025 + 0.004 * Math.abs(t), mc);
    note = t > 0 ? 'Higher fixed cost' : t < 0 ? 'Lower fixed cost' : 'Original position';
  }

  if (kind === 'variableCost') {
    const shift = 18 * t;
    mc = q => baseMC(q) + shift;
    const qMin = baselineQ;
    ac = makeAC(qMin, 0.025, mc);
    note = t > 0 ? 'Higher variable cost' : t < 0 ? 'Lower variable cost' : 'Original position';
  }

  if (kind === 'marketShare') {
    const intercept = 104 + 20 * t;
    const slope = 0.60 - 0.08 * t;
    ar = q => intercept - slope * q;
    mr = q => intercept - 2 * slope * q;
    note = t > 0 ? 'Larger market share' : t < 0 ? 'Smaller market share' : 'Original position';
  }

  if (kind === 'economies') {
    const qMin = baselineQ + 16 * t;
    const vertical = -10 * t;
    const slopeFactor = 1 - 0.22 * t;
    mc = q => 18 + vertical + 0.72 * slopeFactor * q;
    const curvature = 0.025 * (1 - 0.42 * t);
    ac = makeAC(qMin, Math.max(0.012, curvature), mc);
    note = t > 0 ? 'Stronger economies of scale' : t < 0 ? 'Weaker economies of scale' : 'Original position';
  }

  return { mc, ac, ar, mr, note };
}

function Diagram({ kind, amount, label, changed }) {
  const m = useMemo(() => modelFor(kind, amount), [kind, amount]);
  const acPath = pathFrom(m.ac, 8, 94);
  const mcPath = pathFrom(m.mc, 5, 94);
  const arPath = pathFrom(m.ar, 6, 96);
  const mrPath = pathFrom(m.mr, 6, 86);

  return (
    <section className={`diagram-card ${changed ? 'after' : ''}`}>
      <div className="diagram-heading">
        <div>
          <span className="eyebrow">{label}</span>
          <h2>{changed ? m.note : 'Original position'}</h2>
        </div>
        <span className="change-pill">{amount > 0 ? '+' : ''}{amount}%</span>
      </div>

      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label} firms diagram`}>
        <defs>
          <marker id={`arrow-${label}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L7,3 z" className="axis-arrow" />
          </marker>
        </defs>

        {[30, 60, 90].map(v => (
          <line key={`h${v}`} x1={plot.left} y1={sy(v)} x2={plot.right} y2={sy(v)} className="grid" />
        ))}
        {[25, 50, 75].map(v => (
          <line key={`v${v}`} x1={sx(v)} y1={plot.top} x2={sx(v)} y2={plot.bottom} className="grid" />
        ))}

        <line x1={plot.left} y1={plot.bottom} x2={plot.right + 8} y2={plot.bottom} className="axis" markerEnd={`url(#arrow-${label})`} />
        <line x1={plot.left} y1={plot.bottom} x2={plot.left} y2={plot.top - 8} className="axis" markerEnd={`url(#arrow-${label})`} />

        <path d={acPath} className="curve ac" />
        <path d={mcPath} className="curve mc" />
        <path d={arPath} className="curve ar" />
        <path d={mrPath} className="curve mr" />

        <text x={sx(82)} y={sy(m.ac(82)) - 7} className="curve-label ac-label">AC</text>
        <text x={sx(84)} y={sy(m.mc(84)) - 7} className="curve-label mc-label">MC</text>
        <text x={sx(88)} y={sy(m.ar(88)) - 7} className="curve-label ar-label">AR</text>
        <text x={sx(66)} y={sy(m.mr(66)) + 17} className="curve-label mr-label">MR</text>

        <text x={plot.right - 8} y={plot.bottom + 30} className="axis-label">Output</text>
        <text x="18" y="28" className="axis-label">Cost / Revenue</text>
      </svg>
    </section>
  );
}

function App() {
  const [active, setActive] = useState('fixedCost');
  const [values, setValues] = useState({ fixedCost: 25, variableCost: 25, marketShare: 25, economies: 25 });
  const scenario = scenarios.find(s => s.id === active);
  const value = values[active];

  const updateValue = e => setValues(v => ({ ...v, [active]: Number(e.target.value) }));
  const reset = () => setValues(v => ({ ...v, [active]: 0 }));

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <span className="kicker">H2 ECONOMICS · FIRMS AND DECISIONS</span>
          <h1>Before & After Scenarios</h1>
          <p>Select one scenario, move its slider, and compare the original diagram with the changed diagram.</p>
        </div>
      </header>

      <nav className="scenario-tabs" aria-label="Choose a scenario">
        {scenarios.map((s, index) => (
          <button key={s.id} className={active === s.id ? 'active' : ''} onClick={() => setActive(s.id)}>
            <span>{index + 1}</span>{s.short}
          </button>
        ))}
      </nav>

      <section className="control-strip">
        <div>
          <span className="control-label">{scenario.title}</span>
          <p>{scenario.explanation}</p>
        </div>
        <div className="slider-area">
          <div className="slider-topline">
            <label htmlFor="scenario-slider">Change</label>
            <output>{value > 0 ? '+' : ''}{value}{scenario.unit}</output>
          </div>
          <input
            id="scenario-slider"
            type="range"
            min={scenario.min}
            max={scenario.max}
            step={scenario.step}
            value={value}
            onChange={updateValue}
          />
          <div className="range-labels"><span>Decrease</span><span>No change</span><span>Increase</span></div>
        </div>
        <button className="reset-button" onClick={reset} title="Reset current scenario">
          <RotateCcw size={17} /> Reset
        </button>
      </section>

      <section className="comparison-grid">
        <Diagram kind={active} amount={0} label="BEFORE" changed={false} />
        <Diagram kind={active} amount={value} label="AFTER" changed={true} />
      </section>

      <footer>
        Use the four buttons to switch scenarios. Each scenario isolates one factor while holding the others constant.
      </footer>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
