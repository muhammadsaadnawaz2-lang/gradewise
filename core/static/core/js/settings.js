(function(){
const $=id=>document.getElementById(id);
const S=JSON.parse($("settings-data").textContent),INIT=JSON.parse($("settings-init").textContent);
const G={"A+":4.5,"A0":4,"B+":3.5,"B0":3,"C+":2.5,"C0":2,"D+":1.5,"D0":1,"F":0};
const MAX={bachelor:8,master:4};
const H={};  // semester number -> {mode, courses, credits, gpa}
S.history.forEach(h=>H[h.n]={mode:h.mode,courses:h.courses.map(c=>({...c})),credits:h.credits??"",gpa:h.gpa??""});
const blank=()=>({name:"",credits:3,grade:"A0"});
const ensure=n=>H[n]||(H[n]={mode:"courses",courses:[blank()],credits:"",gpa:""});
const esc=s=>String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

function label(n){
  const y=parseInt($("id_start_year").value),t=$("id_start_term").value;
  if(!y)return"Semester "+n;
  const i=n-1,sp=t==="spring";
  const term=sp?(i%2?"Fall":"Spring"):(i%2?"Spring":"Fall"),yr=sp?y+Math.floor(i/2):y+Math.floor((i+1)/2);
  return`${term} ${yr}`;
}
function totals(n){
  const h=H[n];
  if(h.mode==="totals"){const c=parseFloat(h.credits)||0,g=parseFloat(h.gpa)||0;return{cr:c,pts:c*g}}
  let cr=0,pts=0;h.courses.forEach(c=>{const k=parseFloat(c.credits)||0;cr+=k;pts+=(G[c.grade]??0)*k});return{cr,pts};
}
function fillSemesterOptions(){
  const sel=$("id_current_semester"),keep=parseInt(sel.value)||INIT.current,max=MAX[$("id_degree").value];
  sel.innerHTML=Array.from({length:max},(_,i)=>`<option value="${i+1}" ${i+1===Math.min(keep,max)?"selected":""}>Semester ${i+1}</option>`).join("");
}
function updateTotals(){
  const cur=parseInt($("id_current_semester").value)||1;let cr=0,pts=0;
  for(let n=1;n<cur;n++){const t=totals(n);cr+=t.cr;pts+=t.pts;const el=$("sg-"+n);if(el)el.textContent=t.cr?`GPA ${(t.pts/t.cr).toFixed(2)} · ${t.cr} credits`:"No data yet"}
  $("cumGpa").textContent=cr?(pts/cr).toFixed(2):"0.00";$("cumCr").textContent=`${cr} credits completed`;
}
function render(){
  const cur=parseInt($("id_current_semester").value)||1;
  $("historyIntro").innerHTML=cur===1
    ?`<div class="glass-card rounded-2xl p-5 text-sm text-slate-300"><i class="fa-solid fa-seedling text-brand-text mr-2"></i>You are in your <strong>first semester</strong>, so there is no previous data to enter. Your dashboard will start from zero and grow as you add your current courses.</div>`
    :`<div><h2 class="text-sm font-black uppercase tracking-wider text-slate-200"><i class="fa-solid fa-clock-rotate-left text-brand-text mr-2"></i>Your previous semesters</h2><p class="text-xs text-slate-400 mt-1">Add the courses, credits and grades of each completed semester. If you do not remember the courses, switch that semester to "Totals only" and enter its credits and GPA.</p></div>`;
  $("cumBox").classList.toggle("hidden",cur===1);
  let html="";
  for(let n=1;n<cur;n++){
    const h=ensure(n),isC=h.mode==="courses";
    html+=`<div class="glass-card rounded-2xl p-5 space-y-3" data-n="${n}">
     <div class="flex flex-wrap items-center justify-between gap-2"><div><h3 class="text-sm font-black text-white">Semester ${n} <span class="text-slate-500 font-semibold">· ${label(n)}</span></h3><p id="sg-${n}" class="text-[11px] text-emerald-400 font-bold"></p></div>
      <div class="flex text-[11px] bg-slate-900 border border-slate-800 rounded-lg p-0.5"><button type="button" data-mode="courses" class="px-3 py-1 rounded-md ${isC?"bg-slate-700 text-white":"text-slate-400"}">Courses</button><button type="button" data-mode="totals" class="px-3 py-1 rounded-md ${!isC?"bg-slate-700 text-white":"text-slate-400"}">Totals only</button></div></div>`;
    if(isC){
      html+=`<div class="grid grid-cols-12 gap-2 text-[10px] font-black uppercase text-slate-500 px-1"><div class="col-span-6">Course</div><div class="col-span-3">Grade</div><div class="col-span-3">Credits</div></div>`;
      h.courses.forEach((c,i)=>{html+=`<div class="grid grid-cols-12 gap-2 items-center" data-i="${i}">
       <div class="col-span-6"><input data-f="name" value="${esc(c.name)}" placeholder="Course name" class="w-full glass-input rounded-lg px-2.5 py-2 text-xs font-semibold"></div>
       <div class="col-span-3"><select data-f="grade" class="w-full glass-input rounded-lg px-2 py-2 text-xs font-bold text-emerald-400">${S.grades.map(g=>`<option ${c.grade===g?"selected":""}>${g}</option>`).join("")}</select></div>
       <div class="col-span-3 flex items-center gap-1"><input data-f="credits" type="number" min="0.5" max="12" step="0.5" value="${c.credits}" class="w-full glass-input rounded-lg px-2 py-2 text-xs font-bold text-center"><button type="button" data-del class="text-slate-500 hover:text-red-400 p-1 text-xs"><i class="fa-solid fa-xmark"></i></button></div></div>`});
      html+=`<button type="button" data-add class="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white transition"><i class="fa-solid fa-plus text-[10px] mr-1"></i>Add course</button>`;
    }else{
      html+=`<div class="grid grid-cols-2 gap-3 text-xs"><div><label class="block text-slate-400 font-bold mb-1">Total credits taken</label><input data-t="credits" type="number" min="1" max="40" step="0.5" value="${esc(h.credits)}" class="w-full glass-input rounded-lg px-3 py-2 font-bold"></div>
       <div><label class="block text-slate-400 font-bold mb-1">Semester GPA (0 - 4.5)</label><input data-t="gpa" type="number" min="0" max="4.5" step="0.01" value="${esc(h.gpa)}" class="w-full glass-input rounded-lg px-3 py-2 font-bold"></div></div>`;
    }
    html+=`</div>`;
  }
  $("history").innerHTML=html;updateTotals();
}
$("history").addEventListener("input",e=>{
  const box=e.target.closest("[data-n]");if(!box)return;const n=+box.dataset.n,h=H[n];
  if(e.target.dataset.t){h[e.target.dataset.t]=e.target.value}
  else if(e.target.dataset.f){const i=+e.target.closest("[data-i]").dataset.i,f=e.target.dataset.f;h.courses[i][f]=e.target.value}
  updateTotals();
});
$("history").addEventListener("click",e=>{
  const box=e.target.closest("[data-n]");if(!box)return;const n=+box.dataset.n,h=H[n];
  const mode=e.target.closest("[data-mode]"),del=e.target.closest("[data-del]"),add=e.target.closest("[data-add]");
  if(mode){h.mode=mode.dataset.mode;render()}
  else if(del){if(h.courses.length>1){h.courses.splice(+del.closest("[data-i]").dataset.i,1);render()}}
  else if(add){h.courses.push(blank());render()}
});
["id_start_year","id_start_term"].forEach(id=>$(id).addEventListener("input",render));
$("id_current_semester").addEventListener("change",render);
$("id_degree").addEventListener("change",()=>{fillSemesterOptions();render()});

$("settingsForm").addEventListener("submit",e=>{
  const cur=parseInt($("id_current_semester").value)||1,out=[],err=$("clientError");let bad="";
  for(let n=1;n<cur;n++){
    const h=ensure(n);
    if(h.mode==="totals"){
      if(!(parseFloat(h.credits)>0)||h.gpa===""||isNaN(parseFloat(h.gpa)))bad=`Semester ${n}: enter total credits and GPA.`;
      out.push({n,mode:"totals",credits:parseFloat(h.credits),gpa:parseFloat(h.gpa)});
    }else{
      if(!h.courses.length||h.courses.some(c=>!(parseFloat(c.credits)>0)))bad=`Semester ${n}: every course needs credits.`;
      out.push({n,mode:"courses",courses:h.courses.map(c=>({name:c.name,grade:c.grade,credits:parseFloat(c.credits)}))});
    }
  }
  if(bad){e.preventDefault();err.textContent=bad;err.classList.remove("hidden");return}
  $("id_history").value=JSON.stringify(out);
});
fillSemesterOptions();
$("id_current_semester").value=INIT.current;
render();
})();
