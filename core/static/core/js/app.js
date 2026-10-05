const GRADE_SCALE={"A+":4.5,"A0":4.0,"B+":3.5,"B0":3.0,"C+":2.5,"C0":2.0,"D+":1.5,"D0":1.0,"F":0.0};
const esc=s=>s?String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"):"";

function Calculator(prefix,courses,onResult){
  const box=document.getElementById(prefix+"-course-container");
  const self={
    courses,
    render(){
      box.innerHTML="";
      self.courses.forEach(c=>{
        const r=document.createElement("div");
        r.className="grid grid-cols-12 gap-2 items-center bg-surface2 p-2 rounded-xl border border-line";
        r.innerHTML=`<div class="col-span-5"><input type="text" value="${esc(c.name)}" data-f="name" class="w-full glass-input rounded-lg px-2.5 py-1.5 text-xs font-semibold"></div>
        <div class="col-span-4"><select data-f="grade" class="w-full glass-input rounded-lg px-2 py-1.5 text-xs font-bold text-brand-text">${Object.keys(GRADE_SCALE).map(g=>`<option ${c.grade===g?"selected":""}>${g}</option>`).join("")}</select></div>
        <div class="col-span-3 flex items-center space-x-1"><input type="number" min="1" max="6" value="${c.credits}" data-f="credits" class="w-full glass-input rounded-lg px-2 py-1.5 text-xs font-bold text-center"><button data-del class="text-slate-500 hover:text-red-400 p-1 text-xs"><i class="fa-solid fa-xmark"></i></button></div>`;
        r.querySelectorAll("[data-f]").forEach(el=>el.onchange=()=>{
          const f=el.dataset.f; c[f]=f==="credits"?(parseFloat(el.value)||0):el.value; self.calc();
        });
        r.querySelector("[data-del]").onclick=()=>{
          if(self.courses.length>1){self.courses=self.courses.filter(x=>x.id!==c.id);self.render();self.calc();}
        };
        box.appendChild(r);
      });
    },
    add(){self.courses.push({id:Date.now(),name:`Course ${self.courses.length+1}`,grade:"A",credits:3});self.render();self.calc();},
    calc(){
      let cr=0,pt=0;
      self.courses.forEach(c=>{pt+=(GRADE_SCALE[c.grade]||0)*c.credits;cr+=c.credits;});
      const gpa=cr>0?pt/cr:0;
      document.getElementById(prefix+"-res-cgpa").textContent=gpa.toFixed(2);
      document.getElementById(prefix+"-res-credits").textContent=cr;
      document.getElementById(prefix+"-res-points").textContent=pt.toFixed(1);
      if(onResult)onResult(gpa);
    }
  };
  self.render();self.calc();return self;
}

function honors(g){
  if(g>=4.3)return["Summa Cum Laude","Highest Honors Standing"];
  if(g>=4.05)return["Magna Cum Laude","High Honors Standing"];
  if(g>=3.85)return["Cum Laude","Honors Standing"];
  return["Keep Pushing","Reach 3.85 for Honors"];
}

function togglePw(id,btn){
  const i=document.getElementById(id);const show=i.type==="password";
  i.type=show?"text":"password";btn.innerHTML=`<i class="fa-solid ${show?"fa-eye-slash":"fa-eye"}"></i>`;
}
