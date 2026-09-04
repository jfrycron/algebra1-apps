"use client";

import { DragEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

type Problem = { p: number; q: number; b: number; c: number };
type Pair = { a: number; b: number; id: string };
type Status = "idle" | "wrong" | "correct";

const pages = [
  "Introduction", "Finding the Right Pair", "Finding the Right Pair", "Plus • Plus", "Minus • Plus",
  "Plus • Minus", "Minus • Minus", "Mixed Practice",
];
const subtitles = [
  "See the goal before you begin",
  "Discover what makes one factor pair fit", "Notice the relationship a second time",
  "Practice positive middle and constant terms", "Practice negative middle and positive constant terms",
  "Practice positive middle and negative constant terms", "Practice negative middle and constant terms",
  "Choose the pair without a sign-category clue",
];
const fixed: Problem[] = [
  { p: 3, q: 4, b: 7, c: 12 }, { p: 4, q: 5, b: 9, c: 20 },
];
const rand = (lo: number, hi: number) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
const choose = <T,>(xs: T[]) => xs[rand(0, xs.length - 1)];
const factorCount = (n: number) => {
  let count = 0;
  for (let i = 1; i <= Math.sqrt(Math.abs(n)); i++) if (Math.abs(n) % i === 0) count++;
  return count;
};
const factorPairsFor = (n: number) => {
  const pairs: Array<[number, number]> = [];
  for (let a = 1; a <= Math.sqrt(n); a++) if (n % a === 0) pairs.push([a, n / a]);
  return pairs;
};
const practiceConstants = Array.from({ length: 31 }, (_, i) => i + 6).filter(n => factorCount(n) >= 3);
const makeProblem = (page: number, previous?: Problem): Problem => {
  const category = page === 7 ? choose([2, 3, 4, 5]) : page - 1;
  for (let tries = 0; tries < 100; tries++) {
    const magnitude = choose(practiceConstants);
    const availablePairs = factorPairsFor(magnitude).filter(([small, large]) => category < 4 || small < large);
    const [small, large] = Math.random() < .38 ? availablePairs[0] : choose(availablePairs.slice(1));
    let p = small, q = large;
    if (category === 3) { p = -small; q = -large; }
    if (category === 4) { p = -small; q = large; }
    if (category === 5) { p = small; q = -large; }
    const next = { p, q, b: p + q, c: p * q };
    if (!previous || next.b !== previous.b || next.c !== previous.c) return next;
  }
  return category === 2 ? { p: 3, q: 8, b: 11, c: 24 } : category === 3 ? { p: -3, q: -4, b: -7, c: 12 } : category === 4 ? { p: -2, q: 5, b: 3, c: -10 } : { p: 2, q: -7, b: -5, c: -14 };
};
const middle = (b: number) => b < 0 ? `− ${Math.abs(b)}x` : `+ ${b}x`;
const constant = (c: number) => c < 0 ? `− ${Math.abs(c)}` : `+ ${c}`;
const formattedEntry = (value: string) => value === "-" ? "−" : value ? `${Number(value) < 0 ? "−" : "+"} ${Math.abs(Number(value))}` : "";
const formattedSlot = (value: number | null) => value === null ? "" : `${value < 0 ? "−" : "+"} ${Math.abs(value)}`;
const cleanEntry = (value: string, positiveOnly = false) => {
  const normalized = value.replace(/−/g, "-");
  const digits = normalized.replace(/\D/g, "");
  return positiveOnly ? digits : normalized.includes("-") ? `-${digits}` : digits;
};
const allPairs = (problem: Problem, page: number): Pair[] => {
  const n = Math.abs(problem.c), base: Array<[number, number]> = [];
  for (let a = 1; a <= Math.sqrt(n); a++) if (n % a === 0) base.push([a, n / a]);
  const pairs: Array<[number, number]> = [];
  if (problem.c > 0) {
    base.forEach(([a, b]) => pairs.push([a, b]));
    if (page >= 1) base.forEach(([a, b]) => pairs.push([-a, -b]));
  } else base.forEach(([a, b]) => { pairs.push([a, -b], [-a, b]); });
  return pairs.map(([a, b], i) => ({ a, b, id: `${a}:${b}:${i}` }));
};

function FactorPair({ pair, draggable, hideSum = false, selected, onTile, onDrag }: { pair: Pair; draggable: boolean; hideSum?: boolean; selected?: number | null; onTile?: (n: number) => void; onDrag?: (e: DragEvent, n: number) => void }) {
  const [show, setShow] = useState(false);
  const tile = (n: number, key: string) => draggable ? <button key={key} draggable onDragStart={e => onDrag?.(e, n)} onClick={() => onTile?.(n)} className={`number-tile ${selected === n ? "selected" : ""}`} aria-label={`${n}; select this factor`}>{n < 0 ? `−${Math.abs(n)}` : n}</button> : <span className="number-value" key={key}>{n < 0 ? `−${Math.abs(n)}` : n}</span>;
  return <div className={`pair-card ${!draggable ? "static-pair" : ""} ${hideSum ? "no-sum" : ""} ${show ? "show-sum" : ""}`} tabIndex={0} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} onFocus={() => setShow(true)} onBlur={() => setShow(false)} onClick={e => { if ((e.target as HTMLElement).classList.contains("pair-card")) setShow(v => !v); }}>
    <div>{tile(pair.a, "a")}<span>×</span>{tile(pair.b, "b")}</div>{!hideSum && <span className="sum-tip">Adds to {pair.a + pair.b < 0 ? `−${Math.abs(pair.a + pair.b)}` : pair.a + pair.b}</span>}
  </div>;
}

export default function Home() {
  const [page, setPage] = useState(0);
  const [problem, setProblem] = useState<Problem>({ p: 2, q: 3, b: 5, c: 6 });
  const [answers, setAnswers] = useState<[string, string]>(["", ""]);
  const [invalidAnswers, setInvalidAnswers] = useState<[boolean, boolean]>([false, false]);
  const [slots, setSlots] = useState<[number | null, number | null]>([null, null]);
  const [selected, setSelected] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [shakeKey, setShakeKey] = useState(0);
  const [constantEntry, setConstantEntry] = useState("");
  const [constantUnlocked, setConstantUnlocked] = useState(false);
  const [constantWrong, setConstantWrong] = useState(false);
  const [factorHoverReady, setFactorHoverReady] = useState(false);
  const [bonusOpen, setBonusOpen] = useState(false);
  const [factorsConfirmed, setFactorsConfirmed] = useState(false);
  const [reasoningAnswers, setReasoningAnswers] = useState<[string, string]>(["", ""]);
  const [invalidReasoning, setInvalidReasoning] = useState<[boolean, boolean]>([false, false]);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pairs = useMemo(() => allPairs(problem, page), [problem, page]);
  const pairGroups = useMemo(() => {
    const groups = new Map<string, Pair[]>();
    pairs.forEach(pair => {
      const key = [Math.abs(pair.a), Math.abs(pair.b)].sort((a, b) => a - b).join(":");
      groups.set(key, [...(groups.get(key) ?? []), pair]);
    });
    return [...groups.values()];
  }, [pairs]);
  const introduction = page === 0, discovery = page === 1 || page === 2, practice = page >= 3 && page <= 7;

  const loadPage = useCallback((next: number) => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    setPage(next); setProblem(next === 0 ? { p: 2, q: 3, b: 5, c: 6 } : next < 3 ? fixed[next - 1] : makeProblem(next));
    setAnswers(["", ""]); setInvalidAnswers([false, false]); setSlots([null, null]); setSelected(null); setStatus("idle"); setConstantEntry(""); setConstantUnlocked(false); setConstantWrong(false); setFactorHoverReady(false); setBonusOpen(false); setFactorsConfirmed(false); setReasoningAnswers(["", ""]); setInvalidReasoning([false, false]);
  }, []);
  const newRound = useCallback(() => {
    setProblem(old => makeProblem(page, old)); setAnswers(["", ""]); setInvalidAnswers([false, false]); setStatus("idle"); setSelected(null); setConstantEntry(""); setConstantUnlocked(false); setConstantWrong(false); setFactorHoverReady(false); setBonusOpen(false); setFactorsConfirmed(false); setReasoningAnswers(["", ""]); setInvalidReasoning([false, false]);
  }, [page]);
  const celebrate = useCallback(() => {
    setInvalidAnswers([false, false]);
    setBonusOpen(false);
    setStatus("correct");
  }, []);
  const wrong = useCallback(() => {
    setStatus("wrong"); setShakeKey(k => k + 1);
    if (discovery) resetTimer.current = setTimeout(() => { setSlots([null, null]); setSelected(null); setStatus("idle"); }, 850);
  }, [discovery]);
  const evaluateNumbers = useCallback((a: number, b: number) => a * b === problem.c && a + b === problem.b, [problem]);
  const place = useCallback((value: number, index: number) => {
    if (!discovery || status === "correct" || factorsConfirmed) return;
    const next: [number | null, number | null] = [...slots]; next[index] = value; setSlots(next); setSelected(null);
  }, [discovery, factorsConfirmed, slots, status]);
  const tapTile = (value: number) => {
    if (!discovery || status === "correct" || factorsConfirmed) return;
    const empty = slots.findIndex(v => v === null);
    if (selected === value && empty >= 0) place(value, empty); else setSelected(value);
  };
  const drop = (e: DragEvent, index: number) => { e.preventDefault(); const value = Number(e.dataTransfer.getData("text/plain")); if (Number.isInteger(value)) place(value, index); };
  const checkTyped = useCallback(() => {
    if (!practice || status === "correct") return;
    const a = Number(answers[0]), b = Number(answers[1]);
    if (Number.isInteger(a) && Number.isInteger(b) && evaluateNumbers(a, b)) { celebrate(); return; }
    const targets = [problem.p, problem.q], used = [false, false];
    const correct = [a, b].map(value => {
      if (!Number.isInteger(value)) return false;
      const match = targets.findIndex((target, i) => !used[i] && target === value);
      if (match < 0) return false;
      used[match] = true;
      return true;
    }) as [boolean, boolean];
    setInvalidAnswers([!correct[0], !correct[1]]);
    wrong();
  }, [answers, celebrate, evaluateNumbers, practice, problem, status, wrong]);
  const checkDiscovery = useCallback(() => {
    if (status === "correct" || factorsConfirmed || slots[0] === null || slots[1] === null) return;
    if (evaluateNumbers(slots[0], slots[1])) { setFactorsConfirmed(true); setStatus("idle"); }
    else wrong();
  }, [evaluateNumbers, factorsConfirmed, slots, status, wrong]);
  const checkReasoning = useCallback(() => {
    if (!factorsConfirmed || status === "correct") return;
    const addCorrect = Number(reasoningAnswers[1]) === problem.b;
    setInvalidReasoning([false, !addCorrect]);
    if (addCorrect) celebrate();
    else { setStatus("wrong"); setShakeKey(k => k + 1); }
  }, [celebrate, factorsConfirmed, problem, reasoningAnswers, status]);
  const checkConstant = useCallback(() => {
    const value = Number(constantEntry);
    if (Number.isInteger(value) && value === problem.c) { setConstantUnlocked(true); setConstantWrong(false); setFactorHoverReady(false); }
    else { setConstantWrong(true); setShakeKey(k => k + 1); }
  }, [constantEntry, problem.c]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      if (status === "correct") { if (page < 3) loadPage(page + 1); }
      else if (discovery && factorsConfirmed) checkReasoning();
      else if (discovery) checkDiscovery();
      else if (practice) { if (constantUnlocked) checkTyped(); else checkConstant(); }
    };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [checkConstant, checkDiscovery, checkReasoning, checkTyped, constantUnlocked, discovery, factorsConfirmed, loadPage, page, practice, status]);
  useEffect(() => () => { if (resetTimer.current) clearTimeout(resetTimer.current); }, []);

  const typedInput = (index: 0 | 1) => <input
    disabled={!constantUnlocked}
    readOnly={status === "correct"}
    tabIndex={status === "correct" ? -1 : 0}
    className={`factor-input ${answers[index] && answers[index] !== "-" ? "filled" : ""} ${invalidAnswers[index] ? "striped" : ""}`}
    style={answers[index] && answers[index] !== "-" ? { width: `${Math.max(2.5, formattedEntry(answers[index]).length - .35)}ch` } : undefined}
    value={formattedEntry(answers[index])}
    onChange={e => { const next: [string, string] = [...answers]; next[index] = cleanEntry(e.target.value); setAnswers(next); if (invalidAnswers[index]) { const invalid: [boolean, boolean] = [...invalidAnswers]; invalid[index] = false; setInvalidAnswers(invalid); } }}
    onFocus={e => e.currentTarget.select()}
    inputMode="numeric"
    aria-label={`${index === 0 ? "First" : "Second"} signed factor number`}
  />;

  const equation = <div className="main-equation" aria-label={`y equals x squared ${problem.b < 0 ? "minus" : "plus"} ${Math.abs(problem.b)} x ${problem.c < 0 ? "minus" : "plus"} ${Math.abs(problem.c)}`}>
    <span className="standard-prefix">y =</span><span className={`form-group standard-form-group ${bonusOpen ? "bonus-labeled" : ""}`}><span className="standard-side"><span>x²</span><span className="coefficient">{middle(problem.b)}</span><span className="coefficient">{constant(problem.c)}</span></span>{bonusOpen && <span className="form-label">standard form</span>}</span>
    <span className="equation-equals">=</span>
    <span className={`form-group factored-form-group ${bonusOpen ? "bonus-labeled" : ""}`}><span className="factored-side">{discovery ? <><span>(x</span><button disabled={factorsConfirmed} className={`drop-slot ${slots[0] !== null ? "filled" : ""} ${status === "wrong" && !factorsConfirmed ? "striped" : ""}`} onDragOver={e => e.preventDefault()} onDrop={e => drop(e, 0)} onClick={() => selected !== null && place(selected, 0)}>{formattedSlot(slots[0])}</button><span>)</span><span className="factor-break">(x</span><button disabled={factorsConfirmed} className={`drop-slot ${slots[1] !== null ? "filled" : ""} ${status === "wrong" && !factorsConfirmed ? "striped" : ""}`} onDragOver={e => e.preventDefault()} onDrop={e => drop(e, 1)} onClick={() => selected !== null && place(selected, 1)}>{formattedSlot(slots[1])}</button><span>)</span></> : <><span>(x</span>{typedInput(0)}<span>)</span><span className="factor-break">(x</span>{typedInput(1)}<span>)</span></>}</span>{bonusOpen && <span className="form-label">factored form</span>}</span>
  </div>;

  return <main className={`app-shell ${status === "correct" ? "celebrate" : ""}`}>
    <header className="app-header"><div className="title-group"><h1>Quadratic Functions: Standard Form to Factored Form</h1><p><strong>{pages[page]}:</strong> {subtitles[page]}.</p></div>
      <nav className="open-pill" aria-label="Practice pages">{pages.map((name, i) => <button key={`${name}-${i}`} className={i === page ? "current" : ""} onClick={() => loadPage(i)} data-tip={name} aria-label={`Page ${i + 1}: ${name}`}>{i + 1}</button>)}</nav>
    </header>
    <section key={shakeKey} className={`workspace ${status === "wrong" || constantWrong ? "workspace-incorrect" : ""}`} onAnimationEnd={() => { if (!discovery && status === "wrong") setStatus("idle"); }}>
      {(introduction || status === "correct") && <button className={`bonus-button ${bonusOpen ? "active" : ""}`} onClick={() => setBonusOpen(v => !v)}>Bonus Knowledge</button>}
      {practice && status !== "correct" && <button className="choose-problem-button" onClick={newRound}>Choose Another Problem</button>}
      {introduction ? <IntroductionPage bonusOpen={bonusOpen} onContinue={() => loadPage(1)}/> : <div className="lesson">
        <section className="equation-card">{equation}</section>
        <section className="pairs-section">{discovery || constantUnlocked ? <p>These are all the number pairs that multiply to <strong>{problem.c}</strong>.</p> : <p className="factor-request">What number do you want to see the factors of? <input className={`constant-input ${constantWrong ? "striped" : ""}`} value={constantEntry} onChange={e => setConstantEntry(e.target.value)} inputMode="numeric" aria-label="Number whose factors should be shown"/></p>}
          {(discovery || constantUnlocked) && <><div className={`pair-grid ${discovery || factorHoverReady ? "hover-ready" : "revealing"}`} onPointerMove={() => { if (!discovery && !factorHoverReady) setFactorHoverReady(true); }}>{pairGroups.map((group, i) => <div className="pair-column" key={i}>{group.map(pair => <FactorPair key={pair.id} pair={pair} draggable={discovery} hideSum={page === 7} selected={selected} onTile={discovery ? tapTile : undefined} onDrag={discovery ? (e, n) => { e.dataTransfer.setData("text/plain", String(n)); e.dataTransfer.effectAllowed = "copy"; } : undefined}/>)}</div>)}</div>
          {!factorsConfirmed && <p className="pair-question">Which pair of numbers belongs in the equation?</p>}
          {discovery && factorsConfirmed && <div className={`reasoning-card ${status === "correct" ? "reasoning-complete" : ""}`}>
            <p>Why do these two numbers work?</p>
            <div className="reasoning-sentence"><span>They multiply to</span><input readOnly className="reasoning-given" value={problem.c} inputMode="numeric" aria-label="The product of the two factors, provided"/><span>and add to</span><input readOnly={status === "correct"} className={invalidReasoning[1] ? "striped" : ""} value={reasoningAnswers[1]} onChange={e => { setReasoningAnswers([reasoningAnswers[0], cleanEntry(e.target.value)]); if (invalidReasoning[1]) setInvalidReasoning([false, false]); }} inputMode="numeric" aria-label="The sum of the two factors"/><span>.</span></div>
          </div>}</>}
        </section>
        <section className="response-area" aria-live="polite" aria-label={status === "wrong" ? "Answer needs correction" : undefined}/>
        <div className="action-cluster"><div className="actions">
          {status !== "correct" && discovery && <button className="primary" onClick={factorsConfirmed ? checkReasoning : checkDiscovery}>{factorsConfirmed ? "Check My Reasoning" : "Check"}</button>}
          {status !== "correct" && !discovery && <button className="primary" onClick={constantUnlocked ? checkTyped : checkConstant}>Check</button>}
          {status === "correct" && discovery && <button className="success" onClick={() => loadPage(page + 1)}>Correct — Next Problem</button>}
          {status === "correct" && practice && <><button className="correct-button" disabled>Correct!</button><div className="new-round-stack"><p className="practice-note">Practice here as long as you want.</p><button className="primary" onClick={newRound}>New Round</button></div>{page < 7 && <button className="secondary next-page" onClick={() => loadPage(page + 1)}>Next Page</button>}</>}
        </div></div>
      </div>}
    </section>
  </main>;
}

function IntroductionPage({ bonusOpen, onContinue }: { bonusOpen: boolean; onContinue: () => void }) {
  return <div className="introduction-page">
    <h2><strong>Goal:</strong> Convert a quadratic function from standard form to factored form.</h2>
    <div className="intro-card">
      <div className="intro-example" aria-label="y equals x squared plus 5 x plus 6 becomes y equals the quantity x plus 2 times the quantity x plus 3">
        <span className="intro-side"><span className="standard-prefix">y =</span><span className={`form-group standard-form-group ${bonusOpen ? "bonus-labeled" : ""}`}><span className="standard-side">x² + 5x + 6</span>{bonusOpen && <span className="form-label">standard form</span>}</span></span>
        <span className="intro-arrow">→</span>
        <span className="intro-side"><span className="standard-prefix">y =</span><span className={`form-group factored-form-group ${bonusOpen ? "bonus-labeled" : ""}`}><span className="factored-side">(x + 2)(x + 3)</span>{bonusOpen && <span className="form-label">factored form</span>}</span></span>
      </div>
    </div>
    <button className="primary intro-continue" onClick={onContinue}>Continue to Next Page</button>
  </div>;
}
