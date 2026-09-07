"use client";

import {useEffect,useRef,useState} from "react";

type Dir="left"|"right";
type Page=0|1|2|3|4;
type Problem={a:number;op:"+"|"−";b:number};

const pages=["Positive second number — Watch It","Positive second number — You Drive","Negative second number — Watch It","Negative second number — You Drive","Mixed independent practice"];
const fmt=(n:number)=>n<0?`−${Math.abs(n)}`:String(n);
const answer=(p:Problem)=>p.op==="+"?p.a+p.b:p.a-p.b;
const initialDir=(p:Problem):Dir=>p.op==="+"?"right":"left";
const moveDir=(p:Problem):Dir=>p.b<0?(initialDir(p)==="right"?"left":"right"):initialDir(p);

function useful(p:Problem,page:Page){
  const result=answer(p);
  if(result < -12 || result > 12 || (p.a===0&&p.b===0)) return false;
  if(page<2){
    if(p.b<0) return false;
    if(p.op==="+"&&p.a>=0) return false;
    if(p.op==="−"&&p.a>=0&&result>0) return false;
  }
  if((page===2||page===3)&&p.b>=0) return false;
  if(page===4&&p.b>=0&&p.op==="+"&&p.a>=0) return false;
  if(page===4&&p.b>=0&&p.op==="−"&&p.a>=0&&result>0) return false;
  return true;
}

function generate(page:Page):Problem{
  for(;;){
    const p:Problem={a:Math.floor(Math.random()*25)-12,op:Math.random()<.5?"+":"−",b:page<2?Math.floor(Math.random()*13):page<4?-(Math.floor(Math.random()*12)+1):Math.floor(Math.random()*25)-12};
    if(useful(p,page)) return p;
  }
}

function Arrow({dir}:{dir:Dir}){
  return <svg className="button-arrow" viewBox="0 0 30 20" aria-hidden="true"><path d={dir==="left"?"M13 3 5 10l8 7M6 10h19":"m17 3 8 7-8 7M24 10H5"}/></svg>;
}

function Target({children}:{kind:string;active:boolean;children:React.ReactNode;note?:string}){
  return <span className="math-target">{children}</span>;
}

function Equation({p,focus,done,watch,practice,stage}:{p:Problem;focus:"start"|"operation"|"negative"|"magnitude"|null;done:boolean;watch:boolean;practice:boolean;stage:number}){
  const dim=watch&&focus!==null;
  const magnitudeFocus=dim&&focus==="magnitude";
  const isolateNegative=(dim&&focus==="negative")||(practice&&p.b<0&&stage===2);
  const progressing=practice&&!done;
  const startComplete=progressing&&stage>=1,operationComplete=progressing&&stage>=2,negativeComplete=progressing&&p.b<0&&stage>=3,magnitudeComplete=progressing&&stage>=(p.b<0?4:3);
  return <div className={`problem-card ${dim?"is-focused":""}`}>
    <div className="equation">
      <Target kind="start" active={watch&&focus==="start"} note="Start here"><span className={`${dim&&focus!=="start"?"dimmed":""} ${startComplete?"step-complete":""}`}>{fmt(p.a)}</span></Target>
      <Target kind="operation" active={watch&&focus==="operation"} note={`Go ${initialDir(p)}`}><span className={`${dim&&focus!=="operation"?"dimmed":""} ${operationComplete?"step-complete":""}`}>{p.op}</span></Target>
      <span className={`second ${dim&&focus!=="negative"&&focus!=="magnitude"?"dimmed":""}`}>
        {p.b<0?<><i className={`${magnitudeFocus||isolateNegative?"dimmed":""} ${negativeComplete?"step-complete":""}`}>(</i><Target kind="negative" active={watch&&focus==="negative"} note="Negative reverses direction"><span className={`${magnitudeFocus?"dimmed":""} ${negativeComplete&&!magnitudeFocus?"step-complete":""}`}>−</span></Target><Target kind="magnitude" active={watch&&focus==="magnitude"} note="This many spaces"><span className={`${isolateNegative?"dimmed":""} ${magnitudeComplete?"step-complete":""}`}>{Math.abs(p.b)}</span></Target><i className={`${magnitudeFocus||isolateNegative?"dimmed":""} ${negativeComplete?"step-complete":""}`}>)</i></>:<Target kind="magnitude" active={watch&&focus==="magnitude"} note="This many spaces"><span className={magnitudeComplete?"step-complete":""}>{p.b}</span></Target>}
      </span>
      <span className={dim?"dimmed":""}>=</span>
      <span className={`answer-box ${done?"answered":""}`}>{done?fmt(answer(p)):"?"}</span>
      <span className={`equation-check ${done?"show":""}`} aria-label={done?"Correct":undefined}>✓</span>
    </div>
  </div>;
}

function Sentence({p,parts,reversed=false}:{p:Problem;parts:number;reversed?:boolean}){
  return <div className="sentence-strip" aria-live="polite">
    {parts===0?<span className="sentence-placeholder">Build the movement sentence.</span>:<div className="sentence-copy">
      <span className="quote-mark">“</span>
      <span className="sentence-clause"><span>Start at</span><span className="key-part start-part">{fmt(p.a)}</span><span className="punctuation">.</span></span>
      {parts>=2&&<span className="sentence-clause"><span>Then go</span>{reversed?<><span className="key-part direction-part crossed-direction">{initialDir(p)}</span><span className="key-part direction-part reversal-word">{moveDir(p)}</span></>:<span className="key-part direction-part">{initialDir(p)}</span>}{parts>=3&&<><span className="key-part distance-part">{Math.abs(p.b)}</span><span>{Math.abs(p.b)===1?"space":"spaces"}</span><span className="punctuation">.</span></>}</span>}
      <span className="quote-mark">”</span>
    </div>}
  </div>;
}

function NumberLine({p,showStart,showHops,done}:{p:Problem;showStart:boolean;showHops:boolean;done:boolean}){
  const w=1140,pad=46,y=92,x=(n:number)=>pad+((n+12)/24)*(w-pad*2),d=moveDir(p)==="right"?1:-1,count=showHops?Math.abs(p.b):0;
  const end=answer(p),close=Math.abs(end-p.a)<=1;
  const startLabelX=x(p.a),landLabelX=x(end),startBadgeY=y+48,landBadgeY=y+(close?82:48);
  return <div className="line-slot"><svg className="number-line" viewBox="0 0 1140 220" role="img" aria-label="Number line from negative twelve to twelve">
    <defs><marker id="axisArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 8 4 0 8z"/></marker></defs>
    <line x1="28" y1={y} x2="1112" y2={y} className="axis"/>
    <line x1="34" y1={y} x2="18" y2={y} className="axis-end" markerEnd="url(#axisArrow)"/>
    <line x1="1106" y1={y} x2="1122" y2={y} className="axis-end" markerEnd="url(#axisArrow)"/>
    {Array.from({length:25},(_,i)=>i-12).map(n=><g key={n}><line x1={x(n)} y1={y-10} x2={x(n)} y2={y+10} className="tick"/><text x={x(n)} y={y+34}>{fmt(n)}</text></g>)}
    {showStart&&<circle className="start-dot" cx={x(p.a)} cy={y} r="6"/>}
    {Array.from({length:count},(_,i)=>{const x1=x(p.a+d*i),x2=x(p.a+d*(i+1));return <path key={i} d={`M ${x1} ${y-7} Q ${(x1+x2)/2} ${y-60} ${x2} ${y-7}`} className="hop" style={{animationDelay:`${i*.3}s`}}/>})}
    {done&&<circle className="land-dot" cx={x(end)} cy={y} r="6"/>}
    {showStart&&<><line className="start-leader" x1={x(p.a)} y1={y+8} x2={startLabelX} y2={startBadgeY}/><g className="start-badge"><rect x={startLabelX-30} y={startBadgeY} width="60" height="25" rx="8"/><text x={startLabelX} y={startBadgeY+17}>START</text></g></>}
    {done&&<><line className="land-leader" x1={x(end)} y1={y+8} x2={landLabelX} y2={landBadgeY}/><g className="land-badge"><rect x={landLabelX-28} y={landBadgeY} width="56" height="25" rx="8"/><text x={landLabelX} y={landBadgeY+17}>LAND</text></g></>}
  </svg></div>;
}

export default function App(){
  const[page,setPage]=useState<Page>(0);
  const[problem,setProblem]=useState<Problem>(()=>generate(0));
  const[stage,setStage]=useState(0);
  const[input,setInput]=useState("");
  const[wrong,setWrong]=useState(false);
  const[hops,setHops]=useState(false);
  const[done,setDone]=useState(false);
  const timers=useRef<number[]>([]);
  const watch=page===0||page===2,negative=page===2||page===3;

  const clearTimers=()=>{timers.current.forEach(window.clearTimeout);timers.current=[]};
  const later=(fn:()=>void,ms:number)=>timers.current.push(window.setTimeout(fn,ms));
  const restart=()=>{clearTimers();setStage(0);setInput("");setWrong(false);setHops(false);setDone(false)};
  const reset=(next:Page=page)=>{clearTimers();setProblem(generate(next));setStage(0);setInput("");setWrong(false);setHops(false);setDone(false)};
  const selectPage=(next:Page)=>{setPage(next);reset(next)};
  const fail=()=>{setWrong(false);requestAnimationFrame(()=>setWrong(true))};
  const continueWatch=()=>{
    const hopStage=negative?5:4;
    const finishStage=negative?6:5;
    if(stage<hopStage){setStage(stage+1);if(stage+1===hopStage)setHops(true);return}
    if(stage===hopStage){setStage(finishStage);setDone(true)}
  };
  const parse=()=>Number(input.replace("−","-").trim());
  const accept=()=>{setWrong(false);setInput("");setStage(s=>s+1)};
  const checkDrive=()=>{
    if(input.trim()==="") return fail();
    const expected=page===4?answer(problem):stage===0?problem.a:(!negative&&stage===2)||(negative&&stage===3)?Math.abs(problem.b):answer(problem);
    if(parse()!==expected) return fail();
    if(page===4){setStage(1);setInput("");later(()=>setStage(2),650);if(problem.b<0){later(()=>setStage(3),1300);later(()=>{setStage(4);setHops(true)},1950);later(()=>setDone(true),2450+Math.abs(problem.b)*300)}else{later(()=>{setStage(3);setHops(true)},1300);later(()=>setDone(true),1800+Math.abs(problem.b)*300)}return}
    const landing=(!negative&&stage===3)||(negative&&stage===4);
    if(landing){setDone(true);setWrong(false);return}
    accept();
    if((!negative&&stage===2)||(negative&&stage===3)) setHops(true);
  };
  const choose=(choice:string)=>{
    const expected=stage===1?initialDir(problem):"reverse";
    if(choice!==expected)return fail();
    accept();
  };
  useEffect(()=>()=>clearTimers(),[]);
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key!=="Enter")return;if(done){reset();return}if(input)checkDrive()};window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key)});

  let focus:null|"start"|"operation"|"negative"|"magnitude"=null;
  if(watch){if(stage===1)focus="start";if(stage===2)focus="operation";if(stage===3)focus=negative?"negative":"magnitude";if(negative&&stage===4)focus="magnitude"}
  const showStart=watch?stage>=1:page===4?stage>=1:stage>=1;
  const sentenceParts=page===0?Math.min(stage,3):page===2?(stage>=4?3:stage>=2?2:stage>=1?1:0):page===1?Math.min(stage,3):page===3?(stage>=4?3:stage>=2?2:stage>=1?1:0):problem.b<0?(stage>=4?3:stage>=2?2:stage>=1?1:0):Math.min(stage,3);
  const sentenceReversed=(page===2&&stage>=3)||(page===3&&stage>=3)||(page===4&&problem.b<0&&stage>=3);
  const directionText=page===0?"Watch three ideas connect the equation to the number line.":page===1?"Make three decisions, then name the landing point.":page===2?"Watch how a negative second number reverses the movement.":page===3?"Use the negative sign to reverse the direction.":"Solve first, then watch the movement replay.";

  const driveQuestion=()=>{
    if(page===4)return <Question title="Where did we land?" input={input} setInput={setInput} wrong={wrong} check={checkDrive}/>;
    if(stage===0)return <Question step={`1 OF ${negative?4:3}`} title="Where do we start?" input={input} setInput={setInput} wrong={wrong} check={checkDrive}/>;
    if(stage===1)return <ChoiceQuestion step={`2 OF ${negative?4:3}`} title="Which way does the operation tell us to go?" wrong={wrong} choices={["left","right"]} choose={choose}/>;
    if(negative&&stage===2)return <ChoiceQuestion step="3 OF 4" title="What does the negative sign tell us to do?" wrong={wrong} choices={["keep going","reverse"]} choose={choose}/>;
    if((!negative&&stage===2)||(negative&&stage===3))return <Question step={`${negative?4:3} OF ${negative?4:3}`} title="How many spaces do we move?" input={input} setInput={setInput} wrong={wrong} check={checkDrive}/>;
    return <Question title="Where did we land?" input={input} setInput={setInput} wrong={wrong} check={checkDrive}/>;
  };

  return <main className={`page ${done?"correct":""}`}><div className="app-shell">
    <header><div><h1>Adding and Subtracting Integers Using a Number Line</h1><p>{directionText}</p></div><nav className="page-pill" aria-label="Activity pages">{pages.map((label,i)=><button key={label} aria-label={label} title={label} className={page===i?"active":""} onClick={()=>selectPage(i as Page)}>{i+1}</button>)}</nav></header>
    <section className={`workspace ${(page===1||page===3)?"practice-layout":""} ${done?"completed-layout":""} ${wrong?"workspace-incorrect":""}`} onAnimationEnd={()=>setWrong(false)}>
      <div className="utility-buttons"><button className="restart-button" onClick={restart}>Restart Problem</button>{!done&&<button className="quick-new-button" onClick={()=>reset()}>New Problem</button>}</div>
      <NumberLine p={problem} showStart={showStart} showHops={hops} done={done}/>
      <Equation p={problem} focus={done?null:focus} done={done} watch={watch} practice={page===1||page===3} stage={stage}/>
      <Sentence p={problem} parts={sentenceParts} reversed={sentenceReversed}/>
      <div className="control-slot">
        {done?<button className="primary new-problem" onClick={()=>reset()}>New Problem</button>:watch?<button className="primary continue" onClick={continueWatch}>{stage===0?"Begin":"Continue"}<Arrow dir="right"/></button>:driveQuestion()}
      </div>
    </section>
  </div></main>;
}

function Question({step,title,input,setInput,wrong,check}:{step?:string;title:string;input:string;setInput:(v:string)=>void;wrong:boolean;check:()=>void}){
  return <div className="question-card">{step&&<small>STEP {step}</small>}<h2>{title}</h2><div className="response-row"><input className={wrong?"answer-incorrect":""} value={input} onChange={e=>setInput(e.target.value)} inputMode="numeric" autoFocus aria-label="Integer answer"/><button className="primary" onClick={check}>Check</button></div></div>;
}
function ChoiceQuestion({step,title,wrong,choices,choose}:{step:string;title:string;wrong:boolean;choices:string[];choose:(v:string)=>void}){
  return <div className="question-card"><small>STEP {step}</small><h2>{title}</h2><div className="response-row choices">{choices.map(choice=><button key={choice} className={wrong?"answer-incorrect":""} onClick={()=>choose(choice)}>{choice==="left"&&<Arrow dir="left"/>}{choice.toUpperCase()}{choice==="right"&&<Arrow dir="right"/>}</button>)}</div></div>;
}
