// placeholder - replaced by the day scene implementation
(function(){ const G=window.GAME; G.scenes=G.scenes||{};
G.scenes.day={enter(){this.t=0;},update(dt){this.t+=dt;},draw(g){G.R(g,0,0,G.W,G.H,G.PAL.night);
G.text(g,'day SCENE PENDING',G.W/2,G.H/2,G.PAL.neonG,{align:'center',sc:2});},onDown(){},onUp(){}};})();
