const $=id=>document.getElementById(id);
const icons=()=>window.lucide&&lucide.createIcons();
const esc=s=>String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const G={"A+":4.5,"A0":4,"B+":3.5,"B0":3,"C+":2.5,"C0":2,"D+":1.5,"D0":1,"F":0};
const D=JSON.parse(document.getElementById("gm-data").textContent);
const BASE=D.history.reduce((a,h)=>({credits:a.credits+h.credits,points:a.points+h.points}),{credits:0,points:0}),TOTAL=D.required,TARGET=D.target;
const DEF=[];
const NAV=[["dashboard","layout-dashboard","Dashboard"],["calculators","calculator","My GPA & Calculators"],["predictor","target","Course Grade Predictor"],["planner","flag","Goal Planner & Retakes"],["career","git-commit","Career Path Planner"],["scholarships","award","Scholarships & Grants"],["peers","users","Peer Comparisons"]];
const GRANTS=[{id:"stem",n:"STEM Merit Scholarship",min:3.9,amt:2000,dl:"Nov 15"},{id:"dean",n:"Dean's Academic Award",min:4.15,amt:1500,dl:"Dec 01"},{id:"global",n:"Global Academic Excellence Grant",min:4.15,amt:3500,dl:"Jan 10"},{id:"tech",n:"National Tech Innovators Award",min:4.3,amt:5000,dl:"Feb 01"}];
const CAREERS=[["Software Engineer",3.6],["Data Scientist",3.9],["ML Engineer",4.05],["Research Scientist",4.15],["Quant Analyst",4.3]];
const PEERS=[{n:"Math Track Cohort",g:4.1,c:"blue"},{n:"Honor Society Peer Group",g:4.35,c:"purple"},{n:"Class Average",g:3.5,c:"gray"},{n:"Top 1% Benchmark",g:4.45,c:"amber"}];
const ON="bg-brand-accent/10 text-brand-accent border-brand-accent/20 font-semibold".split(" ");
const OFF="text-gray-400 border-transparent hover:text-gray-200 hover:bg-brand-border/30 font-medium".split(" ");

const KEY="gm_courses_"+GM_USER,AKEY="gm_applied_"+GM_USER;
let courses=null,applied=[],filter="all",chart=null,state={};
courses=JSON.parse(JSON.stringify(D.courses||[]));
try{applied=JSON.parse(localStorage.getItem(AKEY))||[]}catch(e){}

const letter=n=>n>=4.25?"A+":n>=3.75?"A0":n>=3.25?"B+":n>=2.75?"B0":n>=2.25?"C+":n>=1.75?"C0":n>=1.25?"D+":n>=.75?"D0":"F";
const rank=c=>c>=4.3?"Top 2%":c>=4.15?"Top 5%":c>=3.9?"Top 15%":c>=3.6?"Top 35%":"Top 50%";
const honor=c=>[c>=4.3?"Summa Cum Laude":c>=4.05?"Magna Cum Laude":c>=3.85?"Cum Laude":"Keep Pushing",c>=TARGET?"Target CGPA achieved. Keep it up!":`Need +${(TARGET-c).toFixed(2)} CGPA to reach your target (${TARGET.toFixed(2)}).`];
const tok=(n,a=1)=>{const v=getComputedStyle(document.documentElement).getPropertyValue("--"+n).trim().split(/\s+/).join(",");return a===1?`rgb(${v})`:`rgba(${v},${a})`};
const toast=m=>{const t=$("toast");t.textContent=m;t.classList.remove("hidden");clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.add("hidden"),2200)};

/* ---------- navigation ---------- */
function buildNav(){
  $("sideNav").innerHTML=NAV.map(([id,ic,lb])=>`<button data-nav="${id}" onclick="show('${id}')" class="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs border transition-all text-left"><i data-lucide="${ic}" class="w-4 h-4"></i><span>${lb}</span></button>`).join("");
  $("mobNav").innerHTML=NAV.map(([id,ic,lb])=>`<button data-nav="${id}" onclick="show('${id}')" class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs border whitespace-nowrap transition-all"><i data-lucide="${ic}" class="w-3.5 h-3.5"></i><span>${lb}</span></button>`).join("");
}
function show(id){
  if(!NAV.some(n=>n[0]===id))id="dashboard";
  document.querySelectorAll("[data-section]").forEach(s=>s.classList.toggle("hidden",s.dataset.section!==id));
  document.querySelectorAll("[data-nav]").forEach(b=>{const a=b.dataset.nav===id;b.classList.remove(...ON,...OFF);b.classList.add(...(a?ON:OFF))});
  if(location.hash!=="#"+id)history.replaceState(null,"","#"+id);
  window.scrollTo(0,0);
  if(id==="dashboard"&&chart)setTimeout(()=>chart.resize(),30);
}
window.addEventListener("hashchange",()=>show(location.hash.slice(1)));
$("search").addEventListener("keydown",e=>{
  if(e.key!=="Enter")return;
  const q=e.target.value.trim().toLowerCase();if(!q)return;
  const K={dashboard:["dashboard","overview","chart","trend","timeline"],calculators:["gpa","calculator","convert","course","scale"],predictor:["predict","final","exam","grade","needed","result"],career:["career","job","software","data","quant","engineer","ml"],scholarships:["scholar","grant","award","money","dean"],peers:["peer","compare","rank","cohort","class"],planner:["goal","target","retake","history","plan"]};
  const hit=Object.keys(K).find(k=>K[k].some(w=>q.includes(w)||w.includes(q)));
  if(hit){show(hit);e.target.value=""}else toast("No matching section found");
});

/* ---------- calculation ---------- */
function compute(){
  let cr=0,pt=0;
  courses.forEach(c=>{const k=parseFloat(c.credits)||0;cr+=k;pt+=(G[c.grade]??0)*k});
  const tc=BASE.credits+cr;
  state={semCr:cr,semPts:pt,sem:cr?pt/cr:0,credits:tc,cgpa:tc?(BASE.points+pt)/tc:0};
}
function renderRows(){
  $("courseContainer").innerHTML=!courses.length?`<p class="text-xs text-gray-500 text-center py-6">No courses yet. Add your current semester courses to calculate your GPA.</p>`:courses.map((c,i)=>`<div class="grid grid-cols-12 gap-2 items-center bg-brand-dark p-2 rounded-xl border border-brand-border/60 text-xs">
   <div class="col-span-5"><input type="text" value="${esc(c.name)}" onchange="upd(${i},'name',this.value)" class="w-full bg-transparent text-white focus:outline-none text-xs font-medium" placeholder="Course Name"></div>
   <div class="col-span-3"><select onchange="upd(${i},'grade',this.value)" class="w-full bg-brand-card border border-brand-border rounded-lg p-1 text-white text-xs">${Object.keys(G).map(g=>`<option ${c.grade===g?"selected":""}>${g}</option>`).join("")}</select></div>
   <div class="col-span-3"><input type="number" min="1" max="6" value="${c.credits}" onchange="upd(${i},'credits',this.value)" class="w-full bg-brand-card border border-brand-border rounded-lg p-1 text-center text-white text-xs"></div>
   <div class="col-span-1 text-right"><button onclick="delCourse(${i})" class="text-gray-500 hover:text-red-400"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button></div></div>`).join("");
  icons();
}
const upd=(i,f,v)=>{courses[i][f]=f==="credits"?(parseFloat(v)||0):v;renderAll()};
const addCourse=()=>{courses.push({name:"New Course",grade:"A0",credits:3});renderRows();renderAll()};
const delCourse=i=>{courses.splice(i,1);renderRows();renderAll()};
const resetCourses=()=>{courses=[];renderRows();renderAll();toast("All courses cleared. Press Save to keep this.")};
const csrf=()=>(document.querySelector("[name=csrfmiddlewaretoken]")||{}).value||"";
async function saveCourses(){
  try{
    const r=await fetch("/api/current-courses/",{method:"POST",headers:{"Content-Type":"application/json","X-CSRFToken":csrf()},body:JSON.stringify({courses})});
    const d=await r.json();
    toast(d.ok?`Saved. CGPA is now ${state.cgpa.toFixed(2)}`:(d.error||"Could not save"));
  }catch(e){toast("Could not save. Check your connection.")}
}

function convert(){
  const s=+$("cvScale").value,v=parseFloat($("cvInput").value)||0;
  let n=s===100?v/100*4.5:v/s*4.5;n=Math.max(0,Math.min(4.5,n));
  $("cvLetter").textContent=letter(n);$("cvPct").textContent=(n/4.5*100).toFixed(1)+"%";$("cvNorm").textContent=n.toFixed(2);
}

/* ---------- renderers ---------- */
function renderStats(){
  const c=state.cgpa,prev=BASE.credits?BASE.points/BASE.credits:null,d=prev===null?0:c-prev,ok=GRANTS.filter(g=>c>=g.min),sum=ok.reduce((a,g)=>a+g.amt,0);
  const card=(l,v,ic,col,sub)=>`<div class="bg-brand-card p-4 rounded-2xl border border-brand-border"><div class="flex justify-between items-start"><div><p class="text-xs text-gray-400 font-medium">${l}</p><h3 class="text-2xl font-black text-white mt-1">${v}</h3></div><div class="p-2.5 rounded-xl bg-${col}-500/10 text-${col}-400 border border-${col}-500/20"><i data-lucide="${ic}" class="w-5 h-5"></i></div></div><div class="mt-3 text-[11px] text-${col}-400 font-medium">${sub}</div></div>`;
  $("stats").innerHTML=card("Cumulative GPA",c.toFixed(2),"trending-up","emerald",prev===null?"First semester. Add your courses to start.":`${d>=0?"+":""}${d.toFixed(2)} vs. last semester`)
   +card("Earned Credits",`${state.credits} / ${TOTAL}`,"book-open","blue",`${Math.round(state.credits/TOTAL*100)}% of degree (incl. this semester)`)
   +card("Class Rank",rank(c),"award","purple",c>=3.9?"Dean's List eligible":"Dean's List needs 3.90")
   +card("Eligible Grants","$"+sum.toLocaleString(),"dollar-sign","amber",`${ok.length} of ${GRANTS.length} grants unlocked`);
  $("quick").innerHTML=`<p class="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">This Semester</p><div class="text-4xl font-black text-white mt-1">${state.sem.toFixed(2)}</div><p class="text-xs text-gray-400 mt-1">${state.semCr} credit hours · ${courses.length} courses</p><p class="text-[11px] text-gray-500 mt-0.5">Semester ${D.current} of ${D.maxSem} · ${D.labels[D.current-1]}</p><button onclick="show('calculators')" class="btn btn-primary mt-4 w-full py-2.5 text-xs">Open Calculator</button>`;
}
function renderBadge(){
  const [t,m]=honor(state.cgpa);
  $("hbTitle").textContent=t;$("hbText").textContent=m;$("hbBar").style.width=Math.min(100,state.cgpa/TARGET*100)+"%";
}
function renderCalc(){
  $("calcGpa").textContent=state.sem.toFixed(2);$("calcCr").textContent=state.semCr;
  $("calcPt").textContent=state.semPts.toFixed(1);$("calcCg").textContent=state.cgpa.toFixed(2);
}
function pts(){
  const out=[];let cr=0,pt=0;
  D.history.forEach(h=>{cr+=h.credits;pt+=h.points;out.push({l:h.label,g:+(pt/cr).toFixed(2),t:"past"})});
  out.push({l:D.labels[D.current-1],g:+state.cgpa.toFixed(2),t:"cur"});
  const left=D.maxSem-D.current;
  for(let k=1;k<=left;k++)out.push({l:D.labels[D.current-1+k],g:+Math.min(4.5,state.cgpa+(TARGET-state.cgpa)*k/left).toFixed(2),t:"proj"});
  return out;
}
const flt=()=>pts().filter(p=>filter==="all"||(filter==="past"?p.t!=="proj":p.t!=="past"));
function renderTimeline(){
  const f=flt();
  const ci=f.findIndex(p=>p.t==="cur"),vis=filter==="all"&&ci>=0?f.slice(Math.max(0,ci-1),Math.max(0,ci-1)+4):filter==="proj"?f.slice(0,4):f.slice(-4);
  $("timeline").innerHTML=vis.map(p=>{const cur=p.t==="cur",pr=p.t==="proj";
   return `<div class="bg-brand-dark/80 p-3 rounded-xl border ${cur?"border-brand-accent/60 shadow-lg shadow-brand-accent/5":"border-brand-border"}"><span class="text-[10px] uppercase font-semibold ${cur?"text-brand-accent":"text-gray-400"}">${p.l}</span><p class="text-sm font-bold ${pr?"text-amber-400":"text-white"} mt-0.5">${pr?"Target":"GPA"}: ${p.g.toFixed(2)}</p><span class="text-[10px] ${pr?"text-amber-400":"text-emerald-400"}">${cur?"Current Term":pr?"Projected":"Completed"}</span></div>`}).join("");
  document.querySelectorAll("#flt [data-f]").forEach(b=>{const a=b.dataset.f===filter;b.classList.remove("text-white","bg-brand-border","text-gray-400");b.classList.add(...(a?["text-white","bg-brand-border"]:["text-gray-400"]))});
  if(chart){const d=f.map(p=>p.g);
   chart.data.labels=f.map(p=>p.l);chart.data.datasets[0].data=d;
   chart.data.datasets[0].pointBackgroundColor=f.map(p=>p.t==="proj"?tok("gold"):tok("brand"));
   chart.options.scales.y.min=Math.max(0,Math.min(3.5,Math.floor(Math.min(...d)*10)/10));chart.update()}
}
function grantCard(g){
  const ok=state.cgpa>=g.min,ap=applied.includes(g.id);
  return `<div class="p-3.5 bg-brand-dark rounded-xl border border-brand-border/60 flex items-center justify-between gap-3"><div><h4 class="text-sm font-bold text-white">${g.n}</h4><p class="text-[11px] text-gray-400 mt-0.5">Min GPA ${g.min.toFixed(2)} • Deadline ${g.dl}</p>
   <span class="inline-block mt-2 text-[10px] ${ok?"bg-emerald-500/10 text-emerald-400 border-emerald-500/20":"bg-amber-500/10 text-amber-400 border-amber-500/20"} border px-2 py-0.5 rounded">${ok?`Eligible (${state.cgpa.toFixed(2)})`:`Target (+${(g.min-state.cgpa).toFixed(2)} needed)`}</span></div>
   <div class="text-right"><span class="font-black ${ok?"text-emerald-400":"text-amber-400"} text-base">$${g.amt.toLocaleString()}</span>
   ${ok?`<button onclick="applyGrant('${g.id}')" class="block ml-auto mt-2 text-[11px] ${ap?"bg-brand-border text-emerald-400":"btn-primary"} font-bold px-3 py-1 rounded-lg hover:opacity-90">${ap?"Applied":"Apply"}</button>`:`<span class="block mt-2 text-[11px] bg-brand-border text-gray-500 font-bold px-3 py-1 rounded-lg cursor-not-allowed">Locked</span>`}</div></div>`;
}
function applyGrant(id){
  applied=applied.includes(id)?applied.filter(x=>x!==id):[...applied,id];
  try{localStorage.setItem(AKEY,JSON.stringify(applied))}catch(e){}
  toast(applied.includes(id)?"Application marked as submitted":"Application withdrawn");renderGrants();
}
function renderGrants(){
  $("grantList").innerHTML=GRANTS.map(grantCard).join("");
  $("grantPreview").innerHTML=GRANTS.slice(0,2).map(grantCard).join("");
}
function renderCareer(){
  const c=state.cgpa;
  $("careerList").innerHTML=CAREERS.map(([n,m])=>{const ok=c>=m;return `<div class="p-4 bg-brand-card rounded-2xl border border-brand-border"><p class="text-xs text-gray-400 font-medium">${n}</p><p class="text-lg font-black text-white mt-1">Min GPA: ${m.toFixed(2)}</p>
   <div class="w-full bg-gray-800 rounded-full h-1.5 mt-3 overflow-hidden"><div class="h-1.5 rounded-full ${ok?"bg-emerald-400":"bg-amber-400"} transition-all duration-500" style="width:${Math.min(100,c/m*100)}%"></div></div>
   <div class="mt-2 text-[11px] ${ok?"text-emerald-400":"text-amber-400"} flex items-center gap-1"><i data-lucide="${ok?"check":"alert-circle"}" class="w-3 h-3"></i>${ok?`Qualified (${c.toFixed(2)})`:`Target (+${(m-c).toFixed(2)} needed)`}</div></div>`}).join("");
}
function renderPeers(){
  const c=state.cgpa;
  const rows=[...PEERS,{n:GM_USER+" (You)",g:c,c:"emerald",you:true}].sort((a,b)=>b.g-a.g);
  $("peerBody").innerHTML=rows.map((r,i)=>{const d=r.g-c;
   return `<tr class="${r.you?"bg-emerald-500/5":"hover:bg-brand-lightCard/30"} transition-colors"><td class="p-3 text-gray-500 font-bold">${i+1}</td>
   <td class="p-3"><div class="flex items-center gap-2 ${r.you?"font-semibold text-white":""}"><div class="w-6 h-6 rounded-full bg-${r.c}-500/20 text-${r.c}-400 flex items-center justify-center text-[10px] font-bold">${esc(r.n.slice(0,2).toUpperCase())}</div>${esc(r.n)}</div></td>
   <td class="p-3"><span class="bg-${r.c}-500/10 text-${r.c}-400 border border-${r.c}-500/20 px-2 py-0.5 rounded">${letter(r.g)}</span></td>
   <td class="p-3 font-bold text-white">${r.g.toFixed(2)}</td>
   <td class="p-3 ${r.you?"text-gray-500":d>0?"text-red-400":"text-emerald-400"}">${r.you?"-":(d>0?"+":"")+d.toFixed(2)}</td>
   <td class="p-3 text-right font-medium ${r.you?"text-emerald-400":"text-gray-400"}">${r.you?rank(c):d>0?"Above you":"Below you"}</td></tr>`}).join("");
}
function renderAll(){compute();window.renderPlanner&&renderPlanner();renderStats();renderBadge();renderCalc();renderTimeline();renderGrants();renderCareer();renderPeers();icons()}

/* ---------- init ---------- */
window.addEventListener("DOMContentLoaded",()=>{
  buildNav();compute();
  document.querySelectorAll("#flt [data-f]").forEach(b=>b.onclick=()=>{filter=b.dataset.f;renderTimeline()});
  Chart.defaults.font.family="'Plus Jakarta Sans',system-ui,sans-serif";
  const ctx=$("gpaTrendChart").getContext("2d");
  const paint=()=>{
    const gr=ctx.createLinearGradient(0,0,0,220);gr.addColorStop(0,tok("brand",.35));gr.addColorStop(1,tok("brand",0));
    const d=chart.data.datasets[0];d.borderColor=tok("brand");d.backgroundColor=gr;d.pointBorderColor=tok("surface");
    const o=chart.options.scales;o.x.grid.color=o.y.grid.color=tok("line",.7);o.x.ticks.color=o.y.ticks.color=tok("n400");
    renderTimeline();chart.update();
  };
  chart=new Chart(ctx,{type:"line",data:{labels:[],datasets:[{label:"Cumulative GPA",data:[],borderWidth:3,fill:true,tension:.4,pointBorderWidth:2,pointRadius:5}]},
   options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{},ticks:{font:{size:10}}},y:{max:4.5,grid:{},ticks:{font:{size:10}}}}}});
  paint();window.addEventListener("gw-theme",()=>setTimeout(paint,30));
  renderRows();renderAll();convert();
  show(location.hash.slice(1)||"dashboard");icons();
});
