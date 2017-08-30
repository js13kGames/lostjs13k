/* jshint node: true */
/* jshint loopfunc: true */

"use strict";

var raf = require('./raf');
var key = require('./key');
var gen = require('./gen');
var geo = require('./geo');

var canvas = document.querySelector('#game');
var ctx = canvas.getContext('2d');

key.init(canvas);

var entities = [];

const SECTOR_SIZE = 3000;

const player = {
  x: 20,
  y: -350,
  h: 32,
  w: 16,
  dx: 60,
  dy: 0,
  onGround: false,
  mx: 0,
  my: 0,
  jetpack: false,
  draw: function(ctx){
    ctx.fillStyle="#FF0000";
    fillRect(ctx, this.x, this.y, this.w, this.h);
  }
};

entities.push(player);

key.typed(74, function(){
  player.jetpack = !player.jetpack;
});

key.typed(106, function(){
  player.jetpack = !player.jetpack;
});

const camera = {
  x: 20,
  y: 20,
  zoom: 0.3
};

key.typed(90, function(){
  if (camera.zoom >= 1)
    camera.zoom = 0.3;
  else
    camera.zoom += 0.1;
});

key.typed(122, function(){
  if (camera.zoom >= 1)
    camera.zoom = 0.3;
  else
    camera.zoom += 0.1;
});

const debug = true;

const sectors = {};
sectors["0:0"] = gen.generateSegment(0, 0, SECTOR_SIZE, SECTOR_SIZE);
sectors["-1:0"] = gen.generateSegment(-SECTOR_SIZE, 0, SECTOR_SIZE, SECTOR_SIZE);

function sortStones(){
  let tmx;
  if (player.dx > 0){
    tmx = Math.floor((player.x+player.w) / SECTOR_SIZE);
  } else {
    tmx = Math.floor(player.x / SECTOR_SIZE);
  }
  const tmy = Math.floor((player.y+player.h) / SECTOR_SIZE);
  const sector = sectors[tmx+":"+tmy];
  if (sector){
    sector.stones.sort(function(a, b){
      return Math.abs((a.x - player.x) + (a.y - player.y)) - 
             Math.abs((b.x - player.x) + (b.y - player.y));
    });
  }
  setTimeout(sortStones, 5000);
}

setTimeout(sortStones, 5000);

function update(elapsed){
  entities.forEach(function(e){
    // TODO: Optimize, only do this if moved (or gravity pulled)
    // Gravity
    e.dy += elapsed * 1500;
    if (e.jetpack){
      e.dy -= elapsed * 1550;
    }
    const tx = e.x + e.dx * elapsed;
    var ty = e.y + e.dy * elapsed;
    let tmx;
    if (e.dx > 0){
      tmx = Math.floor((tx+e.w) / SECTOR_SIZE);
    } else {
      tmx = Math.floor(tx / SECTOR_SIZE);
    }
    const tmy = Math.floor((ty+e.h) / SECTOR_SIZE);
    let vCollision = false;
    let hCollision = false;
    let sector = sectors[tmx+":"+tmy];
    if (sector){
      if (e.dx !== 0){
        hCollision = sector.stones.find(function(s){
          //TODO: Optimize, sort stones by distance to entity
          if (e.dx > 0){
            if (geo.inside([tx+e.w,ty+e.h/2], s.vs)){
              return true;
            }
          } else if (e.dx < 0){
            if (geo.inside([tx,ty+e.h/2], s.vs)){
              return true;
            }
          }
          return false;
        });
      }
      vCollision = sector.stones.find(function(s){
        if (geo.inside([tx+e.w/2,ty+e.h], s.vs)){
          return true;
        }
        if (e.dy > 100){
          //Prevent falling through thin borders at high acc
          if (geo.polygonIntersects({
            a: {x: e.x+e.w/2, y: e.y+e.h},
            b: {x: tx+e.w/2, y: ty+e.h}},
            s.vs
          )){
           return true; 
          }
        }
        return false;
      });
    }
    if (vCollision){
      e.dy = 0;
      // Friction
      if (e.dx !== 0){ 
        e.dx -= e.dx > 0 ? 15 : -15; //TODO: Based on stone surface?
      }
      e.onGround = true;
    } else {
      e.y = ty;
      e.onGround = false;
    }
    // TODO: Remove hard collision, fix slopes
    if (!hCollision){
      e.x = tx;
      /*if (e.onGround && e.dx != 0)
        e.dy = -50; // Chibi jump, for slopes!*/
    } else if (e.dy < -50 || e.dy > 30){ // Hard collision
      if (e.dx < 0){
        e.dx = 120;
      } else if (e.dx > 0){
        e.dx = -120;
      }
    }
  });
  // Should we load another fragment?
  checkLoadFragment();
  player.mx = Math.floor(player.x / SECTOR_SIZE);
  player.my = Math.floor(player.y / SECTOR_SIZE);
  camera.x = player.x;
  camera.y = player.y;
}

function createAndDeleteSectorAt(cx, cy, dx, dy) {
  if (sectors[(player.mx+cx)+":"+(player.my+cy)]){
    
  } else {
    generateSector(cx, cy);
  }
  if (sectors[(player.mx+dx)+":"+(player.my+dy)]){
    delete sectors[(player.mx+dx)+":"+(player.my+dy)];
  }
}

function checkLoadFragment(){
  const leftZone = player.x < player.mx * SECTOR_SIZE + SECTOR_SIZE / 2;
  const rightZone = player.x > player.mx * SECTOR_SIZE + SECTOR_SIZE / 2;
  const downZone = player.y > player.my * SECTOR_SIZE + SECTOR_SIZE / 2;
  const upZone = player.y < player.my * SECTOR_SIZE + SECTOR_SIZE / 2;
  if (rightZone){
    createAndDeleteSectorAt(1, 0, -1, 0);
    createAndDeleteSectorAt(0, 0, -1, 1);
    createAndDeleteSectorAt(0, 0, -1, -1);
    if (upZone){
      createAndDeleteSectorAt(1, -1, -1, -1);
    }
    if (downZone){
      createAndDeleteSectorAt(1, 1, -1, 1);
      
    }
  } else if (leftZone){
    createAndDeleteSectorAt(-1, 0, 1, 0);
    createAndDeleteSectorAt(0, 0,  1, -1);
    createAndDeleteSectorAt(0, 0,  1, 1);
    if (upZone){
      createAndDeleteSectorAt(-1, -1, 1, -1);
    }
    if (downZone){
      createAndDeleteSectorAt(-1, 1, 1, 1);
    }
  } 
  if (upZone){
    createAndDeleteSectorAt(0, -1, 0, 1);
    createAndDeleteSectorAt(0, 0,  1, 1);
    createAndDeleteSectorAt(0, 0, -1, 1);
  } else if (downZone){
    createAndDeleteSectorAt(0, 1, 0, -1);
    createAndDeleteSectorAt(0, 0, 1, -1);
    createAndDeleteSectorAt(0, 0, -1, -1);
  }
}

function generateSector(dx, dy){
  if (player.my+dy < 0)
    return;
  sectors[(player.mx+dx)+":"+(player.my+dy)] = gen.generateSegment((player.mx+dx)*SECTOR_SIZE, (player.my+dy)*SECTOR_SIZE, SECTOR_SIZE, SECTOR_SIZE);
}

function transX(x){
  return (x - camera.x) * camera.zoom + canvas.width / 2;
}

function transY(y){
  return (y - camera.y) * camera.zoom + canvas.height / 2;
}

function transW(w){
  return w * camera.zoom;
}

function transH(h){
  return h * camera.zoom;
}

function moveTo(ctx, x, y){
  ctx.moveTo(transX(x), transY(y));
}

function lineTo(ctx, x, y){
  ctx.lineTo(transX(x), transY(y));
}

function fillRect(ctx, x, y, w, h){
  ctx.fillRect(transX(x), transY(y), transW(w), transH(h));  
}

function draw(){
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Background
  ctx.fillStyle="#F00";
  ctx.fillRect(0, 0, 400, 400);
  ctx.fillStyle="#87CEEB";
  ctx.fillRect(0, transY(-500), canvas.width, transH(500));
  for (var sector in sectors){
    // TODO: Calculate distance, only draw based on zoom
    sector = sectors[sector];
    sector.bgStones.forEach(function(s){
      if (Math.abs((s.x - player.x) + (s.y - player.y)) > 1000)
        return;
      ctx.fillStyle = s.color;
      ctx.strokeStyle = s.color;
      ctx.beginPath();
      moveTo(ctx, s.vs[0][0], s.vs[0][1]);
      for (var i = 1; i < s.vs.length; i++){
        lineTo(ctx, s.vs[i][0], s.vs[i][1]);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
  }
  
  entities.forEach(function(e){
    e.draw(ctx);
  });
  for (sector in sectors){
    sector = sectors[sector];
    sector.stones.forEach(function(s){
      if (Math.abs((s.x - player.x) + (s.y - player.y)) > 1000)
        return;
      ctx.fillStyle = '#000';
      ctx.strokeStyle = '#000';
      ctx.beginPath();
      moveTo(ctx, s.vs[0][0], s.vs[0][1]);
      for (var i = 1; i < s.vs.length; i++){
        lineTo(ctx, s.vs[i][0], s.vs[i][1]);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
  }
  if (player.y > 0){
    ctx.font = "16px sans-serif";
    ctx.fillStyle = "white";
    ctx.fillText(Math.floor(player.y/20)+"mt", 300,20);
  }
  if (player.jetpack){
    ctx.font = "16px sans-serif";
    ctx.fillStyle = "white";
    ctx.fillText("Jetpack", 300,40);
  }
  if (debug){
    // TODO: Remove from final dist, may be
    ctx.font = "10px Arial";
    ctx.fillStyle = "white";
    ctx.fillText("Player",10,10);
    ctx.fillText("x: "+player.x,10,20);
    ctx.fillText("y: "+player.y,10,30);
    ctx.fillText("dx: "+player.dx,10,40);
    ctx.fillText("dy: "+player.dy,10,50);
    ctx.fillText("mx: "+player.mx,10,60);
    ctx.fillText("my: "+player.my,10,70);
    ctx.fillText("sectors: "+Object.keys(sectors),10,80);
    const leftZone = player.x < player.mx * SECTOR_SIZE + SECTOR_SIZE / 2;
    const rightZone = player.x > player.mx * SECTOR_SIZE + SECTOR_SIZE / 2;
    const downZone = player.y > player.my * SECTOR_SIZE + SECTOR_SIZE / 2;
    const upZone = player.y < player.my * SECTOR_SIZE + SECTOR_SIZE / 2;
    ctx.fillText("leftZone: "+leftZone,10,90);
    ctx.fillText("rightZone: "+rightZone,10,100);
    ctx.fillText("downZone: "+downZone,10,110);
    ctx.fillText("upZone: "+upZone,10,120);
    ctx.fillText("zoom: "+camera.zoom,10,130);
  }
}

function keyboard(){
  if (player.onGround){
    if (key.isDown(38)){
      player.dy = -500;
    }
    if (key.isDown(37)){
      if (player.dx > 0){
        player.dx -= 40;
      } else {
        player.dx = -120;
      }
    }
    if (key.isDown(39)){
      if (player.dx < 0){
        player.dx += 40;
      } else {
        player.dx = 120;
      }
    }
  } else if (player.jetpack){
    if (key.isDown(37)){
      player.dx -= 3;
    }
    if (key.isDown(39)){
      player.dx += 3;
    }
  }
}

raf.start(function(elapsed) {
  keyboard();
  //TODO: Framerate limiter?
  update(elapsed);
  draw();
});
