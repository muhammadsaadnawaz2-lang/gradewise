/* Theme switcher: light (default) or dark, remembered in the browser. */
window.gwTheme=function(){
  const next=document.documentElement.dataset.theme==="dark"?"light":"dark";
  document.documentElement.dataset.theme=next;
  try{localStorage.setItem("gw-theme",next)}catch(e){}
  window.dispatchEvent(new CustomEvent("gw-theme",{detail:next}));
};
document.addEventListener("click",e=>{if(e.target.closest("[data-theme-toggle]"))window.gwTheme()});
