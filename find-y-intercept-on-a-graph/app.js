const TOTAL = 10;
const NS = "http://www.w3.org/2000/svg";

const state = {
  index: 0,
  problem: makeProblem(),
  answer: "",
  correct: false,
  incorrect: false,
  bonus: false,
  history: [],
  reviewIndex: null,
  celebrating: false,
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeProblem() {
  const slopes = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5];
  return { m: slopes[randomInt(0, slopes.length - 1)], b: randomInt(-9, 9) };
}

function differentProblem(current) {
  let next = makeProblem();
  while (next.m === current.m && next.b === current.b) next = makeProblem();
  return next;
}

function shownProblem() {
  return state.reviewIndex === null ? state.problem : state.history[state.reviewIndex].problem;
}

function isReviewing() {
  return state.reviewIndex !== null;
}

function formatNumber(value) {
  return Object.is(value, -0) ? "0" : String(value);
}

function lineSegment({ m, b }) {
  const candidates = [];
  const add = (x, y) => {
    if (x >= -10 - 1e-8 && x <= 10 + 1e-8 && y >= -10 - 1e-8 && y <= 10 + 1e-8 &&
        !candidates.some((p) => Math.abs(p.x - x) < 1e-7 && Math.abs(p.y - y) < 1e-7)) {
      candidates.push({ x, y });
    }
  };
  add(-10, -10 * m + b);
  add(10, 10 * m + b);
  add((-10 - b) / m, -10);
  add((10 - b) / m, 10);
  return candidates.slice(0, 2);
}

function arrowPolygon(from, to, gx, gy) {
  const x = gx(to.x), y = gy(to.y);
  const dx = x - gx(from.x), dy = y - gy(from.y);
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length, uy = dy / length;
  const baseX = x - ux * 14, baseY = y - uy * 14;
  const px = -uy * 7, py = ux * 7;
  return `${x},${y} ${baseX + px},${baseY + py} ${baseX - px},${baseY - py}`;
}

function graphMarkup(problem, reveal) {
  const size = 600, pad = 44, plot = size - pad * 2;
  const gx = (x) => pad + ((x + 10) / 20) * plot;
  const gy = (y) => size - pad - ((y + 10) / 20) * plot;
  const segment = lineSegment(problem);
  const grid = Array.from({ length: 21 }, (_, i) => i - 10).map((v) => {
    const vertical = `<line x1="${gx(v)}" y1="${pad}" x2="${gx(v)}" y2="${size-pad}" class="${v === 0 ? "axis" : "grid-line"}"/>`;
    const horizontal = `<line x1="${pad}" y1="${gy(v)}" x2="${size-pad}" y2="${gy(v)}" class="${v === 0 ? "axis" : "grid-line"}"/>`;
    if (v === 0) return vertical + horizontal;
    return vertical + horizontal +
      `<text x="${gx(v)}" y="${gy(0) + 18}" text-anchor="middle">${v}</text>` +
      `<text x="${gx(0) - 9}" y="${gy(v) + 4}" text-anchor="end">${v}</text>`;
  }).join("");
  const glowClass = reveal ? "intercept-glow revealed" : "intercept-glow";
  return `<svg viewBox="0 0 600 600" role="img" aria-label="Coordinate graph of a line">
    <defs><clipPath id="plot-clip"><rect x="44" y="44" width="512" height="512" rx="1"/></clipPath></defs>
    ${grid}
    <g clip-path="url(#plot-clip)">
      <line x1="${gx(segment[0].x)}" y1="${gy(segment[0].y)}" x2="${gx(segment[1].x)}" y2="${gy(segment[1].y)}" class="linear-guide"/>
      <circle cx="${gx(0)}" cy="${gy(problem.b)}" r="8" class="${glowClass}"/>
    </g>
    <g class="line-arrows">
      <polygon points="${arrowPolygon(segment[1], segment[0], gx, gy)}"/>
      <polygon points="${arrowPolygon(segment[0], segment[1], gx, gy)}"/>
    </g>
    ${reveal ? `<circle cx="${gx(0)}" cy="${gy(problem.b)}" r="5.5" class="intercept-dot"/><text x="${gx(0)+13}" y="${gy(problem.b)-13}" class="coord">(0, ${formatNumber(problem.b)})</text>` : ""}
  </svg>`;
}

function arrow(direction) {
  return `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="${direction === "left" ? "M12.5 4.5 7 10l5.5 5.5" : "m7.5 4.5 5.5 5.5-5.5 5.5"}"/></svg>`;
}

function equationMarkup(problem) {
  const bPart = problem.b === 0
    ? ` + <span class="b-flash">0</span>`
    : problem.b < 0
      ? ` − <span class="b-flash">${Math.abs(problem.b)}</span>`
      : ` + <span class="b-flash">${problem.b}</span>`;
  const message = problem.b === 0
    ? "When the y-intercept is 0, +0 becomes invisible when the equation is simplified."
    : problem.b < 0
      ? "When the y-intercept is negative, write subtraction instead of plus a negative."
      : "The y-intercept is the value of b in y = mx + b.";
  return `<div class="bonus-card">
    <div class="bonus-title">BONUS KNOWLEDGE</div>
    <div class="bonus-copy">The y-intercept goes here.</div>
    <div class="equation">y = <span class="slope-value">${formatNumber(problem.m)}</span>x${bPart}</div>
    <p>${message}</p>
  </div>`;
}

function renderCelebration() {
  document.body.className = "celebrating";
  document.querySelector("#root").innerHTML = `<main class="celebration">
    <section class="celebration-card" aria-live="polite">
      <div class="checkmark" aria-hidden="true">✓</div>
      <p class="eyebrow">Ten y-intercepts complete</p>
      <h1>Y-Intercept Practice Complete</h1>
      <p class="celebration-copy">You found where ten lines cross the y-axis.</p>
      <div class="completion-row" aria-label="Ten completed problems">${Array.from({ length: TOTAL }, (_, i) => `<div class="completion-chip" style="animation-delay:${i*90}ms"><span>✓</span>${i+1}</div>`).join("")}</div>
      <div class="celebration-actions"><button class="secondary large" data-action="review-last">Review My Work</button><button class="primary large" data-action="practice-again">Practice Again</button></div>
    </section>
  </main>`;
}

function render() {
  if (state.celebrating) return renderCelebration();
  document.body.className = state.correct && !isReviewing() ? "correct-background" : "";
  const problem = shownProblem();
  const reviewing = isReviewing();
  const revealed = state.correct || reviewing;
  const position = reviewing ? state.reviewIndex + 1 : state.index + 1;
  const leftDisabled = (state.reviewIndex ?? state.history.length) <= 0;
  const answerValue = reviewing ? formatNumber(problem.b) : state.answer;
  document.querySelector("#root").innerHTML = `<main class="app-shell">
    <header class="app-header">
      <div class="title-group"><h1>Finding the Y-Intercept from a Graph</h1><p><strong>Find the y-intercept.</strong> Enter the y-value where the line crosses the y-axis.</p></div>
      <div class="header-slot"><div class="nav-pill">
        <button data-action="previous" aria-label="Previous problem" ${leftDisabled ? "disabled" : ""}>${arrow("left")}</button>
        <span>${position} of ${TOTAL}</span>
        <button data-action="next-review" aria-label="${reviewing && state.reviewIndex === state.history.length - 1 ? state.history.length === TOTAL ? "Return to celebration" : "Return to current problem" : "Next problem"}" ${reviewing ? "" : "disabled"}>${arrow("right")}</button>
      </div></div>
    </header>
    <section class="workspace activity ${state.incorrect && !state.correct ? "workspace-incorrect" : ""}">
      <div class="graph-side">
        <button class="new-round" data-action="new-round" ${revealed ? "disabled" : ""}>New Round</button>
        <div class="graph-window">${graphMarkup(problem, revealed)}</div>
      </div>
      <div class="right-side">
        <div class="solution-card">
          <div class="card-heading">FIND THE Y-INTERCEPT</div>
          <div class="answer-line"><span>b =</span><input value="${answerValue}" ${revealed ? "disabled" : ""} aria-label="y-intercept" inputmode="numeric" class="${state.incorrect && !state.correct ? "answer-incorrect" : revealed ? "answer-correct" : ""}" /></div>
          <div class="meaning">The y-intercept is where the line crosses the y-axis.</div>
        </div>
        <div class="button-row">
          ${!reviewing && !state.correct ? `<button class="check-button" data-action="check">Check</button>` : ""}
          ${revealed ? `<button class="bonus-button ${state.bonus ? "active" : ""}" data-action="bonus">Bonus Knowledge</button>${!reviewing ? `<button class="next-button" data-action="next">${state.index === TOTAL - 1 ? "Correct — See Celebration" : "Correct — Next Problem"}</button>` : ""}` : ""}
        </div>
        ${state.bonus ? equationMarkup(problem) : ""}
      </div>
    </section>
  </main>`;
  const input = document.querySelector("input");
  if (input && !revealed) {
    input.addEventListener("input", (event) => { state.answer = event.target.value; state.incorrect = false; });
    requestAnimationFrame(() => input.focus());
  }
}

function check() {
  if (state.correct || isReviewing() || !state.answer.trim()) return;
  const value = Number(state.answer.replace(/−/g, "-"));
  if (Number.isFinite(value) && value === state.problem.b) {
    state.correct = true;
    state.incorrect = false;
    state.history.push({ problem: state.problem, answer: value });
  } else {
    state.incorrect = false;
    render();
    requestAnimationFrame(() => { state.incorrect = true; render(); document.querySelector("input")?.select(); });
    return;
  }
  render();
}

function nextProblem() {
  if (!state.correct) return;
  if (state.index === TOTAL - 1) { state.celebrating = true; state.reviewIndex = null; render(); return; }
  state.index += 1;
  state.problem = makeProblem();
  state.answer = "";
  state.correct = false;
  state.incorrect = false;
  state.bonus = false;
  render();
}

function resetPractice() {
  Object.assign(state, { index: 0, problem: makeProblem(), answer: "", correct: false, incorrect: false, bonus: false, history: [], reviewIndex: null, celebrating: false });
  render();
}

function navigateReview(delta) {
  const start = state.reviewIndex ?? state.history.length;
  const target = start + delta;
  if (target === state.history.length && state.history.length === TOTAL && state.reviewIndex !== null) { state.celebrating = true; state.reviewIndex = null; render(); return; }
  if (target === state.history.length) state.reviewIndex = null;
  else if (target >= 0 && target < state.history.length) state.reviewIndex = target;
  state.bonus = false;
  render();
}

document.addEventListener("click", (event) => {
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (!action) return;
  if (action === "check") check();
  if (action === "next") nextProblem();
  if (action === "new-round") { state.problem = differentProblem(state.problem); state.answer = ""; state.incorrect = false; state.bonus = false; render(); }
  if (action === "bonus") { state.bonus = !state.bonus; render(); }
  if (action === "previous") navigateReview(-1);
  if (action === "next-review") navigateReview(1);
  if (action === "review-last") { state.celebrating = false; state.reviewIndex = state.history.length - 1; state.bonus = false; render(); }
  if (action === "practice-again") resetPractice();
});

window.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || event.repeat || state.celebrating || isReviewing() || event.target?.tagName === "BUTTON") return;
  event.preventDefault();
  state.correct ? nextProblem() : check();
});

render();
