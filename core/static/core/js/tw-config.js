/* Shared Tailwind config: every colour comes from CSS variables, so the whole site switches between light and dark. */
(function(){
  const v=n=>`rgb(var(--${n}) / <alpha-value>)`;
  const scale=Object.fromEntries([50,100,200,300,400,500,600,700,800,900,950].map(k=>[k,v("n"+k)]));
  const hue=n=>({300:v(n+"-300"),400:v(n+"-400")});
  const cfg={theme:{extend:{
    fontFamily:{sans:["Plus Jakarta Sans","Inter","system-ui","sans-serif"]},
    colors:{
      bg:v("bg"),surface:v("surface"),surface2:v("surface2"),line:v("line"),ink:v("ink"),
      gray:scale,slate:scale,
      brand:{DEFAULT:v("brand"),text:v("brand-text"),hover:v("brand-hover"),dark:v("bg"),card:v("surface"),border:v("line"),lightCard:v("surface2"),accent:v("brand"),gold:v("gold"),blue:"#3b82f6",purple:"#8b5cf6",teal:"#14b8a6"},
      brandGreen:v("brand"),brandGreenHover:v("brand-hover"),
      emerald:hue("emerald"),amber:hue("amber"),red:hue("red"),blue:hue("blue"),purple:hue("purple"),cyan:hue("cyan"),indigo:hue("indigo"),teal:hue("teal"),orange:hue("orange"),
    },
    textColor:{white:v("ink")},
    boxShadow:{soft:"var(--shadow-soft)",lift:"var(--shadow-lift)",glow:"var(--shadow-glow)"},
  }}};
  if(typeof module!=="undefined")module.exports=cfg;else window.tailwind.config=cfg;
})();
