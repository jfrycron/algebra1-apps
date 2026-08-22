"use client";
import { useEffect, useRef, useState } from "react";
type Direction = "fill" | "drain";
type Config = { start: number; rate: number; direction: Direction };
const CAPACITY = 24;
const TOTAL = 5;
const TITLES = [
  "Play With the Tank",
  "Before Time Passes",
  "Find the Rate",
  "Build the Equation",
  "Build the Tank",
];
const PRESETS: Config[] = [
  { start: 12, rate: 2, direction: "fill" },
  { start: 12, rate: 2, direction: "fill" },
  { start: 12, rate: 2, direction: "fill" },
  { start: 6, rate: 3, direction: "fill" },
  { start: 10, rate: 1, direction: "fill" },
];
const ROUND_BANK: Record<number, Config[]> = {
  1: [
    { start: 4, rate: 2, direction: "fill" },
    { start: 7, rate: 1, direction: "fill" },
    { start: 10, rate: 2, direction: "fill" },
    { start: 13, rate: 1, direction: "drain" },
    { start: 18, rate: 2, direction: "drain" },
  ],
  2: [
    { start: 4, rate: 1, direction: "fill" },
    { start: 6, rate: 2, direction: "fill" },
    { start: 9, rate: 3, direction: "fill" },
    { start: 12, rate: 1, direction: "drain" },
    { start: 16, rate: 2, direction: "drain" },
    { start: 18, rate: 3, direction: "drain" },
  ],
  3: [
    { start: 6, rate: 2, direction: "fill" },
    { start: 8, rate: 3, direction: "fill" },
    { start: 12, rate: 2, direction: "drain" },
    { start: 15, rate: 3, direction: "drain" },
    { start: 20, rate: 2, direction: "drain" },
  ],
};
const TARGET_BANK: Config[] = [
  { start: 6, rate: 2, direction: "fill" },
  { start: 9, rate: 1, direction: "fill" },
  { start: 12, rate: 2, direction: "drain" },
  { start: 15, rate: 3, direction: "drain" },
  { start: 18, rate: 2, direction: "drain" },
];
const m = (c: Config) => (c.direction === "fill" ? c.rate : -c.rate);
const end = (c: Config) =>
  c.rate === 0
    ? 6
    : Math.max(
        0,
        Math.min(
          6,
          c.direction === "fill"
            ? (CAPACITY - c.start) / c.rate
            : c.start / c.rate,
        ),
      );
const amount = (c: Config, t: number) => c.start + m(c) * t;
const neat = (n: number) => String(Math.round(n * 10) / 10);
function Arrow({ right = false }: { right?: boolean }) {
  return (
    <svg viewBox="0 0 20 20">
      <path d={right ? "m7.5 4.5 5.5 5.5-5.5 5.5" : "M12.5 4.5 7 10l5.5 5.5"} />
    </svg>
  );
}
function Tank({
  c,
  time,
  running,
}: {
  c: Config;
  time: number;
  running: boolean;
}) {
  const a = Math.max(0, Math.min(CAPACITY, amount(c, Math.min(time, end(c)))));
  return (
    <div className="tank-card">
      <div className="label">WATER TANK</div>
      <div className="tank">
        <div className="pipe" />
        {c.direction === "fill" && running && c.rate > 0 && (
          <div
            className="stream"
            style={{ bottom: `${(a / CAPACITY) * 100}%` }}
          />
        )}
        <div className="scale">
          {Array.from({ length: 7 }, (_, i) => CAPACITY - i * 4).map((n) => (
            <span key={n} style={{ bottom: `${(n / CAPACITY) * 100}%` }}>
              {n}
            </span>
          ))}
        </div>
        <div className="water" style={{ height: `${(a / CAPACITY) * 100}%` }}>
          <i />
        </div>
        <div className="level" style={{ bottom: `${(a / CAPACITY) * 100}%` }} />
      </div>
    </div>
  );
}
function Controls({
  c,
  setC,
  time,
  setTime,
  running,
  setRunning,
  editable,
  reveal,
  onStartingAmountChange,
  showRunControls,
  onReset,
}: {
  c: Config;
  setC: (c: Config) => void;
  time: number;
  setTime: (n: number) => void;
  running: boolean;
  setRunning: (v: boolean) => void;
  editable: boolean;
  reveal: () => void;
  onStartingAmountChange: () => void;
  showRunControls: boolean;
  onReset: () => void;
}) {
  const change = (n: Config, startingAmountChanged = false) => {
    setC(n);
    setRunning(false);
    setTime(0);
    if (startingAmountChanged) onStartingAmountChange();
  };
  const run = () => {
    if (running) return setRunning(false);
    if (time >= end(c)) setTime(0);
    reveal();
    setRunning(true);
  };
  return (
    <div className="controls">
      <div className="toggle">
        <button
          className={c.direction === "fill" ? "active" : ""}
          disabled={!editable || running}
          onClick={() => change({ ...c, direction: "fill" })}
        >
          Fill
        </button>
        <button
          className={c.direction === "drain" ? "active" : ""}
          disabled={!editable || running}
          onClick={() => change({ ...c, direction: "drain" })}
        >
          Drain
        </button>
      </div>
      <label>
        Starting amount <b>{c.start} gal</b>
        <input
          type="range"
          min="0"
          max={CAPACITY}
          step="1"
          value={c.start}
          disabled={!editable || running}
          onChange={(e) => change({ ...c, start: +e.target.value }, true)}
        />
      </label>
      <label>
        Rate <b>{c.rate} gal/s</b>
        <input
          type="range"
          min="0"
          max="5"
          step="1"
          value={c.rate}
          disabled={!editable || running}
          onChange={(e) => change({ ...c, rate: +e.target.value })}
        />
      </label>
      {showRunControls && <div className="run">
        <button className="start" onClick={run}>
          {running
            ? "Pause"
            : time > 0 && time < end(c)
              ? "Resume"
              : time > 0
                ? "Replay"
                : "Start"}
        </button>
        <button
          onClick={onReset}
        >
          Reset
        </button>
      </div>}
    </div>
  );
}
function Table({
  c,
  time,
  pulseKey,
}: {
  c: Config;
  time: number;
  pulseKey: number;
}) {
  const n = Math.max(1, Math.floor(Math.min(time, end(c))) + 1),
    rows = Array.from({ length: n }, (_, t) => ({ t, w: amount(c, t) }));
  return (
    <div className="table">
      <table>
        <thead>
          <tr>
            <th>Time (s)</th>
            <th>Water (gal)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.t === 0 ? `start-${pulseKey}` : r.t}
              className={pulseKey > 0 && r.t === 0 ? "pulse-row" : ""}
            >
              <td>{r.t}</td>
              <td>{neat(r.w)}</td>
            </tr>
          ))}
          {Array.from({ length: Math.max(0, 7 - n) }, (_, i) => (
            <tr className="empty" key={i}>
              <td>—</td>
              <td>—</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Graph({
  c,
  time,
  pulseKey,
  revealData = true,
  showIntercept = false,
}: {
  c: Config;
  time: number;
  pulseKey: number;
  revealData?: boolean;
  showIntercept?: boolean;
}) {
  const [hover, setHover] = useState<{ t: number; w: number } | null>(null),
    W = 560,
    H = 480,
    L = 48,
    R = 18,
    T = 18,
    B = 42,
    x = (t: number) => L + (t / 6) * (W - L - R),
    y = (w: number) => T + ((CAPACITY - w) / CAPACITY) * (H - T - B),
    et = Math.min(time, end(c)),
    whole = Math.floor(et),
    ts = Array.from({ length: whole + 1 }, (_, i) => i);
  if (et > whole) ts.push(et);
  const inspect = (e: React.PointerEvent<SVGSVGElement>) => {
    const q = e.currentTarget.getScreenCTM();
    if (!q || et <= 0) return setHover(null);
    const p = e.currentTarget.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    const z = p.matrixTransform(q.inverse()),
      raw = ((z.x - L) / (W - L - R)) * 6;
    if (raw < 0 || raw > et || Math.abs(z.y - y(amount(c, raw))) > 18)
      return setHover(null);
    const t = Math.min(
      Math.floor(et * 2) / 2,
      Math.max(0, Math.round(raw * 2) / 2),
    );
    setHover({ t, w: amount(c, t) });
  };
  return (
    <div className="graph">
      <svg
        viewBox="0 0 560 480"
        onPointerMove={inspect}
        onPointerLeave={() => setHover(null)}
      >
        {Array.from({ length: 13 }, (_, i) => i / 2).map((v) => (
          <g key={"x" + v}>
            <line
              x1={x(v)}
              y1={T}
              x2={x(v)}
              y2={H - B}
              className={Number.isInteger(v) ? "major" : "minor"}
            />
            {Number.isInteger(v) && (
              <text x={x(v)} y={H - B + 20} textAnchor="middle">
                {v}
              </text>
            )}
          </g>
        ))}
        {Array.from({ length: CAPACITY + 1 }, (_, i) => i).map((v) => (
          <g key={"y" + v}>
            <line
              x1={L}
              y1={y(v)}
              x2={W - R}
              y2={y(v)}
              className={v % 4 === 0 ? "major" : "minor"}
            />
            {v % 4 === 0 && (
              <text x={L - 9} y={y(v) + 4} textAnchor="end">
                {v}
              </text>
            )}
          </g>
        ))}
        <line x1={L} y1={T} x2={L} y2={H - B} className="axis" />
        <line x1={L} y1={H - B} x2={W - R} y2={H - B} className="axis" />
        <text x={L} y="12" className="axis-label">
          Water (gal)
        </text>
        <text
          x={(L + W - R) / 2}
          y={H - 6}
          textAnchor="middle"
          className="axis-label"
        >
          Time (s)
        </text>
        {revealData && et > 0 && (
          <polyline
            points={ts.map((t) => `${x(t)},${y(amount(c, t))}`).join(" ")}
            className="line"
          />
        )}
        {(revealData || showIntercept) && Array.from({ length: revealData ? whole + 1 : 1 }, (_, t) => (
          <circle
            key={t === 0 ? `start-${pulseKey}` : t}
            cx={x(t)}
            cy={y(amount(c, t))}
            r={t ? 5 : 6}
            className={pulseKey > 0 && t === 0 ? "point pulse-point" : "point"}
          />
        ))}
        {hover && (
          <g className="hover">
            <circle cx={x(hover.t)} cy={y(hover.w)} r="7" />
            <g
              transform={`translate(${Math.min(x(hover.t) + 10, W - 92)},${Math.max(y(hover.w) - 35, 22)})`}
            >
              <rect width="82" height="28" rx="7" />
              <text x="41" y="19" textAnchor="middle">
                ({neat(hover.t)}, {neat(hover.w)})
              </text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}
function Equation({ c, pulseKey }: { c: Config; pulseKey: number }) {
  const [bFirst, setBFirst] = useState(false),
    [drag, setDrag] = useState<"m" | "b" | null>(null),
    rate = `${neat(Math.abs(m(c)))}t`;
  const term = (k: "m" | "b") => {
    const first = bFirst ? k === "b" : k === "m";
    let text = k === "b" ? neat(c.start) : rate;
    if (k === "m" && m(c) < 0) text = first ? `−${text}` : `− ${text}`;
    else if (!first) text = `+ ${text}`;
    return (
      <button
        draggable
        onDragStart={() => setDrag(k)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => {
          if (drag && drag !== k) setBFirst((v) => !v);
          setDrag(null);
        }}
        onClick={() => setBFirst((v) => !v)}
        key={k === "b" ? `start-${pulseKey}` : k}
        className={`term ${k === "b" ? "b" : ""} ${pulseKey > 0 && k === "b" ? "pulse-box" : ""}`}
      >
        {text}
      </button>
    );
  };
  return (
    <div className="equation">
      <span>W =</span>
      {bFirst ? (
        <>
          {term("b")}
          {term("m")}
        </>
      ) : (
        <>
          {term("m")}
          {term("b")}
        </>
      )}
      <small>drag to rearrange</small>
    </div>
  );
}
function Reps({
  c,
  time,
  pulseKey,
  build,
  a,
  b,
  setA,
  setB,
  disabled,
  wrong,
  revealGraph = true,
  showIntercept = false,
}: {
  c: Config;
  time: number;
  pulseKey: number;
  build: boolean;
  a: string;
  b: string;
  setA: (v: string) => void;
  setB: (v: string) => void;
  disabled: boolean;
  wrong: boolean;
  revealGraph?: boolean;
  showIntercept?: boolean;
}) {
  return (
    <div className="reps">
      <div className="eq-dock">
        {build ? (
          <div className="equation build-dock">
            <span>W =</span>
            <input
              aria-label="rate"
              value={a}
              disabled={disabled}
              onChange={(e) => setA(e.target.value)}
              className={wrong && Number(a) !== m(c) ? "wrong" : ""}
            />
            <span>t +</span>
            <input
              aria-label="starting amount"
              value={b}
              disabled={disabled}
              onChange={(e) => setB(e.target.value)}
              className={wrong && Number(b) !== c.start ? "wrong" : ""}
            />
          </div>
        ) : (
          <Equation c={c} pulseKey={pulseKey} />
        )}
      </div>
      <div className="rep-grid">
        <Table c={c} time={time} pulseKey={pulseKey} />
        <Graph
          c={c}
          time={time}
          pulseKey={pulseKey}
          revealData={revealGraph}
          showIntercept={showIntercept}
        />
      </div>
    </div>
  );
}
function Answer({
  value,
  setValue,
  disabled,
  wrong,
  unit,
}: {
  value: string;
  setValue: (v: string) => void;
  disabled: boolean;
  wrong: boolean;
  unit: string;
}) {
  return (
    <div className="answer">
      <input
        autoFocus
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
        inputMode="numeric"
        className={wrong ? "wrong" : ""}
      />
      <span>{unit}</span>
    </div>
  );
}
function Question({
  page,
  a,
  setA,
  correct,
  wrong,
  target,
}: {
  page: number;
  a: string;
  setA: (v: string) => void;
  correct: boolean;
  wrong: boolean;
  target: Config;
}) {
  return (
    <div className="question">
      <div className="label">
        {page > 2 ? "BUILD THE MODEL" : "WHAT DO YOU NOTICE?"}
      </div>
      {page === 1 && (
        <>
          <h2>Before any time passes, how much water is in the tank?</h2>
          <Answer
            value={a}
            setValue={setA}
            disabled={correct}
            wrong={wrong}
            unit="gallons"
          />
        </>
      )}
      {page === 2 && (
        <>
          <h2>How does the amount of water change each second?</h2>
          <Answer
            value={a}
            setValue={setA}
            disabled={correct}
            wrong={wrong}
            unit="gal/s"
          />
        </>
      )}
      {page === 3 && (
        <>
          <h2>Use the tank, table, and graph to build the equation.</h2>
        </>
      )}
      {page === 4 && (
        <>
          <h2>Configure the tank to match:</h2>
          <div className="equation equation-display">
            W = {m(target) < 0 ? "−" : ""}{neat(Math.abs(m(target)))}t + {neat(target.start)}
          </div>
        </>
      )}
    </div>
  );
}
function Bonus({ page, c, target }: { page: number; c: Config; target: Config }) {
  return (
    <div className="bonus">
      <div className="label">BONUS KNOWLEDGE</div>
      {page === 1 && (
        <p>
          <b>{c.start}</b> is the water at 0 seconds, the first table value, the
          graph’s y-intercept, and the constant in the equation.
        </p>
      )}
      {page === 2 && (
        <p>
          <b>{m(c)}</b> is the gallons per second, the change between table
          rows, the graph’s slope, and the coefficient of time.
        </p>
      )}
      {page === 3 && (
        <p>
          <b>{m(c)}</b> is the tank’s rate, the table’s change, the graph’s
          slope, and the coefficient of time. <b>{c.start}</b> is the starting
          water, the time-0 value, the y-intercept, and the constant.
        </p>
      )}
      {page === 4 && (
        <p>
          <b>{m(target)}</b> is the {target.direction === "drain" ? "draining" : "filling"} rate, the table’s change, the graph’s slope,
          and the coefficient of time. <b>{target.start}</b> is the starting water, the
          time-0 value, the y-intercept, and the constant.
        </p>
      )}
    </div>
  );
}
export default function Home() {
  const [page, setPage] = useState(0),
    [furthest, setFurthest] = useState(0),
    [c, setC] = useState(PRESETS[0]),
    [target, setTarget] = useState(TARGET_BANK[TARGET_BANK.length - 1]),
    [time, setTime] = useState(0),
    [running, setRunning] = useState(false),
    [revealed, setRevealed] = useState(false),
    [a, setA] = useState(""),
    [b, setB] = useState(""),
    [correct, setCorrect] = useState(false),
    [wrong, setWrong] = useState(false),
    [bonus, setBonus] = useState(false),
    [pulseKey, setPulseKey] = useState(1),
    [practicePage, setPracticePage] = useState<number | null>(null),
    [shake, setShake] = useState(0),
    [celebrate, setCelebrate] = useState(false);
  const saved = useRef<
      Record<number, { c: Config; target: Config; a: string; b: string; correct: boolean }>
    >({}),
    review = page > 0 && page < furthest && practicePage !== page;
  useEffect(() => {
    if (!running) return;
    const id = setInterval(
      () =>
        setTime((old) => {
          const n = Math.min(end(c), old + 0.035);
          if (n >= end(c)) setRunning(false);
          return n;
        }),
      28,
    );
    return () => clearInterval(id);
  }, [running, c]);
  const load = (n: number) => {
    saved.current[page] = { c, target, a, b, correct };
    const s = saved.current[n];
    setPage(n);
    setC(s?.c ?? PRESETS[n]);
    setTarget(s?.target ?? TARGET_BANK[TARGET_BANK.length - 1]);
    setA(s?.a ?? "");
    setB(s?.b ?? "");
    setCorrect(s?.correct ?? n < furthest);
    setWrong(false);
    setBonus(false);
    setPulseKey(n <= 1 ? 1 : 0);
    setPracticePage(null);
    setRunning(false);
    setTime(n ? end(s?.c ?? PRESETS[n]) : 0);
  };
  const check = () => {
    const ok =
      page === 1
        ? +a === c.start
        : page === 2
          ? +a === m(c)
          : page === 3
            ? +a === m(c) && +b === c.start
            : c.direction === target.direction && c.start === target.start && c.rate === target.rate;
    if (ok) {
      setCorrect(true);
      setWrong(false);
      saved.current[page] = { c, target, a, b, correct: true };
    } else {
      setWrong(true);
      setShake((k) => k + 1);
    }
  };
  const next = () => {
    if (page === TOTAL - 1) return setCelebrate(true);
    const n = page + 1;
    setFurthest(Math.max(furthest, n));
    load(n);
  };
  const newRound = () => {
    if (page < 1 || page > 4) return;
    let nextConfig: Config;
    if (page === 4) {
      const choices = TARGET_BANK.filter(
        (option) =>
          option.start !== target.start ||
          option.rate !== target.rate ||
          option.direction !== target.direction,
      );
      const nextTarget = choices[Math.floor(Math.random() * choices.length)];
      setTarget(nextTarget);
      nextConfig = { start: 12, rate: 1, direction: "fill" };
      if (
        nextConfig.start === nextTarget.start &&
        nextConfig.rate === nextTarget.rate &&
        nextConfig.direction === nextTarget.direction
      )
        nextConfig = { start: 4, rate: 1, direction: "drain" };
    } else {
      const choices = ROUND_BANK[page].filter(
        (option) =>
          option.start !== c.start ||
          option.rate !== c.rate ||
          option.direction !== c.direction,
      );
      nextConfig = choices[Math.floor(Math.random() * choices.length)];
    }
    setC(nextConfig);
    setTime(end(nextConfig));
    setRunning(false);
    setA("");
    setB("");
    setCorrect(false);
    setWrong(false);
    setBonus(false);
    if (page === 1) setPulseKey((key) => key + 1);
    else setPulseKey(0);
    setPracticePage(page);
    delete saved.current[page];
  };
  const again = () => {
    saved.current = {};
    setPage(0);
    setFurthest(0);
    setC(PRESETS[0]);
    setTarget(TARGET_BANK[TARGET_BANK.length - 1]);
    setTime(0);
    setRunning(false);
    setRevealed(false);
    setA("");
    setB("");
    setCorrect(false);
    setWrong(false);
    setBonus(false);
    setPulseKey(1);
    setPracticePage(null);
    setCelebrate(false);
  };
  const resetExplore = () => {
    setC(PRESETS[0]);
    setTime(0);
    setRunning(false);
    setRevealed(false);
    setWrong(false);
    setBonus(false);
    setPulseKey((key) => key + 1);
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.repeat || page === 0 || review || celebrate)
        return;
      e.preventDefault();
      if (correct) next();
      else check();
    };
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  });
  if (celebrate)
    return (
      <main className="celebration">
        <section>
          <div className="checkmark">✓</div>
          <p className="eyebrow">Investigation complete</p>
          <h1>You Connected the Representations</h1>
          <p>
            The water tank, table, graph, and equation all describe the same
            linear relationship.
          </p>
          <div className="celebrate-actions">
            <button
              onClick={() => {
                setCelebrate(false);
                setPage(4);
                setFurthest(5);
                setCorrect(true);
              }}
            >
              Review My Work
            </button>
            <button className="primary" onClick={again}>
              Run a New Investigation
            </button>
          </div>
        </section>
      </main>
    );
  const repTime = page === 0 ? (revealed && !running ? end(c) : time) : end(c),
    editable = (page === 0 || page === 4) && !review && !correct;
  return (
    <main className={`shell ${correct && !review ? "right" : ""}`}>
      <header>
        <div>
          <h1>The Water Tank Investigation</h1>
          <p>
            <b>{TITLES[page]}.</b> Watch the tank, table, graph, and equation
            change together.
          </p>
        </div>
        <div className="pill">
          <button disabled={!page} onClick={() => load(page - 1)}>
            <Arrow />
          </button>
          <span>
            {page + 1} of {TOTAL}
          </span>
          <button
            disabled={
              (page === TOTAL - 1 && furthest < TOTAL) ||
              (page !== 0 && page >= furthest)
            }
            onClick={() => {
              if (page === TOTAL - 1 && furthest === TOTAL) {
                setCelebrate(true);
                return;
              }
              if (page === 0) setFurthest(Math.max(furthest, 1));
              load(page + 1);
            }}
          >
            <Arrow right />
          </button>
        </div>
      </header>
      <section key={shake} className={`workspace ${wrong ? "shake" : ""}`}>
        <div className={`layout ${page === 0 ? "explore" : ""}`}>
          <div className="tank-col">
            <Tank
              c={c}
              time={page === 0 ? time : 0}
              running={running}
            />
            <Controls
              c={c}
              setC={setC}
              time={time}
              setTime={setTime}
              running={running}
              setRunning={setRunning}
              editable={editable}
              reveal={() => setRevealed(true)}
              onStartingAmountChange={() => setPulseKey((k) => k + 1)}
              showRunControls={page === 0}
              onReset={resetExplore}
            />
          </div>
          <Reps
            c={c}
            time={repTime}
            pulseKey={pulseKey}
            build={page === 3}
            a={a}
            b={b}
            setA={setA}
            setB={setB}
            disabled={correct || review}
            wrong={wrong}
            revealGraph={page !== 0 || revealed}
            showIntercept={page === 0}
          />
          {page > 0 && (
            <div className="q-col">
              <Question
                page={page}
                a={
                  review
                    ? page === 1
                      ? neat(c.start)
                      : page === 2
                        ? neat(m(c))
                        : page === 3
                          ? neat(m(c))
                          : a
                    : a
                }
                setA={setA}
                correct={correct || review}
                wrong={wrong}
                target={target}
              />
              <div className="actions">
                <button className="new-round" onClick={newRound}>
                  New Round
                </button>
                <button
                  className="bonus-btn"
                  onClick={() => setBonus((v) => !v)}
                >
                  {bonus ? "Hide Bonus Knowledge" : "Bonus Knowledge"}
                </button>
                {!review &&
                  (!correct ? (
                    <button className="check" onClick={check}>
                      Check
                    </button>
                  ) : (
                    <button className="next" onClick={next}>
                      {page === 4
                        ? "Correct — See Celebration"
                        : "Correct — Next Page"}
                    </button>
                  ))}
              </div>
              <div className="bonus-slot">
                {bonus && <Bonus page={page} c={c} target={target} />}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
