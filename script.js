const DAY_TEMPLATES = {
  weekday: {
    label: "Weekday (Mon\u2013Thu)",
    blocks: [
      { id:'morn1', time:'4:00\u20135:30 AM', title:'Spiritual Anchor', desc:'Secret prayer, scripture reading, devotional study, and quiet time with God.' },
      { id:'morn2', time:'5:30\u20136:30 AM', title:'Physical Fitness', desc:'Morning workout / exercise & personal refresh.' },
      { id:'morn3', time:'6:30\u20137:30 AM', title:'SQI Prep', desc:'Breakfast, review top 3 tasks for the day, commute to SQI.' },
      { id:'sqi1', time:'8:00\u201310:00 AM', title:'SQI Class Block', desc:'Active engagement, note-taking, mastering software engineering concepts.' },
      { id:'sqi2', time:'10:00 AM\u20134:00 PM', title:'IT Work & Coding', desc:'Practical coding, assignments & portfolio builds. 50-min work blocks.' },
      { id:'sqi3', time:'4:00\u20135:30 PM', title:'Commute & Reset', desc:'Transition home, step away from screens, mental reset.' },
      { id:'eve1', time:'Evening', title:'Fixed Commitment', desc:'' },
      { id:'eve2', time:'8:00\u20139:00 PM', title:'Night Prayer Fellowship', desc:'Connect and pray in unity with colleagues in Christ.' },
      { id:'eve3', time:'10:00\u201310:30 PM', title:'Evening Reflection', desc:'Gratitude, review daily wins, prepare for tomorrow.' },
    ]
  },
  friday: {
    label: "Friday",
    blocks: [
      { id:'f1', time:'4:00\u20135:30 AM', title:'Morning Devotion', desc:'Secret prayer and scripture.' },
      { id:'f2', time:'5:30\u20136:30 AM', title:'Exercise & Refresh', desc:'' },
      { id:'f3', time:'8:00 AM\u20134:00 PM', title:'SQI Project Intensive', desc:'No classes \u2014 deep coding / assignment focus.' },
      { id:'f4', time:'5:00\u20137:00 PM', title:'Choir Rehearsal', desc:'' },
      { id:'f5', time:'8:00\u20139:00 PM', title:'Night Prayer Fellowship', desc:'' },
    ]
  },
  saturday: {
    label: "Saturday",
    blocks: [
      { id:'s1', time:'Morning', title:'Ministry Coordination', desc:'OGSBA / LAUTECH Evangelism / UBC planning.' },
      { id:'s2', time:'Afternoon', title:'Guitar & Income Work', desc:'Focused guitar practice + freelance / income projects.' },
      { id:'s3', time:'Evening', title:'Healthy Relaxation', desc:'Keep it structured and brief.' },
    ]
  },
  sunday: {
    label: "Sunday",
    blocks: [
      { id:'su1', time:'Morning', title:'Church Service & Worship', desc:'' },
      { id:'su2', time:'Afternoon', title:'Total Rest', desc:'Mental reset, family / fellowship time.' },
      { id:'su3', time:'7:00 PM', title:'Week-Ahead Planning', desc:'Prep for the upcoming week.' },
    ]
  }
};

const EVENING_COMMITMENTS = {
  1: { time:'6:00 PM', title:'Choir Rehearsal', desc:'' },
  2: { time:'6:00 PM', title:'Prayer Meeting', desc:'' },
  3: { time:'4:30 PM', title:'Royal Ambassador Meeting', desc:'' },
  4: { time:'Evening', title:'Guitar Practice + SQI Coding Block', desc:'1 hr guitar practice, then a 1.5 hr SQI coding block.' },
};

const GUARDRAILS = [
  { id:'g1', title:'Eye Covenant', desc:'Job 31:1 \u2014 maintained pure vision; reframed thoughts instantly toward dignity in Christ.' },
  { id:'g2', title:'Open Room Environment', desc:'Room door kept open when inside; no screen isolation when tired or resting.' },
  { id:'g3', title:'Bedtime Phone Distance', desc:'Devices placed away from bed before 10:00 PM.' },
  { id:'g4', title:'Distraction Limits', desc:'Movies capped at 1/week; casual visits kept structured & brief.' },
];

const WEEKDAY_LABELS = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function pad(n){ return n < 10 ? '0'+n : ''+n; }
function dateStr(d){ return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function templateKeyFor(d){
  const dow = d.getDay(); // 0 Sun .. 6 Sat
  if(dow === 0) return 'sunday';
  if(dow === 5) return 'friday';
  if(dow === 6) return 'saturday';
  return 'weekday';
}
function startOfWeek(d){
  const copy = new Date(d);
  const dow = copy.getDay();
  const diff = dow === 0 ? -6 : 1 - dow; // week starts Monday
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0,0,0,0);
  return copy;
}
function addDays(d, n){ const c = new Date(d); c.setDate(c.getDate()+n); return c; }

let state = {
  selectedDate: new Date(),
  progress: {}, // { itemId: bool } for selectedDate
  weekSummary: {}, // { 'YYYY-MM-DD': {done, total} }
};
state.selectedDate.setHours(0,0,0,0);

const STORAGE_PREFIX = 'ruleOfLife:day:';

async function loadProgress(ds){
  try{
    const raw = localStorage.getItem(STORAGE_PREFIX + ds);
    if(raw) return JSON.parse(raw);
  }catch(e){ /* no entry yet, or storage unavailable */ }
  return {};
}
async function saveProgress(ds, progress){
  try{
    localStorage.setItem(STORAGE_PREFIX + ds, JSON.stringify(progress));
  }catch(e){ console.error('save failed', e); }
}

function getBlocksForDate(d){
  const tpl = DAY_TEMPLATES[templateKeyFor(d)];
  if(templateKeyFor(d) !== 'weekday') return tpl.blocks;
  const commitment = EVENING_COMMITMENTS[d.getDay()];
  return tpl.blocks.map(b => b.id === 'eve1' ? { ...b, ...commitment } : b);
}

function allItemsForDate(d){
  return [...getBlocksForDate(d), ...GUARDRAILS];
}

async function refreshWeekSummary(){
  const monday = startOfWeek(state.selectedDate);
  const days = [...Array(7)].map((_,i)=>addDays(monday,i));
  const summary = {};
  for(const d of days){
    const ds = dateStr(d);
    const items = allItemsForDate(d);
    const p = await loadProgress(ds);
    const done = items.filter(it => p[it.id]).length;
    summary[ds] = { done, total: items.length };
  }
  state.weekSummary = summary;
}

async function selectDate(d){
  state.selectedDate = d;
  const ds = dateStr(d);
  state.progress = await loadProgress(ds);
  await refreshWeekSummary();
  render();
}

async function toggleItem(id){
  state.progress[id] = !state.progress[id];
  render();
  await saveProgress(dateStr(state.selectedDate), state.progress);
  await refreshWeekSummary();
  render();
}

function fmtHeaderDate(d){
  return `${WEEKDAY_LABELS[d.getDay()]} \u00b7 ${MONTH_LABELS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function render(){
  const app = document.getElementById('app');
  const d = state.selectedDate;
  const tplKey = templateKeyFor(d);
  const tpl = DAY_TEMPLATES[tplKey];
  const items = allItemsForDate(d);
  const doneCount = items.filter(it => state.progress[it.id]).length;
  const totalCount = items.length;
  const pct = totalCount ? Math.round((doneCount/totalCount)*100) : 0;

  const today = new Date(); today.setHours(0,0,0,0);
  const isToday = dateStr(d) === dateStr(today);

  const monday = startOfWeek(d);
  const weekDays = [...Array(7)].map((_,i)=>addDays(monday,i));

  app.innerHTML = `
    <div class="header">
      <div class="title-block">
        <p class="eyebrow">Daily Rule &middot; ${tpl.label}</p>
        <h1>Weekly Rule of Life</h1>
      </div>
      <div class="date-nav">
        <button id="prevDay" aria-label="Previous day">&#8592;</button>
        <div class="date-label"><strong>${fmtHeaderDate(d)}</strong></div>
        <button id="nextDay" aria-label="Next day">&#8594;</button>
        ${!isToday ? '<button class="today-btn" id="todayBtn">Today</button>' : ''}
      </div>
    </div>

    <div class="progress-wrap">
      <div class="progress-track">
        <div class="progress-fill" style="width:${pct}%"></div>
        <div class="progress-ticks">${items.map(()=>'<span></span>').join('')}</div>
      </div>
      <div class="progress-count">${doneCount}/${totalCount}</div>
    </div>

    <div class="week-strip">
      ${weekDays.map(wd => {
        const ds = dateStr(wd);
        const sum = state.weekSummary[ds];
        const dotClass = sum && sum.total ? (sum.done === sum.total ? 'full' : (sum.done > 0 ? 'partial' : '')) : '';
        const active = dateStr(wd) === dateStr(d) ? 'active' : '';
        const isTod = dateStr(wd) === dateStr(today) ? 'is-today' : '';
        return `<div class="week-day ${active} ${isTod}" data-date="${ds}">
                  <div class="wd-label">${WEEKDAY_LABELS[wd.getDay()]}</div>
                  <div class="wd-dot ${dotClass}"></div>
                </div>`;
      }).join('')}
    </div>

    <div class="body">
      <div class="ruler"></div>
      <div class="blocks">
        <div class="section-header">${tpl.label.toUpperCase()}</div>
        ${getBlocksForDate(d).map(it => itemHtml(it, state.progress[it.id])).join('')}
        <div class="section-header guardrail">DAILY GUARDRAILS</div>
        ${GUARDRAILS.map(it => itemHtml(it, state.progress[it.id])).join('')}
      </div>
    </div>

    <div class="footer">
      <span class="hint">Saved automatically as you check things off.</span>
      <button class="reset-btn" id="resetBtn">Reset this day</button>
    </div>
  `;

  document.getElementById('prevDay').onclick = () => selectDate(addDays(state.selectedDate, -1));
  document.getElementById('nextDay').onclick = () => selectDate(addDays(state.selectedDate, 1));
  const todayBtn = document.getElementById('todayBtn');
  if(todayBtn) todayBtn.onclick = () => selectDate(new Date(new Date().setHours(0,0,0,0)));
  document.querySelectorAll('.week-day').forEach(el => {
    el.onclick = () => {
      const [y,m,dd] = el.dataset.date.split('-').map(Number);
      selectDate(new Date(y, m-1, dd));
    };
  });
  document.querySelectorAll('.item input').forEach(el => {
    el.onchange = () => toggleItem(el.dataset.id);
  });
  document.getElementById('resetBtn').onclick = async () => {
    state.progress = {};
    render();
    await saveProgress(dateStr(state.selectedDate), {});
    await refreshWeekSummary();
    render();
  };
}

function itemHtml(it, checked){
  return `
    <div class="item ${checked ? 'checked':''}">
      <label>
        <input type="checkbox" data-id="${it.id}" ${checked ? 'checked':''}>
        <span class="check"></span>
        <span class="item-text">
          <span class="item-title">${it.time ? `<span class="item-time">${it.time}</span>`:''}${it.title}</span>
          ${it.desc ? `<div class="item-desc">${it.desc}</div>` : ''}
        </span>
      </label>
    </div>`;
}

(async function init(){
  await selectDate(state.selectedDate);
})();