// DOM
const log = document.getElementById("chatLog");
const consentBox = document.getElementById("consentBox");
const chatArea = document.getElementById("chatArea");
const quick = document.getElementById("quickReply");

// State
let step = 0;
let answers = [];
let tab = "mental"; // default

// Utility
function bot(text) {
  const d = document.createElement("div");
  d.className = "msg-bot";
  d.textContent = text;
  log.appendChild(d);
}

function user(text) {
  const d = document.createElement("div");
  d.className = "msg-user";
  d.textContent = text;
  log.appendChild(d);
}

function clearQuick() {
  quick.innerHTML = "";
}

// Questions
const QUESTIONS = [
  { id: "mood", text: "How has your mood been lately?", type: "scale" },
  { id: "sleep", text: "How is your sleep?", type: "scale" },
  { id: "focus", text: "Do you feel overwhelmed?", type: "yesno" }
];

// Start
document.getElementById("startChat").onclick = () => {
  consentBox.style.display = "none";
  chatArea.style.display = "block";
  bot("Okay! I’ll ask a few questions.");
  askNext();
};

function askNext() {
  if (step >= QUESTIONS.length) return finish();
  let q = QUESTIONS[step];
  bot(q.text);
  renderChoices(q);
}

function renderChoices(q) {
  clearQuick();

  if (q.type === "scale") {
    ["Low", "Medium", "High"].forEach((opt) => {
      let b = document.createElement("button");
      b.className = "quick-btn";
      b.textContent = opt;
      b.onclick = () => handle(q, opt);
      quick.appendChild(b);
    });
  } else {
    ["Yes", "No"].forEach((opt) => {
      let b = document.createElement("button");
      b.className = "quick-btn";
      b.textContent = opt;
      b.onclick = () => handle(q, opt);
      quick.appendChild(b);
    });
  }
}

function handle(q, value) {
  user(value);
  answers.push({ id: q.id, value });

  if (q.id === "focus" && value === "Yes") {
    bot("It’s okay, I’m here. Let’s work through this gently.");
  }

  step++;
  setTimeout(askNext, 600);
}

function finish() {
  clearQuick();
  bot("Thanks for sharing. Here’s your gentle summary:");

  let summary = `You’re showing signs of ${answers[0].value.toLowerCase()} mood and ${answers[1].value.toLowerCase()} sleep.`

  bot(summary);
  bot("3 simple steps you can try today:");
  bot("• Drink water");
  bot("• Do 5 slow breaths");
  bot("• Take a 5-min break outside");

  bot("Your report is now saved.");
}