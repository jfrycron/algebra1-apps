"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type SignCategory = "plus-plus" | "minus-minus" | "mixed-positive" | "mixed-negative";
type Problem = { p: number; q: number; b: number; c: number; category: SignCategory };
type Pair = [number, number];

const choose = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];

const makeProblem = (previous?: Problem): Problem => {
  const categories: SignCategory[] = ["plus-plus", "minus-minus", "mixed-positive", "mixed-negative"];
  const category = choose(categories.filter(value => value !== previous?.category));
  const values = [1, 2, 3, 4, 5, 6, 7];
  for (let tries = 0; tries < 100; tries++) {
    const small = choose(values.slice(0, 5));
    const large = choose(values.filter(value => value > small));
    let p = small, q = large;
    if (category === "minus-minus") { p = -small; q = -large; }
    if (category === "mixed-positive") { p = large; q = -small; }
    if (category === "mixed-negative") { p = small; q = -large; }
    const next = { p, q, b: p + q, c: p * q, category };
    const vertexY = next.c - (next.b * next.b) / 4;
    if (vertexY >= -7.5 && vertexY <= 7.5 && (!previous || previous.b !== next.b || previous.c !== next.c)) return next;
  }
  return { p: -2, q: 3, b: 1, c: -6, category: "mixed-positive" };
};

const signedTerm = (value: number, variable = "") => {
  if (value === 0) return "";
  const magnitude = Math.abs(value);
  return `${value < 0 ? "−" : "+"} ${variable && magnitude === 1 ? "" : magnitude}${variable}`;
};

const standardText = (problem: Problem) => `y = x² ${signedTerm(problem.b, "x")} ${signedTerm(problem.c)}`.replace(/\s+/g, " ").trim();
const factorExpression = (first: string, second: string) => {
  if (!first || !second || first === "-" || second === "-") return "Complete your factored form";
  const factor = (value: number) => `(x ${signedTerm(value)})`;
  return `${factor(Number(first))}${factor(Number(second))}`;
};
const factoredText = (first: string, second: string) => `y = ${factorExpression(first, second)}`;

const cleanInteger = (value: string) => {
  const normalized = value.replace(/−/g, "-");
  const negative = normalized.trim().startsWith("-");
  const digits = normalized.replace(/\D/g, "");
  return digits ? `${negative ? "-" : ""}${digits}` : negative ? "-" : "";
};

const formattedFactor = (value: string) => value === "-" ? "−" : value ? `${Number(value) < 0 ? "−" : "+"} ${Math.abs(Number(value))}` : "";

const factorPairs = (value: number): Pair[] => {
  const magnitude = Math.abs(value);
  const positive: Pair[] = [];
  for (let first = 1; first <= Math.sqrt(magnitude); first++) if (magnitude % first === 0) positive.push([first, magnitude / first]);
  if (value > 0) return [...positive, ...positive.map(([first, second]) => [-first, -second] as Pair)];
  return positive.flatMap(([first, second]) => [[first, -second], [-first, second]] as Pair[]);
};

const pathFor = (fn: (x: number) => number) => {
  const commands: string[] = [];
  let drawing = false;
  for (let index = 0; index <= 800; index++) {
    const x = -8 + index / 50;
    const y = fn(x);
    if (!Number.isFinite(y) || y < -8 || y > 8) { drawing = false; continue; }
    const px = ((x + 8) / 16) * 640;
    const py = ((8 - y) / 16) * 640;
    commands.push(`${drawing ? "L" : "M"}${px.toFixed(2)},${py.toFixed(2)}`);
    drawing = true;
  }
  return commands.join(" ");
};

export default function Home() {
  const [problem, setProblem] = useState<Problem>(() => makeProblem());
  const [constantEntry, setConstantEntry] = useState("");
  const [constantUnlocked, setConstantUnlocked] = useState(false);
  const [constantWrong, setConstantWrong] = useState(false);
  const [answers, setAnswers] = useState<[string, string]>(["", ""]);
  const [submittedValues, setSubmittedValues] = useState<[number, number] | null>(null);
  const [revealKey, setRevealKey] = useState(0);
  const [wrongFactors, setWrongFactors] = useState<[boolean, boolean]>([false, false]);
  const [status, setStatus] = useState<"idle" | "wrong" | "correct">("idle");
  const [shakeKey, setShakeKey] = useState(0);
  const [showGiven, setShowGiven] = useState(true);
  const [showStudent, setShowStudent] = useState(false);
  const [bonusOpen, setBonusOpen] = useState(false);

  const pairs = useMemo(() => factorPairs(problem.c), [problem.c]);
  const studentValues = useMemo(() => {
    if (answers.some(value => !value || value === "-")) return null;
    const values = answers.map(Number);
    return values.every(Number.isInteger) ? values as [number, number] : null;
  }, [answers]);
  const givenPath = useMemo(() => pathFor(x => x * x + problem.b * x + problem.c), [problem]);
  const studentPath = useMemo(() => submittedValues ? pathFor(x => (x + submittedValues[0]) * (x + submittedValues[1])) : "", [submittedValues]);

  const resetProblem = useCallback(() => {
    setProblem(old => makeProblem(old));
    setConstantEntry(""); setConstantUnlocked(false); setConstantWrong(false);
    setAnswers(["", ""]); setSubmittedValues(null); setWrongFactors([false, false]); setStatus("idle");
    setShowGiven(true); setShowStudent(false); setBonusOpen(false);
  }, []);

  const restartEquation = () => {
    setAnswers(["", ""]); setSubmittedValues(null); setWrongFactors([false, false]);
    setStatus("idle"); setConstantWrong(false); setShowStudent(false); setBonusOpen(false);
  };

  const checkConstant = () => {
    if (Number(constantEntry) === problem.c) { setConstantUnlocked(true); setConstantWrong(false); }
    else { setConstantWrong(true); setShakeKey(value => value + 1); }
  };

  const checkFactors = () => {
    const first = Number(answers[0]);
    const second = Number(answers[1]);
    const correct = studentValues !== null && first * second === problem.c && first + second === problem.b;
    if (studentValues) { setSubmittedValues(studentValues); setRevealKey(value => value + 1); }
    if (correct) { setShowStudent(true); setWrongFactors([false, false]); setStatus("correct"); return; }
    const target = [problem.p, problem.q];
    const firstMatches = target.includes(first);
    const secondMatches = target.includes(second) && (first !== second || problem.p === problem.q);
    setWrongFactors([!firstMatches, !secondMatches]);
    if (studentValues) setShowStudent(true);
    setStatus("wrong");
    setShakeKey(value => value + 1);
  };

  const updateAnswer = (index: 0 | 1, value: string) => {
    const next: [string, string] = [...answers];
    next[index] = cleanInteger(value);
    setAnswers(next);
    const nextWrong: [boolean, boolean] = [...wrongFactors];
    nextWrong[index] = false;
    setWrongFactors(nextWrong);
    setSubmittedValues(null);
    setStatus("idle");
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || bonusOpen) return;
      event.preventDefault();
      if (status === "idle") checkFactors();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return <main className={`app-shell ${status === "correct" && showStudent ? "celebrate" : ""}`}>
    <header className="app-header">
      <div className="title-group"><h1>Quadratic Functions: Factoring and Graphing</h1><p><strong>Mixed Practice:</strong> Factor the quadratic, then compare the two parabolas.</p></div>
      <button className={`bonus-button header-bonus ${bonusOpen ? "active" : ""}`} onClick={() => setBonusOpen(open => !open)}>Bonus Knowledge</button>
    </header>

    <section key={shakeKey} className={`workspace graph-workspace ${status === "wrong" || constantWrong ? "workspace-incorrect" : ""}`}>
      {bonusOpen && <div className="telestrator-dim" aria-hidden="true"/>}
      <div className="split-layout">
        <section className={`factoring-panel ${bonusOpen ? "telestrator-factor-active" : ""}`} aria-label="Factoring workspace">
          <button className="choose-problem-button graph-new-problem" onClick={resetProblem}>Choose Another Problem</button>
          <div className={`equation-card graph-equation-card ${bonusOpen ? "bonus-equation-layer" : ""}`}>
            <div className="graph-equation-row">
              <span className="given-standard">{standardText(problem)}</span><span className="equation-equals">=</span>
              <span className="student-factored"><span>(x</span><input readOnly={status === "correct"} value={formattedFactor(answers[0])} onChange={event => updateAnswer(0, event.target.value)} onFocus={event => event.currentTarget.select()} inputMode="numeric" aria-label="First signed factor" className={`graph-factor-input ${wrongFactors[0] ? "striped" : ""} ${status === "correct" ? "completed" : ""}`}/><span>)</span><span className="factor-space">(x</span><input readOnly={status === "correct"} value={formattedFactor(answers[1])} onChange={event => updateAnswer(1, event.target.value)} onFocus={event => event.currentTarget.select()} inputMode="numeric" aria-label="Second signed factor" className={`graph-factor-input ${wrongFactors[1] ? "striped" : ""} ${status === "correct" ? "completed" : ""}`}/><span>)</span></span>
            </div>
          </div>

          <div className="factor-request-area">
            {!constantUnlocked ? <p className="factor-request">What number do you want to see the factors of? <input className={`constant-input ${constantWrong ? "striped" : ""}`} value={constantEntry} onChange={event => setConstantEntry(cleanInteger(event.target.value))} onKeyDown={event => {if(event.key==="Enter"){event.preventDefault();event.stopPropagation();checkConstant();}}} inputMode="numeric" aria-label="Number whose factors should be shown"/><button className="show-factors-button" onClick={checkConstant}>Show Factors</button></p> : <div className="factor-results"><p>These are all the number pairs that multiply to <strong>{problem.c}</strong>.</p><div className="plain-pair-grid">{pairs.map(([first, second], index) => <div className="plain-pair" key={`${first}-${second}-${index}`}><span>{first < 0 ? `−${Math.abs(first)}` : first}</span><span>×</span><span>{second < 0 ? `−${Math.abs(second)}` : second}</span></div>)}</div><p className="pair-question graph-pair-question">Which pair of numbers belongs in the equation?</p></div>}
          </div>

          <div className="graph-actions">
            {status === "idle" ? <button className="primary" onClick={checkFactors}>Submit</button> : <button className="secondary restart-equation" onClick={restartEquation}>Restart Equation</button>}
            {status === "correct" && <button className="success" onClick={resetProblem}>Correct — New Problem</button>}
          </div>
        </section>

        <section className={`graph-panel ${bonusOpen ? "telestrator-active" : ""}`} aria-label="Coordinate plane comparison">
          <div className="coordinate-wrap">
          <div className="graph-controls">
            <label className="curve-toggle given-toggle"><input type="checkbox" checked={showGiven} onChange={event => setShowGiven(event.target.checked)}/><span><strong>Given</strong>{standardText(problem)}</span></label>
            <label className="curve-toggle student-toggle"><input type="checkbox" checked={showStudent} disabled={!submittedValues} onChange={event => {setShowStudent(event.target.checked);if(event.target.checked&&submittedValues)setRevealKey(value=>value+1);}}/><span><strong>Your equation</strong>{submittedValues ? factoredText(String(submittedValues[0]),String(submittedValues[1])) : "Submit an equation to graph"}</span></label>
          </div>
            <CoordinatePlane givenPath={bonusOpen || showGiven ? givenPath : ""} studentPath={!bonusOpen && showStudent ? studentPath : ""} roots={[-problem.p, -problem.q]} bonusOpen={bonusOpen} revealKey={revealKey}/>
            {bonusOpen && <div className="root-message"><p>The points where a parabola crosses the x-axis are called</p><strong>ROOTS</strong><p>What is the connection between factored form and the roots?</p></div>}
          </div>
        </section>
      </div>
    </section>
  </main>;
}

function CoordinatePlane({ givenPath, studentPath, roots, bonusOpen, revealKey }: { givenPath: string; studentPath: string; roots: number[]; bonusOpen: boolean; revealKey: number }) {
  const ticks = Array.from({ length: 17 }, (_, index) => index - 8);
  const map = (value: number) => ((value + 8) / 16) * 640;
  const rootCenter = map((roots[0] + roots[1]) / 2);
  return <svg className="coordinate-plane" viewBox="0 0 640 640" role="img" aria-label="Coordinate plane from negative 8 to 8 on both axes comparing the given and student parabolas">
    <defs><clipPath id="graph-clip"><rect width="640" height="640" rx="14"/></clipPath><marker id="root-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#ffd54a"/></marker></defs>
    <g className={`graph-scene ${bonusOpen ? "root-zoom" : ""}`} style={{transformOrigin:`${rootCenter}px 320px`}}>
    <rect width="640" height="640" fill="#fff"/>
    <g className="grid-lines">{ticks.map(value => <g key={value}><line x1={map(value)} y1="0" x2={map(value)} y2="640"/><line x1="0" y1={640-map(value)} x2="640" y2={640-map(value)}/></g>)}</g>
    <g className="axes"><line x1="0" y1="320" x2="640" y2="320"/><line x1="320" y1="0" x2="320" y2="640"/></g>
    <g className="axis-labels">{ticks.filter(value => value !== 0).map(value => <g key={value}><text x={map(value)} y="339" textAnchor="middle">{value}</text><text x="309" y={640-map(value)+4} textAnchor="end">{value}</text></g>)}</g>
    <g clipPath="url(#graph-clip)">{givenPath && <path className={`given-curve ${bonusOpen ? "bonus-given-curve" : ""}`} d={givenPath}/>} {studentPath && <g key={revealKey}><path className="student-ghost-curve" pathLength="1" d={studentPath}/><path className="student-final-curve" d={studentPath}/></g>}</g>
    {bonusOpen && <g className="root-annotations">{[...roots].sort((a,b)=>a-b).map((root,index) => {const rootX=map(root);const startX=Math.max(120,Math.min(520,rootX+(index===0?-45:45)));return <g key={`${root}-${index}`}><circle className="root-point" cx={rootX} cy="320" r="7"/><line x1={startX} y1="520" x2={rootX} y2="334" markerEnd="url(#root-arrow)"/></g>;})}</g>}
    </g>
  </svg>;
}
