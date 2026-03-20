const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let bikeImg = new Image();
bikeImg.src = "assets/bike.png";

let engineSound = new Audio("assets/engine.mp3");
engineSound.loop = true;

let particles = [];

let bike, keys = {}, cameraX = 0, playerName = "";

// 🌍 SUPABASE (DU SKAL ÆNDRE!)
const SUPABASE_URL = "DIN_URL";
const SUPABASE_KEY = "DIN_KEY";

function startGame() {
  playerName = document.getElementById("nameInput").value || "Anon";

  document.getElementById("menu").style.display = "none";
  canvas.style.display = "block";

  engineSound.play();

  bike = {
    x: 0,
    y: 300,
    speed: 0,
    velY: 0,
    rot: 0,
    alive: true
  };

  loop();
}

// 🎮 WASD controls
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// 🌄 Terræn + mål
function ground(x) {
  return 350 + Math.sin(x * 0.01) * 40;
}

let goal = 2000;

function update() {
  if (!bike.alive) return;

  if (keys["d"]) bike.speed += 0.3;
  if (keys["a"]) bike.speed -= 0.2;

  bike.speed *= 0.98;
  bike.x += bike.speed;

  bike.velY += 0.7;
  bike.y += bike.velY;

  let g = ground(bike.x);

  if (bike.y > g) {
    bike.y = g;
    bike.velY = 0;

    if (Math.abs(bike.rot) > 1.5) crash();
  }

  if (keys["w"] && bike.y >= g) {
    bike.velY = -12;
  }

  // wheelie
  if (keys["shift"]) bike.rot -= 0.08;

  // rotation
  if (bike.y < g) {
    if (keys["d"]) bike.rot += 0.05;
    if (keys["a"]) bike.rot -= 0.05;
  } else {
    bike.rot *= 0.8;
  }

  // 💨 partikler
  particles.push({
    x: 200,
    y: bike.y,
    life: 20
  });

  particles.forEach(p => p.life--);
  particles = particles.filter(p => p.life > 0);

  // 🎥 kamera
  cameraX += (bike.x - cameraX - 200) * 0.1;

  // 🏁 mål
  if (bike.x > goal) {
    alert("DU VANDT!");
    saveScore(bike.x);
    location.reload();
  }
}

function crash() {
  bike.alive = false;
  engineSound.pause();
  alert("CRASH 💥");
  saveScore(bike.x);
  location.reload();
}

// 🌍 ONLINE LEADERBOARD
async function saveScore(score) {
  await fetch(SUPABASE_URL + "/rest/v1/scores", {
    method: "POST",
    headers: {
      "apikey": SUPABASE_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: playerName,
      score: Math.floor(score)
    })
  });
}

async function loadLeaderboard() {
  document.getElementById("menu").style.display = "none";
  document.getElementById("leaderboard").style.display = "block";

  let res = await fetch(SUPABASE_URL + "/rest/v1/scores?select=*&order=score.desc");
  let data = await res.json();

  let list = document.getElementById("scores");
  list.innerHTML = "";

  data.slice(0,10).forEach(s => {
    let li = document.createElement("li");
    li.textContent = s.name + " - " + s.score;
    list.appendChild(li);
  });
}

function backMenu() {
  document.getElementById("leaderboard").style.display = "none";
  document.getElementById("menu").style.display = "block";
}

// 🎨 draw
function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // jord
  ctx.beginPath();
  for (let x=0;x<canvas.width;x++){
    ctx.lineTo(x, ground(x+cameraX));
  }
  ctx.lineTo(canvas.width,500);
  ctx.fillStyle = "green";
  ctx.fill();

  // bike sprite
  ctx.save();
  ctx.translate(200, bike.y);
  ctx.rotate(bike.rot);
  ctx.drawImage(bikeImg, -40, -40, 80, 80);
  ctx.restore();

  // 💨 partikler
  particles.forEach(p=>{
    ctx.fillStyle = "rgba(150,150,150," + (p.life/20) + ")";
    ctx.fillRect(p.x, p.y, 5, 5);
  });
}

function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}
