/* Goal Planner, Retake Simulator and Semester History (uses globals from dashboard.js) */
function renderPlanner(){
  const el=id=>document.getElementById(id);
  if(!el("plOut"))return;
  /* ---- goal planner ---- */
  const tIn=el("plTarget");if(tIn.value==="")tIn.value=TARGET.toFixed(2);
  const T=Math.min(4.5,Math.max(0,parseFloat(tIn.value)||0));
  const defRem=Math.max(0,TOTAL-state.credits),remIn=el("plRem");
  remIn.placeholder=`auto (${defRem})`;
  const R=remIn.value===""?defRem:Math.max(0,parseFloat(remIn.value)||0);
  const P=BASE.points+state.semPts,C=state.credits,F=C+R;
  const left=D.maxSem-D.current,row=(a,b,c="text-white")=>`<div class="flex justify-between bg-brand-dark px-3 py-2 rounded-lg border border-brand-border/60"><span class="text-gray-400">${a}</span><span class="font-bold ${c}">${b}</span></div>`;
  let h=row("Current CGPA (incl. this semester)",state.cgpa.toFixed(2))+row("Credits completed / remaining",`${C} / ${R}`);
  if(R<=0){h+=row("Final CGPA",(C?P/C:0).toFixed(2),"text-emerald-400")+`<p class="text-[11px] text-gray-400">No credits remaining, so your CGPA is final.</p>`}
  else{
    const need=(T*F-P)/R,best=(P+4.5*R)/F;
    if(need<=0)h+=row("Required average GPA","Already secured","text-emerald-400")+`<p class="text-[11px] text-gray-400">Even with the lowest grades you would stay above ${T.toFixed(2)}.</p>`;
    else if(need>4.5)h+=row("Required average GPA",need.toFixed(2),"text-red-400")+`<p class="text-[11px] text-red-400">Not reachable. With straight A+ in all remaining credits your best possible CGPA is ${best.toFixed(2)}.</p>`;
    else{
      h+=row("Required average GPA",`${need.toFixed(2)} (about ${letter(need)})`,need>4.1?"text-amber-400":"text-emerald-400");
      if(left>0)h+=row("Remaining semesters after this one",`${left} (about ${Math.ceil(R/left)} credits each)`);
      h+=`<p class="text-[11px] text-gray-400">Average the GPA above across your remaining ${R} credits to finish with ${T.toFixed(2)}.</p>`;
    }
  }
  el("plOut").innerHTML=h;

  /* ---- retake simulator ---- */
  const list=[];D.history.forEach(s=>s.courses.forEach(c=>{if(G[c.grade]<4.5)list.push({...c,sem:s.label})}));
  const sel=el("rtCourse"),prev=sel.value;
  if(!sel.dataset.ready||sel.dataset.n!=String(list.length)){
    sel.innerHTML=list.length?list.map((c,i)=>`<option value="${i}">${c.name} · ${c.sem} · ${c.grade} (${c.credits} cr)</option>`).join(""):`<option value="">No past courses available</option>`;
    if(prev&&list[prev])sel.value=prev;
    sel.dataset.ready="1";sel.dataset.n=String(list.length);
    const gl=Object.keys(G);
    if(!el("rtNew").options.length){el("rtNew").innerHTML=gl.map(g=>`<option ${g==="A0"?"selected":""}>${g}</option>`).join("");el("rtCap").innerHTML=`<option value="">No cap</option>`+gl.slice(0,8).map(g=>`<option ${g==="B+"?"selected":""}>${g}</option>`).join("")}
  }
  if(!list.length||sel.value===""){
    el("rtOut").innerHTML=`<p class="text-[11px] text-gray-400">${D.current===1?"You have no completed semesters yet.":"Enter your past semesters course by course in Settings to simulate retakes."}</p>`;
  }else{
    const c=list[+sel.value],old=G[c.grade],cap=el("rtCap").value,np=Math.min(G[el("rtNew").value],cap?G[cap]:4.5);
    const eff=Math.max(old,np),delta=(eff-old)*c.credits,now=C?P/C:0,after=C?(P+delta)/C:0;
    el("rtOut").innerHTML=row("Course grade",`${c.grade} → ${eff>old?Object.keys(G).find(k=>G[k]===eff):c.grade+" (no change)"}`)
      +row("CGPA now → after retake",`${now.toFixed(2)} → ${after.toFixed(2)}`,after>now?"text-emerald-400":"text-white")
      +row("Change",`${after>=now?"+":""}${(after-now).toFixed(3)}`,after>now?"text-emerald-400":"text-gray-400");
  }

  /* ---- semester history ---- */
  let cr=0,pt=0,hh=D.history.map(s=>{cr+=s.credits;pt+=s.points;return `<div class="bg-brand-dark p-3 rounded-xl border border-brand-border"><span class="text-[10px] uppercase font-semibold text-gray-400">Sem ${s.n} · ${s.label}</span><p class="text-sm font-bold text-white mt-0.5">GPA ${s.gpa.toFixed(2)} <span class="text-emerald-400 text-xs">${letter(s.gpa)}</span></p><span class="text-[10px] text-gray-500">${s.credits} credits · CGPA ${(pt/cr).toFixed(2)}</span></div>`}).join("");
  hh+=`<div class="bg-brand-dark p-3 rounded-xl border border-brand-accent/60"><span class="text-[10px] uppercase font-semibold text-brand-accent">Sem ${D.current} · ${D.labels[D.current-1]}</span><p class="text-sm font-bold text-white mt-0.5">GPA ${state.sem.toFixed(2)}</p><span class="text-[10px] text-gray-500">In progress · ${state.semCr} credits</span></div>`;
  el("histList").innerHTML=hh;
}
