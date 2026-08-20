// placeholder - replaced by the shop/summary implementation
(function(){ const G=window.GAME; G.scenes=G.scenes||{};
for (const n of ['shop','summary']) G.scenes[n]={enter(){this.t=0;},update(dt){this.t+=dt;},
draw(g){G.R(g,0,0,G.W,G.H,G.PAL.night);G.text(g,n.toUpperCase()+' PENDING',G.W/2,G.H/2,G.PAL.neonG,{align:'center',sc:2});},onDown(){},onUp(){}};})();
