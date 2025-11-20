// Button-driven questionnaire runner (mobile-first)
// Replace existing app.js with this file

const QUESTIONNAIRES = {
  mental: {
    title: "Quick Mental Health Check",
    questions: [
      {id:"m1",text:"Little interest or pleasure in doing things?",type:"scale",labels:["Not at all","Several days","More than half","Nearly every day"],weight:1},
      {id:"m2",text:"Feeling down, depressed, or hopeless?",type:"scale",weight:1},
      {id:"m3",text:"Feeling nervous, anxious, or on edge?",type:"scale",weight:1},
      {id:"m4",text:"Trouble relaxing or stopping worrying?",type:"scale",weight:1},
      {id:"m5",text:"Have you had thoughts you'd be better off dead or of hurting yourself?",type:"yesno",redFlag:true}
    ]
  },
  feminine: {
    title:"Feminine Health Snapshot",
    questions:[
      {id:"f1",text:"Are your periods regular (~25-35 days)?",type:"mcq",options:["Yes","No","Not sure"],weight:0},
      {id:"f2",text:"How painful are your periods on average?",type:"scale",labels:["None","Mild","Moderate","Severe"],weight:2},
      {id:"f3",text:"Do you experience heavy bleeding (soak pad/hr)?",type:"yesno",weight:2}
    ]
  },
  student: {
    title:"Student Wellbeing Check",
    questions:[
      {id:"s1",text:"How often do you feel overwhelmed by studies?",type:"scale",labels:["Never","Sometimes","Often","Always"],weight:1},
      {id:"s2",text:"How many hours of sleep do you get on average?",type:"mcq",options:["<5","5-6","6-8",">8"],weight_map:{"<5":3,"5-6":2,"6-8":1,">8":0}},
      {id:"s3",text:"Do you skip meals or have disordered eating behaviours?",type:"yesno",weight:2,redFlag:true}
    ]
  }
};

const chatEl = document.getElementById('chat');
const form = document.getElementById('replyForm');
const input = document.getElementById('replyInput'); // we will hide it visually
const reportArea = document.getElementById('reportArea');
const reportEl = document.getElementById('report');
const downloadPdf = document.getElementById('downloadPdf');
const restartBtn = document.getElementById('restart');

let active = 'mental';
let qIndex = 0;
let answers = [];
let currentQ = null;

// attach tab buttons
document.querySelectorAll('.tab-btn').forEach(b=>{
  b.addEventListener('click', ()=> {
    document.querySelectorAll('.tab-btn').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    active = b.dataset.tab;
    startSession();
  });
});

// hide the text input (we keep it for accessibility but visually hide)
input.style.display = 'none';

function startSession(){
  qIndex = 0; answers = []; reportArea.hidden = true;
  chatEl.innerHTML = '';
  pushAI(`Starting: ${QUESTIONNAIRES[active].title}`);
  setTimeout(()=> sendNext(), 450);
}

function sendNext(){
  const qlist = QUESTIONNAIRES[active].questions;
  if(qIndex >= qlist.length){
    finishSession(); return;
  }
  currentQ = qlist[qIndex++];
  renderQuestion(currentQ);
}

function renderQuestion(q){
  pushAI(q.text);
  // remove any existing choices area
  const existing = document.getElementById('choices');
  if(existing) existing.remove();

  const choices = document.createElement('div');
  choices.id = 'choices';
  choices.className = 'choices';

  if(q.type === 'scale'){
    // render labels as buttons (0..n)
    const labels = q.labels || ["0","1","2","3"];
    labels.forEach((lab, idx) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = `${idx} — ${lab}`;
      btn.addEventListener('click', ()=> answerPressed(idx));
      choices.appendChild(btn);
    });
  } else if(q.type === 'mcq'){
    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = opt;
      btn.addEventListener('click', ()=> answerPressed(opt));
      choices.appendChild(btn);
    });
  } else if(q.type === 'yesno'){
    ['Yes','No'].forEach(text=>{
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = text;
      btn.addEventListener('click', ()=> answerPressed(text));
      choices.appendChild(btn);
    });
  } else {
    // fallback to continue
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = 'Continue';
    btn.addEventListener('click', ()=> answerPressed(''));
    choices.appendChild(btn);
  }

  chatEl.appendChild(choices);
  chatEl.scrollTop = chatEl.scrollHeight;
}

function pushAI(txt){ const d = document.createElement('div'); d.className='msg ai'; d.textContent=txt; chatEl.appendChild(d); chatEl.scrollTop = chatEl.scrollHeight; }
function pushUser(txt){ const d = document.createElement('div'); d.className='msg user'; d.textContent=txt; chatEl.appendChild(d); chatEl.scrollTop = chatEl.scrollHeight; }

function answerPressed(val){
  // normalize
  const q = currentQ;
  if(q.type === 'yesno'){
    const yes = /^y(es)?$/i.test(val);
    answers.push({id:q.id, value: yes ? 1 : 0});
    pushUser(val);
    if(q.redFlag && yes){ showRedFlag(); return; }
  } else if(q.type === 'mcq'){
    let mapped = 0;
    if(q.weight_map) mapped = q.weight_map[val] ?? 0;
    else mapped = q.options.indexOf(val) >= 0 ? q.options.indexOf(val) : 0;
    answers.push({id:q.id, value: mapped});
    pushUser(val);
  } else if(q.type === 'scale'){
    const num = Number(val);
    answers.push({id:q.id, value: num});
    pushUser(`${num} — ${ (q.labels && q.labels[num]) ? q.labels[num] : '' }`);
  } else {
    answers.push({id:q.id, value: val});
    pushUser(val);
  }
  // cleanup choices UI
  const existing = document.getElementById('choices');
  if(existing) existing.remove();
  setTimeout(()=> sendNext(), 300);
}

function showRedFlag(){
  pushAI("Because of your answer, please see emergency resources immediately.");
  reportArea.hidden = false;
  reportEl.innerHTML = `<strong>Red-flag detected</strong><p>Please contact local emergency services or a mental health professional now. If you are in immediate danger, call emergency services.</p>`;
}

function finishSession(){
  let score=0;
  for(const a of answers) score += (typeof a.value === 'number' ? a.value : 0);
  let label = 'Low';
  if(score>=6) label='High'; else if(score>=3) label='Moderate';
  pushAI(`All done — your quick score: ${score} (${label})`);
  reportArea.hidden = false;
  reportEl.innerHTML = `<p><strong>Score:</strong> ${score}</p><p><strong>Level:</strong> ${label}</p><h4>Recommendations</h4><ul><li>Self-care: rest, breathe, reach out to one trusted person.</li><li>If moderate or high: consider speaking with a counselor.</li></ul>`;
}

// PDF fallback
downloadPdf.addEventListener('click', ()=>{
  const w = window.open('', '_blank');
  w.document.write(`<html><head><title>Report</title></head><body>${reportEl.innerHTML}</body></html>`);
  w.document.close();
  w.print();
});

restartBtn.addEventListener('click', startSession);

startSession();
// consent wiring
const consentOverlay = document.getElementById('consentOverlay');
const consentAccept = document.getElementById('consentAccept');
const consentDecline = document.getElementById('consentDecline');

consentAccept.addEventListener('click', ()=> {
  consentOverlay.style.display = 'none';
  // start session if not started
  if(typeof startSession === 'function') startSession();
});
consentDecline.addEventListener('click', ()=> {
  consentOverlay.style.display = 'none';
  // show a short message and hide UI
  document.querySelector('.chat-panel').innerHTML = '<p style="padding:16px">You can start later. If in immediate danger, contact local emergency services.</p>';
});