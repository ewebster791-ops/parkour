const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const statusEl = document.getElementById('status');
const coinsEl = document.getElementById('coins');

const keys = { left: false, right: false };

const world = {
  width: 2600,
  height: canvas.height,
  gravity: 0.7,
  friction: 0.8,
  cameraX: 0,
};

const player = {
  x: 80,
  y: 360,
  w: 34,
  h: 44,
  vx: 0,
  vy: 0,
  speed: 5.2,
  jumpPower: 13.5,
  grounded: false,
  color: '#ffb703',
  coins: 0,
  lives: 1,
};

const level = {
  platforms: [
    { x: 0, y: 470, w: 540, h: 70 },
    { x: 620, y: 430, w: 150, h: 24 },
    { x: 820, y: 390, w: 180, h: 24 },
    { x: 1040, y: 340, w: 180, h: 24 },
    { x: 1320, y: 400, w: 220, h: 24 },
    { x: 1580, y: 360, w: 180, h: 24 },
    { x: 1800, y: 300, w: 150, h: 24 },
    { x: 2000, y: 250, w: 190, h: 24 },
    { x: 2250, y: 470, w: 350, h: 70 },
  ],
  spikes: [
    { x: 540, y: 470, w: 80, h: 22 },
    { x: 1180, y: 470, w: 70, h: 22 },
    { x: 1750, y: 470, w: 80, h: 22 },
    { x: 2140, y: 470, w: 70, h: 22 },
  ],
  coins: [
    { x: 660, y: 390, r: 9 },
    { x: 870, y: 350, r: 9 },
    { x: 1090, y: 300, r: 9 },
    { x: 1360, y: 360, r: 9 },
    { x: 1640, y: 320, r: 9 },
    { x: 1860, y: 260, r: 9 },
    { x: 2080, y: 210, r: 9 },
  ],
  flag: { x: 2460, y: 400, w: 18, h: 70 },
};

function resetPlayer() {
  player.x = 80;
  player.y = 360;
  player.vx = 0;
  player.vy = 0;
  player.grounded = false;
  player.coins = 0;
  world.cameraX = 0;
  statusEl.textContent = 'Run!';
  coinsEl.textContent = 'Coins: 0';
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function intersects(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function circleHitsRect(circle, rect) {
  const closestX = clamp(circle.x, rect.x, rect.x + rect.w);
  const closestY = clamp(circle.y, rect.y, rect.y + rect.h);
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return dx * dx + dy * dy < circle.r * circle.r;
}

function handleInput() {
  if (keys.left) {
    player.vx = -player.speed;
  } else if (keys.right) {
    player.vx = player.speed;
  } else {
    player.vx *= world.friction;
    if (Math.abs(player.vx) < 0.1) player.vx = 0;
  }
}

function updatePlayer() {
  handleInput();

  player.vy += world.gravity;
  player.x += player.vx;
  player.y += player.vy;

  player.grounded = false;

  for (const platform of level.platforms) {
    const prevBottom = player.y - player.vy + player.h;
    const prevTop = player.y - player.vy;

    if (intersects(player, platform)) {
      if (player.vy >= 0 && prevBottom <= platform.y + 12) {
        player.y = platform.y - player.h;
        player.vy = 0;
        player.grounded = true;
      } else if (player.vy < 0 && prevTop >= platform.y + platform.h - 12) {
        player.y = platform.y + platform.h;
        player.vy = 0;
      } else if (player.vx > 0 && player.x < platform.x + platform.w) {
        player.x = platform.x - player.w;
        player.vx = 0;
      } else if (player.vx < 0 && player.x + player.w > platform.x) {
        player.x = platform.x + platform.w;
        player.vx = 0;
      }
    }
  }

  for (const spike of level.spikes) {
    if (intersects(player, spike)) {
      resetPlayer();
      return;
    }
  }

  level.coins = level.coins.filter((coin) => {
    if (circleHitsRect(coin, { x: player.x, y: player.y, w: player.w, h: player.h })) {
      player.coins += 1;
      coinsEl.textContent = `Coins: ${player.coins}`;
      return false;
    }
    return true;
  });

  const finish = { x: level.flag.x, y: level.flag.y, w: level.flag.w, h: level.flag.h };
  if (intersects(player, finish)) {
    statusEl.textContent = 'You win! Press R to play again';
    player.vx = 0;
    player.vy = 0;
  }

  player.x = clamp(player.x, 0, world.width - player.w);

  if (player.y > canvas.height + 150) {
    resetPlayer();
  }

  world.cameraX = clamp(player.x - canvas.width / 2, 0, world.width - canvas.width);
}

function drawBackground() {
  ctx.fillStyle = '#9be7ff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 12; i += 1) {
    const x = (i * 220) - (world.cameraX * 0.2) % 220;
    ctx.fillStyle = '#d8f3ff';
    ctx.beginPath();
    ctx.arc(x, 100 + (i % 3) * 24, 42, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#6dcf64';
  ctx.fillRect(0, 470, canvas.width, 70);
}

function drawPlatforms() {
  for (const platform of level.platforms) {
    const x = platform.x - world.cameraX;
    ctx.fillStyle = '#4d4d4d';
    ctx.fillRect(x, platform.y, platform.w, platform.h);
    ctx.fillStyle = '#9f7b48';
    ctx.fillRect(x, platform.y, platform.w, 5);
  }

  for (const spike of level.spikes) {
    const x = spike.x - world.cameraX;
    ctx.fillStyle = '#f04d4d';
    ctx.beginPath();
    ctx.moveTo(x, spike.y + spike.h);
    ctx.lineTo(x + spike.w / 2, spike.y);
    ctx.lineTo(x + spike.w, spike.y + spike.h);
    ctx.closePath();
    ctx.fill();
  }
}

function drawCoins() {
  for (const coin of level.coins) {
    const x = coin.x - world.cameraX;
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(x, coin.y, coin.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f7b801';
    ctx.fillRect(x - 2, coin.y - 5, 4, 10);
  }
}

function drawPlayer() {
  const drawX = player.x - world.cameraX;
  ctx.fillStyle = player.color;
  ctx.fillRect(drawX, player.y, player.w, player.h);

  ctx.fillStyle = '#111';
  ctx.fillRect(drawX + 8, player.y + 12, 6, 6);
  ctx.fillRect(drawX + player.w - 14, player.y + 12, 6, 6);
}

function drawGoal() {
  const flagX = level.flag.x - world.cameraX;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(flagX, level.flag.y, level.flag.w, level.flag.h);
  ctx.fillStyle = '#ff7b00';
  ctx.beginPath();
  ctx.moveTo(flagX + level.flag.w, level.flag.y + 10);
  ctx.lineTo(flagX + 55, level.flag.y + 20);
  ctx.lineTo(flagX + level.flag.w, level.flag.y + 32);
  ctx.closePath();
  ctx.fill();
}

function draw() {
  drawBackground();
  drawPlatforms();
  drawCoins();
  drawGoal();
  drawPlayer();
}

function loop() {
  updatePlayer();
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener('keydown', (event) => {
  if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
    keys.left = true;
  }

  if (event.code === 'ArrowRight' || event.code === 'KeyD') {
    keys.right = true;
  }

  if ((event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') && player.grounded) {
    player.vy = -player.jumpPower;
    player.grounded = false;
  }

  if (event.code === 'KeyR') {
    resetPlayer();
  }
});

window.addEventListener('keyup', (event) => {
  if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
    keys.left = false;
  }

  if (event.code === 'ArrowRight' || event.code === 'KeyD') {
    keys.right = false;
  }
});

resetPlayer();
loop();
