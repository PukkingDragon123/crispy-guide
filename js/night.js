// placeholder - replaced by the night scene implementation
(function(){ const G=window.GAME; G.scenes=G.scenes||{};
G.scenes.night={enter(){this.t=0;},update(dt){this.t+=dt;},draw(g){G.R(g,0,0,G.W,G.H,G.PAL.night);
G.text(g,'night SCENE PENDING',G.W/2,G.H/2,G.PAL.neonG,{align:'center',sc:2});},onDown(){},onUp(){}};})();
