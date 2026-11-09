(function(root){
const blue='#2474e5',teal='#138479',orange='#dc7b15',red='#bd3c50';
const lessons=[
 {name:'Growing stairs',kind:'add',b:2,shape:'stairs'},
 {name:'Three rows',kind:'multiply',m:3},
 {name:'Flag',kind:'combined',m:2,b:1},
 {name:'Longer rows and one',kind:'quantity',m:2,d:1,b:1},
 {name:'Stone arch',kind:'custom',visual:'arch',m:2,b:3,practice:true},
 {name:'Growing U',kind:'custom',visual:'u',m:3,b:2,practice:true},
 {name:'Square frame',kind:'custom',visual:'frame',m:4,b:4,practice:true},
 {name:'Three towers',kind:'custom',visual:'towers',m:3,b:2,practice:true},
 {name:'Tile train',kind:'custom',visual:'train',m:5,b:1,practice:true},
 {name:'Long rails and a cap',kind:'quantity',visual:'rails',m:2,d:1,b:3,practice:true},
 {name:'Two wings and a post',kind:'additive',visual:'wings',m:2,subtract:1,b:5,practice:true}
];
function steps(l){if(l.subtract)return [{label:'F',color:blue},{label:'F + (F − 1)',color:teal},{label:'+ 5',color:orange}];let a=[{label:'F',color:blue,prompt:'Click F.'}];if(l.d)a.push({label:`F ${l.d>0?'+':'−'} 1`,color:l.d>0?teal:red,prompt:`Click F ${l.d>0?'+':'−'} 1.`});if(l.m)a.push({label:l.d?`${l.m}(F ${l.d>0?'+':'−'} 1)`:`${l.m}F`,color:blue,prompt:`Click ${l.m}.`});if(l.b)a.push({label:`+ ${l.b}`,color:orange,prompt:`Click +${l.b}.`});return a;}
function equation(l){if(l.subtract)return 'T = F + (F − 1) + 5';return `T = ${l.m||''}${l.d?`(F ${l.d>0?'+':'−'} 1)`:'F'}${l.b?` + ${l.b}`:''}`;}
function simplifiedEquation(l){const m=l.m||1,b=m*(l.d||0)+(l.b||0)-(l.subtract||0);return `T = ${m===1?'':m}F${b?' '+(b>0?'+':'−')+' '+Math.abs(b):''}`;}
function total(l,f){if(l.subtract)return f+f-l.subtract+l.b;return (l.m||1)*(f+(l.d||0))+(l.b||0);}
function tiles(l,f){let a=[];const add=(x,y,reveal,color=blue,ghost=false,remove=0)=>a.push({x,y,reveal,color,ghost,remove});
 if(l.visual){
 const repeated=l.d?3:2,finish=steps(l).length;
 const group=(cells,first=false)=>cells.forEach(([x,y])=>add(x,y,first?1:repeated));
 if(l.visual==='arch'){
  group(Array.from({length:f},(_,i)=>[0,i+1]),true);group(Array.from({length:f},(_,i)=>[2,i+1]));
  for(let x=0;x<3;x++)add(x,0,finish,orange);
 }else if(l.visual==='u'){
  group(Array.from({length:f},(_,i)=>[i,0]),true);
  group(Array.from({length:f},(_,i)=>[-1,-i-1]));group(Array.from({length:f},(_,i)=>[f,-i-1]));
  add(-1,0,finish,orange);add(f,0,finish,orange);
 }else if(l.visual==='frame'){
  group(Array.from({length:f},(_,i)=>[i+1,0]),true);
  group(Array.from({length:f},(_,i)=>[i+1,f+1]));group(Array.from({length:f},(_,i)=>[0,i+1]));group(Array.from({length:f},(_,i)=>[f+1,i+1]));
  for(const [x,y] of [[0,0],[f+1,0],[0,f+1],[f+1,f+1]])add(x,y,finish,orange);
 }else if(l.visual==='towers'){
  for(let c=0;c<3;c++)group(Array.from({length:f},(_,i)=>[2*c,i]),c===0);
  add(1,f-1,finish,orange);add(3,f-1,finish,orange);
 }else if(l.visual==='train'){
  for(let i=0;i<f;i++){add(3*i,0,1);for(const [x,y] of [[3*i+1,0],[3*i,1],[3*i+1,1],[3*i+2,1]])add(x,y,repeated);}
  add(-1,1,finish,orange);
 }else if(l.visual==='rails'){
  for(let i=0;i<f;i++)add(i,0,1);add(f,0,2,teal);
  for(let i=0;i<=f;i++)add(i,2,repeated,i===f?teal:blue);
  for(let y=0;y<3;y++)add(f+1,y,finish,orange);
 }else if(l.visual==='wings'){
  for(let i=0;i<f;i++)add(i+1,-1,1);
  for(let i=0;i<f-1;i++)add(i+1,1,2,teal);
  for(let y=-2;y<=2;y++)add(0,y,finish,orange);
 }
 return a;
 }
 if(l.kind==='add'){for(let i=0;i<f;i++)add(i,l.shape==='stairs'?-i:0,1);for(let j=0;j<l.b;j++){if(l.shape==='stairs')add(f+j,-f-j,2,orange);else if(l.shape==='post')add(0,-j-1,2,orange);else add(0,-1,2,orange);}return a;}
 const qty=!!l.d,repeat=qty?3:2,adjust=steps(l).length;
 for(let r=0;r<l.m;r++){for(let i=0;i<f;i++){const removed=l.d===-1&&i===f-1;if(removed&&r>0)continue;add(i,l.m-1-r,r===0?1:repeat,blue,removed,removed?2:0);}if(l.d===1)add(f,l.m-1-r,r===0?2:repeat,teal);}
 for(let j=0;j<(l.b||0);j++) {if(l.d===-1)add(-1,j-3,adjust,orange);else add(j,-1,adjust,orange);}
 return a;}
function questions(l){
 if(l.subtract)return [
 {prompt:'What can you add to count the second row?',options:['Add F.','Add (F − 1).','Add 1.','Subtract 1.'],answer:1,stage:2},
 {prompt:'What counts the remaining tiles?',options:['Add 1.','Add 2.','Add 3.','Add 5.'],answer:3,stage:3}
 ];
 const additions=l.b===4?[1,2,4,5]:[1,2,3,5];
 const addQuestion=()=>({prompt:'What counts the remaining tiles?',options:additions.map(n=>`Add ${n}.`),answer:additions.indexOf(l.b),stage:steps(l).length});
 if(l.kind==='add')return [addQuestion()];
 const q=[];
 if(l.d)q.push({prompt:'How can you count one row using F?',options:['F + 1','F − 1','2F','F + 3'],answer:l.d>0?0:1,stage:2});
 q.push({prompt:l.d?'How many copies of that row?':l.visual?'What can you do to F to count the repeated groups?':'What can you do to F to count the full rows?',options:[2,3,4,5].map(n=>`Multiply by ${n}.`),answer:[2,3,4,5].indexOf(l.m),stage:l.d?3:2});
 if(l.b)q.push(addQuestion());
 return q;
}
function prediction(l){
 const figure=10,answer=total(l,figure),candidates=[answer,figure,l.m?figure+l.m:figure*2,l.m?l.m*figure:(l.b||1),l.b||1,answer+1,answer-1];
 const options=[...new Set(candidates)].slice(0,4);
 return {figure,prompt:`How many tiles would Figure ${figure} have?`,options:options.map(String),answer:0};
}
const api={lessons,steps,equation,total,tiles,questions,prediction,simplifiedEquation};if(typeof module!=='undefined')module.exports=api;root.PD=api;
})(typeof window==='undefined'?globalThis:window);
