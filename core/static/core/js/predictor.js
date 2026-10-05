(function(){
const $=id=>document.getElementById(id);
const TYPES={
 academic:[["Attendance",20],["Midterm exam",20],["Final exam",40],["Class performance & attitude",20]],
 mixed:[["Attendance",20],["Final exam",40],["Classroom performance",20],["Internship report",20]],
 practical:[["Attendance",20],["Internship report",60],["Internship attitude",20]]
};
const GR=[["A+",4.5],["A0",4.0],["B+",3.5],["B0",3.0],["C+",2.5],["C0",2.0],["D+",1.5],["D0",1.0]];
const cuts=[90,85,80,75,70,65,60,40];
const BANDS=[[0,1,"A band (A+ / A0)"],[2,3,"B band (B+ / B0)"],[4,7,"C–D band (C+ to D0)"]];
const col=p=>p>=4?"emerald":p>=3?"blue":p>=2?"amber":"red";
const clamp=v=>Math.max(0,Math.min(100,v));
const GRADE=i=>i>=8?{g:"F",p:0}:{g:GR[i][0],p:GR[i][1]};
function absIdx(s){if(s<40)return 8;for(let i=0;i<8;i++)if(s>=cuts[i])return i;return 8}
const counts=N=>{const a=Math.floor(N*.3),b=Math.floor(N*.4);return{a,b,c:N-a-b}};
function relRes(s,F){
  const N=parseInt($("pdN").value),r=parseInt($("pdRank").value);
  if(F||s<40)return GRADE(8);
  if(!(N>0)||!(r>0)||r>N)return null;
  const k=counts(N),bi=r<=k.a?0:r<=k.a+k.b?1:2,[lo,hi,name]=BANDS[bi];
  return{...GRADE(Math.min(Math.max(absIdx(s),lo),hi)),band:name};
}
const absRes=(s,F)=>GRADE(F?8:absIdx(s));

function pdRender(){
  const P=TYPES[$("pdType").value];
  $("pdRows").innerHTML=P.map(([n,w])=>`<div class="pd-row grid grid-cols-12 gap-2 items-center bg-brand-dark p-2.5 rounded-xl border border-brand-border/60 text-xs">
   <div class="col-span-4"><p class="font-semibold text-white leading-tight">${n}</p></div>
   <div class="col-span-2"><input type="number" data-w min="0" max="100" value="${w}" oninput="pdCalc()" title="Weight %" class="w-full bg-brand-card border border-brand-border rounded-lg p-1.5 text-center text-gray-300 text-xs focus:outline-none focus:border-brand-accent"><p class="text-[9px] text-gray-500 text-center mt-0.5">weight %</p></div>
   <div class="col-span-4"><input type="number" data-s min="0" max="100" placeholder="Score /100" oninput="pdCalc()" class="w-full bg-brand-card border border-brand-border rounded-lg p-2 text-white text-xs focus:outline-none focus:border-brand-accent"></div>
   <div class="col-span-2 text-right"><span class="pd-c font-bold text-gray-500">-</span></div></div>`).join("");
  pdCalc();
}

function pdCalc(){
  const method=$("pdMethod").value,rows=[...document.querySelectorAll(".pd-row")];
  let earned=0,rem=0,totW=0,attScore=null,oSum=0,oW=0;
  rows.forEach((r,i)=>{
    const w=Math.max(0,parseFloat(r.querySelector("[data-w]").value)||0);
    const raw=parseFloat(r.querySelector("[data-s]").value),ok=!isNaN(raw),v=clamp(raw||0),c=r.querySelector(".pd-c");
    totW+=w;
    if(ok){earned+=v*w/100;if(i===0)attScore=v;else{oSum+=v*w;oW+=w}c.textContent=(v*w/100).toFixed(1)+"/"+w;c.className="pd-c font-bold text-emerald-400"}
    else{rem+=w;c.textContent="-";c.className="pd-c font-bold text-gray-500"}
  });
  const den=totW||100,ePct=earned/den*100,rPct=rem/den*100;
  const ww=$("pdWeightWarn");ww.classList.toggle("hidden",Math.abs(totW-100)<.01);
  ww.textContent=`Weights add up to ${totW}%, not 100%. Scores are scaled to the total.`;

  /* attendance checks */
  const abs=+$("pdAbs").value||0,tot=+$("pdTot").value||0,ratio=tot>0?abs/tot:0,absF=tot>0&&abs>=tot/3;
  const attLow=ratio>=.2||(attScore!==null&&attScore<60),oAvg=oW?oSum/oW:null;
  let msg="";
  if(absF)msg=`<div class="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-semibold">You have missed 1/3 or more of the classes (${abs} of ${tot}). The course grade will be F no matter how high your other marks are.</div>`;
  else{
    if(attLow&&oAvg!==null&&oAvg>=80)msg+=`<div class="px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]"><strong>Are you sure?</strong> Your attendance is low, but you entered high marks in your other components (average ${oAvg.toFixed(0)}). Please double-check these numbers. Low attendance usually pulls the total down, and missing 1/3 of the classes means an automatic F.</div>`;
    if(ratio>=.25)msg+=`<div class="px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]">You are close to the 1/3 absence limit (${abs} of ${tot} classes). Missing ${Math.ceil(tot/3)-abs} more class(es) would mean an automatic F.</div>`;
  }
  $("pdSure").innerHTML=msg;

  /* show/hide panels by method */
  $("pdUnsure").classList.toggle("hidden",method!=="unsure");
  $("pdClassBox").classList.toggle("hidden",method==="absolute");
  $("pdNeedCard").classList.toggle("hidden",method==="relative");
  $("pdRankCard").classList.toggle("hidden",method==="absolute");
  $("pdWhatWrap").classList.toggle("hidden",rem===0);

  const what=clamp(parseFloat($("pdWhat").value)||0);
  const proj=ePct+rPct*what/100,max=ePct+rPct;
  const box=(label,r,hint)=>{const c=r?col(r.p):"gray";return `<div class="flex items-center justify-between gap-3 bg-brand-dark p-3 rounded-xl border border-brand-border/60"><div><p class="text-[11px] text-gray-400 uppercase font-semibold">${label}</p><p class="text-xs text-gray-400 mt-0.5">${r?`GPA points: <strong class="text-${c}-400">${r.p.toFixed(1)} / 4.5</strong>${r.band?` · ${r.band}`:""}`:hint}</p></div><div class="px-4 py-2 rounded-xl bg-${c}-500/10 border border-${c}-500/30 text-${c}-400 text-2xl font-black">${r?r.g:"?"}</div></div>`};
  const aR=absRes(proj,absF),rR=relRes(proj,absF),rHint="Enter your class size and rank to see your band.";
  let boxes=method==="absolute"?box("Estimated grade (absolute)",aR)
    :method==="relative"?box("Estimated grade (relative)",rR,rHint)
    :box("If absolute grading",aR)+box("If relative grading",rR,rHint);
  const rng=rem?`<p>Secured so far: <strong class="text-white">${ePct.toFixed(1)}</strong> / ${(100-rPct).toFixed(1)} points</p><p>Possible final score: <strong class="text-white">${ePct.toFixed(1)} – ${max.toFixed(1)}</strong>${method!=="relative"?` (grade ${absRes(ePct,absF).g} to ${absRes(max,absF).g}, absolute)`:""}</p>`:"";
  $("pdResult").innerHTML=`<p class="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">${rem?"Projected (what-if)":"Predicted final"} course score</p>
   <div class="text-4xl font-black text-white mt-1">${proj.toFixed(1)}<span class="text-base text-gray-500"> / 100</span></div>
   <div class="space-y-2.5 mt-4">${boxes}</div>
   ${rng?`<div class="mt-4 pt-3 border-t border-brand-border/40 text-xs text-gray-400 space-y-1">${rng}</div>`:""}
   <p class="mt-3 text-[10px] text-gray-500">This is an estimate. The official grade is decided by your professor after all results are in.</p>`;

  /* absolute: what do I need */
  $("pdNeed").innerHTML=GR.map(([g,p],i)=>{
    const need=rPct?(cuts[i]-ePct)/rPct*100:null,c=col(p);let t,k;
    if(absF){t="Not possible (attendance)";k="text-red-400"}
    else if(!rPct){t=ePct>=cuts[i]?"Achieved":`Needs a total of ${cuts[i]}+`;k=ePct>=cuts[i]?"text-emerald-400":"text-gray-500"}
    else if(need<=0){t="Already secured";k="text-emerald-400"}
    else if(need>100){t="Not reachable";k="text-red-400"}
    else{t=`Need ${need.toFixed(1)} average on pending parts`;k="text-amber-400"}
    return `<div class="flex items-center justify-between bg-brand-dark px-3 py-2 rounded-lg border border-brand-border/60"><span class="flex items-center gap-2"><span class="w-9 text-center font-black text-${c}-400">${g}</span><span class="text-gray-500">${cuts[i]}+ · ${p.toFixed(1)} pts</span></span><span class="font-semibold ${k}">${t}</span></div>`;
  }).join("");

  /* relative: ranking guide */
  const N=parseInt($("pdN").value),rk=parseInt($("pdRank").value);
  const line=(name,range,me)=>`<div class="flex items-center justify-between px-3 py-2 rounded-lg border ${me?"bg-brand-accent/10 border-brand-accent/40":"bg-brand-dark border-brand-border/60"}"><span class="font-semibold text-white">${name}</span><span class="text-gray-300">${range}${me?' <span class="text-brand-accent font-bold">· you</span>':""}</span></div>`;
  if(N>0){
    const k=counts(N),inB=!(rk>0&&rk<=N)?-1:rk<=k.a?0:rk<=k.a+k.b?1:2;
    $("pdRankGuide").innerHTML=line(BANDS[0][2],`ranks 1–${k.a} (top 30%)`,inB===0)+line(BANDS[1][2],`ranks ${k.a+1}–${k.a+k.b} (next 40%)`,inB===1)+line(BANDS[2][2],`ranks ${k.a+k.b+1}–${N} (rest)`,inB===2)
      +`<p class="text-[11px] text-gray-500 pt-1">With ${N} students, only about ${k.a} can get A+ or A0. Your score decides the letter inside your band.</p>`;
  }else $("pdRankGuide").innerHTML=line(BANDS[0][2],"top 30% of the class",false)+line(BANDS[1][2],"next 40%",false)+line(BANDS[2][2],"remaining 30%",false)+`<p class="text-[11px] text-gray-500 pt-1">Enter the number of students in your class to see exact rank ranges.</p>`;
}
window.pdRender=pdRender;window.pdCalc=pdCalc;
window.pdCut=(i,v)=>{cuts[i]=clamp(parseFloat(v)||0);pdCalc()};
window.addEventListener("DOMContentLoaded",()=>{
  $("pdCuts").innerHTML=GR.map(([g],i)=>`<div><label class="text-[10px] text-gray-400 block">${g}</label><input type="number" value="${cuts[i]}" min="0" max="100" onchange="pdCut(${i},this.value)" class="w-full bg-brand-card border border-brand-border rounded-lg p-1.5 text-white text-xs text-center"></div>`).join("");
  pdRender();
});
})();
