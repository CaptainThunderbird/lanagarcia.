const tabs = [...document.querySelectorAll("[data-project-tab]")];
const panels = [...document.querySelectorAll("[data-project-panel]")];

function activateProject(name, moveFocus = false) {
  tabs.forEach((tab) => {
    const active = tab.dataset.projectTab === name;
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
    if (active && moveFocus) tab.focus();
  });

  panels.forEach((panel) => {
    panel.hidden = panel.dataset.projectPanel !== name;
  });
}

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => activateProject(tab.dataset.projectTab));
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let next = index;
    if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;
    activateProject(tabs[next].dataset.projectTab, true);
  });
});

const portraitCanvas = document.querySelector("#dot-portrait");
const portraitContext = portraitCanvas.getContext("2d");
const portraitImage = document.querySelector("#portrait-source");
const morphButton = document.querySelector("#morph-button");
const portraitStatus = document.querySelector("#portrait-status");
const shapeNames = ["portrait", "orbit", "wave"];
let portraitParticles = [];
let portraitMode = 0;
let portraitPointer = { x: -999, y: -999, active: false };
let portraitAnimation;
let portraitAutoTimer;

function heartPoint(index, total, width, height) {
  const t = (index / total) * Math.PI * 2;
  const x = 16 * Math.sin(t) ** 3;
  const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  return {
    x: width / 2 + x * width * 0.021,
    y: height / 2 - y * height * 0.022,
  };
}

function buildPortraitParticles() {
  const width = portraitCanvas.width;
  const height = portraitCanvas.height;
  const sampleWidth = 180;
  const sampleHeight = 200;
  const offscreen = document.createElement("canvas");
  offscreen.width = sampleWidth;
  offscreen.height = sampleHeight;
  const offscreenContext = offscreen.getContext("2d", { willReadFrequently: true });

  const imageRatio = portraitImage.naturalWidth / portraitImage.naturalHeight;
  const targetRatio = sampleWidth / sampleHeight;
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = portraitImage.naturalWidth;
  let sourceHeight = portraitImage.naturalHeight;

  if (imageRatio > targetRatio) {
    sourceWidth = portraitImage.naturalHeight * targetRatio;
    sourceX = (portraitImage.naturalWidth - sourceWidth) / 2;
  } else {
    sourceHeight = portraitImage.naturalWidth / targetRatio;
    sourceY = portraitImage.naturalHeight * 0.02;
    sourceHeight = Math.min(sourceHeight, portraitImage.naturalHeight - sourceY);
  }

  offscreenContext.drawImage(
    portraitImage,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    sampleWidth,
    sampleHeight,
  );

  const pixels = offscreenContext.getImageData(0, 0, sampleWidth, sampleHeight).data;
  const points = [];
  const step = 3;

  for (let y = 3; y < sampleHeight - 3; y += step) {
    for (let x = 3; x < sampleWidth - 3; x += step) {
      const dx = (x - sampleWidth / 2) / (sampleWidth * 0.5);
      const dy = (y - sampleHeight / 2) / (sampleHeight * 0.52);
      if (dx * dx + dy * dy > 1) continue;

      const offset = (y * sampleWidth + x) * 4;
      const red = pixels[offset];
      const green = pixels[offset + 1];
      const blue = pixels[offset + 2];
      const luminance = red * 0.299 + green * 0.587 + blue * 0.114;
      const saturation = Math.max(red, green, blue) - Math.min(red, green, blue);
      const keep = luminance < 178 || (luminance < 218 && saturation > 48);
      if (!keep) continue;

      const px = (x / sampleWidth) * width;
      const py = (y / sampleHeight) * height;
      const tint = luminance < 105 ? "#252433" : luminance < 170 ? "#df6d96" : "#fffaf1";
      points.push({ px, py, tint });
    }
  }

  const limited = points.length > 1150
    ? points.filter((_, index) => index % Math.ceil(points.length / 1150) === 0)
    : points;

  const bounds = limited.reduce((result, point) => ({
    minX: Math.min(result.minX, point.px),
    maxX: Math.max(result.maxX, point.px),
    minY: Math.min(result.minY, point.py),
    maxY: Math.max(result.maxY, point.py),
  }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });

  portraitParticles = limited.map((point, index) => {
    const portraitTarget = {
      x: width * 0.08 + ((point.px - bounds.minX) / Math.max(1, bounds.maxX - bounds.minX)) * width * 0.84,
      y: height * 0.05 + ((point.py - bounds.minY) / Math.max(1, bounds.maxY - bounds.minY)) * height * 0.9,
    };
    const angle = index * 2.399963;
    const radius = Math.sqrt(index / limited.length) * Math.min(width, height) * 0.39;
    const orbit = {
      x: width / 2 + Math.cos(angle) * radius,
      y: height / 2 + Math.sin(angle) * radius,
    };
    const heart = heartPoint(index, limited.length, width, height);
    return {
      x: width / 2 + (Math.random() - 0.5) * 40,
      y: height / 2 + (Math.random() - 0.5) * 40,
      vx: 0,
      vy: 0,
      color: point.tint,
      targets: [portraitTarget, orbit, heart],
    };
  });
}

function drawPortrait() {
  portraitContext.clearRect(0, 0, portraitCanvas.width, portraitCanvas.height);
  const scaleX = portraitCanvas.width / portraitCanvas.getBoundingClientRect().width;
  const pointerX = portraitPointer.x * scaleX;
  const pointerY = portraitPointer.y * scaleX;

  portraitParticles.forEach((particle) => {
    const target = particle.targets[portraitMode];
    particle.vx += (target.x - particle.x) * 0.018;
    particle.vy += (target.y - particle.y) * 0.018;

    if (portraitPointer.active) {
      const dx = particle.x - pointerX;
      const dy = particle.y - pointerY;
      const distanceSquared = dx * dx + dy * dy;
      if (distanceSquared < 6500 && distanceSquared > 0) {
        const force = (6500 - distanceSquared) / 6500;
        const distance = Math.sqrt(distanceSquared);
        particle.vx += (dx / distance) * force * 1.7;
        particle.vy += (dy / distance) * force * 1.7;
      }
    }

    particle.vx *= 0.9;
    particle.vy *= 0.9;
    particle.x += particle.vx;
    particle.y += particle.vy;

    portraitContext.beginPath();
    portraitContext.fillStyle = particle.color;
    portraitContext.arc(particle.x, particle.y, portraitMode === 0 ? 1.55 : 1.8, 0, Math.PI * 2);
    portraitContext.fill();
  });

  portraitAnimation = requestAnimationFrame(drawPortrait);
}

function changePortraitShape() {
  portraitMode = (portraitMode + 1) % shapeNames.length;
  portraitStatus.textContent = `${shapeNames[portraitMode]} / 0${portraitMode + 1}`;
  window.clearTimeout(portraitAutoTimer);
  portraitAutoTimer = window.setTimeout(changePortraitShape, 6500);
}

function startPortrait() {
  buildPortraitParticles();
  cancelAnimationFrame(portraitAnimation);
  drawPortrait();
  portraitAutoTimer = window.setTimeout(changePortraitShape, 6500);
}

if (portraitImage.complete) startPortrait();
else portraitImage.addEventListener("load", startPortrait, { once: true });

portraitCanvas.addEventListener("pointermove", (event) => {
  const rect = portraitCanvas.getBoundingClientRect();
  portraitPointer = { x: event.clientX - rect.left, y: event.clientY - rect.top, active: true };
});
portraitCanvas.addEventListener("pointerleave", () => { portraitPointer.active = false; });
portraitCanvas.addEventListener("click", changePortraitShape);
morphButton.addEventListener("click", changePortraitShape);

const gameCanvas = document.querySelector("#game-canvas");
const gameContext = gameCanvas.getContext("2d");
const gameToggle = document.querySelector("#game-toggle");
const gameHud = document.querySelector("#game-hud");
const gameScore = document.querySelector("#game-score");
const gameMessage = document.querySelector("#game-message");
const gameReset = document.querySelector("#game-reset");
const keys = { left: false, right: false, jump: false };
let gameActive = false;
let gameFrame;
let platforms = [];
let stars = [];
let collected = 0;
let previousTime = 0;

const player = {
  x: 70,
  y: 0,
  width: 28,
  height: 32,
  vx: 0,
  vy: 0,
  grounded: false,
};

function sizeGame() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  gameCanvas.width = Math.floor(window.innerWidth * ratio);
  gameCanvas.height = Math.floor(window.innerHeight * ratio);
  gameCanvas.style.width = `${window.innerWidth}px`;
  gameCanvas.style.height = `${window.innerHeight}px`;
  gameContext.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function makeLevel() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  platforms = [
    { x: 20, y: height - 58, width: Math.max(150, width * 0.2), height: 8 },
    { x: width * 0.25, y: height - 155, width: Math.max(110, width * 0.14), height: 8 },
    { x: width * 0.46, y: height - 245, width: Math.max(120, width * 0.16), height: 8 },
    { x: width * 0.68, y: height - 160, width: Math.max(110, width * 0.14), height: 8 },
    { x: width * 0.84, y: height - 250, width: Math.max(90, width * 0.12), height: 8 },
  ];
  stars = platforms.slice(1).map((platform, index) => ({
    x: platform.x + platform.width / 2,
    y: platform.y - 28,
    collected: false,
    color: ["#f4a4bb", "#ffd938", "#6fcf9d", "#c9b8ed"][index],
  }));
}

function resetGame() {
  sizeGame();
  makeLevel();
  player.x = 70;
  player.y = window.innerHeight - 100;
  player.vx = 0;
  player.vy = 0;
  player.grounded = false;
  collected = 0;
  gameScore.textContent = "0 / 4";
  gameMessage.textContent = "Move with A/D or ←/→. Jump with W, ↑, or Space.";
}

function drawStar(x, y, radius, color) {
  gameContext.save();
  gameContext.translate(x, y);
  gameContext.rotate(performance.now() / 700);
  gameContext.beginPath();
  for (let index = 0; index < 10; index += 1) {
    const angle = -Math.PI / 2 + index * Math.PI / 5;
    const length = index % 2 === 0 ? radius : radius * 0.45;
    const px = Math.cos(angle) * length;
    const py = Math.sin(angle) * length;
    if (index === 0) gameContext.moveTo(px, py);
    else gameContext.lineTo(px, py);
  }
  gameContext.closePath();
  gameContext.fillStyle = color;
  gameContext.fill();
  gameContext.strokeStyle = "#252433";
  gameContext.lineWidth = 2;
  gameContext.stroke();
  gameContext.restore();
}

function drawPlayer() {
  const x = Math.round(player.x);
  const y = Math.round(player.y);
  gameContext.fillStyle = "#252433";
  gameContext.fillRect(x + 4, y, 20, 4);
  gameContext.fillRect(x, y + 4, 28, 20);
  gameContext.fillStyle = "#f4a4bb";
  gameContext.fillRect(x + 4, y + 4, 20, 20);
  gameContext.fillStyle = "#fffaf1";
  gameContext.fillRect(x + 7, y + 9, 5, 5);
  gameContext.fillRect(x + 17, y + 9, 5, 5);
  gameContext.fillStyle = "#252433";
  gameContext.fillRect(x + 9, y + 11, 2, 2);
  gameContext.fillRect(x + 19, y + 11, 2, 2);
  gameContext.fillRect(x + 10, y + 18, 9, 2);
  gameContext.fillRect(x + 3, y + 24, 8, 8);
  gameContext.fillRect(x + 18, y + 24, 8, 8);
  gameContext.fillStyle = "#ffd938";
  gameContext.fillRect(x + 5, y + 25, 4, 5);
  gameContext.fillRect(x + 20, y + 25, 4, 5);
}

function updateGame(delta) {
  const speed = 0.42 * delta;
  const gravity = 0.0023 * delta;
  const previousBottom = player.y + player.height;

  if (keys.left) player.vx -= speed;
  if (keys.right) player.vx += speed;
  player.vx *= Math.pow(0.86, delta / 16.67);
  player.vx = Math.max(-6, Math.min(6, player.vx));

  if (keys.jump && player.grounded) {
    player.vy = -11.5;
    player.grounded = false;
  }

  player.vy += gravity * delta;
  player.vy = Math.min(14, player.vy);
  player.x += player.vx * (delta / 16.67);
  player.y += player.vy * (delta / 16.67);
  player.grounded = false;

  platforms.forEach((platform) => {
    const intersectsX = player.x + player.width > platform.x && player.x < platform.x + platform.width;
    const crossedTop = previousBottom <= platform.y + 5 && player.y + player.height >= platform.y;
    if (player.vy >= 0 && intersectsX && crossedTop) {
      player.y = platform.y - player.height;
      player.vy = 0;
      player.grounded = true;
    }
  });

  if (player.x < 0) { player.x = 0; player.vx = 0; }
  if (player.x + player.width > window.innerWidth) {
    player.x = window.innerWidth - player.width;
    player.vx = 0;
  }
  if (player.y > window.innerHeight + 70) {
    player.x = 70;
    player.y = window.innerHeight - 120;
    player.vx = 0;
    player.vy = 0;
  }

  stars.forEach((star) => {
    if (star.collected) return;
    const distance = Math.hypot(player.x + player.width / 2 - star.x, player.y + player.height / 2 - star.y);
    if (distance < 28) {
      star.collected = true;
      collected += 1;
      gameScore.textContent = `${collected} / 4`;
      if (collected === 4) gameMessage.textContent = "Level clear! You found every project star.";
    }
  });
}

function renderGame(time = 0) {
  if (!gameActive) return;
  const delta = Math.min(32, time - previousTime || 16.67);
  previousTime = time;
  updateGame(delta);
  gameContext.clearRect(0, 0, window.innerWidth, window.innerHeight);

  platforms.forEach((platform, index) => {
    gameContext.fillStyle = "rgba(37,36,51,.28)";
    gameContext.fillRect(platform.x + 4, platform.y + 5, platform.width, platform.height);
    gameContext.fillStyle = index % 2 ? "#f4a4bb" : "#6fcf9d";
    gameContext.fillRect(platform.x, platform.y, platform.width, platform.height);
    gameContext.strokeStyle = "#252433";
    gameContext.lineWidth = 2;
    gameContext.strokeRect(platform.x, platform.y, platform.width, platform.height);
  });

  stars.forEach((star) => {
    if (!star.collected) drawStar(star.x, star.y, 13, star.color);
  });
  drawPlayer();
  gameFrame = requestAnimationFrame(renderGame);
}

function setGameMode(active) {
  gameActive = active;
  document.body.classList.toggle("game-active", active);
  gameToggle.setAttribute("aria-pressed", String(active));
  gameToggle.querySelector(".game-label").textContent = active ? "Exit game" : "Game mode";
  gameHud.hidden = !active;

  cancelAnimationFrame(gameFrame);
  if (active) {
    gameToggle.blur();
    resetGame();
    previousTime = 0;
    gameFrame = requestAnimationFrame(renderGame);
  } else {
    gameContext.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
  }
}

gameToggle.addEventListener("click", () => setGameMode(!gameActive));
gameReset.addEventListener("click", resetGame);

function setControl(key, pressed) {
  if (key === "a" || key === "ArrowLeft") keys.left = pressed;
  if (key === "d" || key === "ArrowRight") keys.right = pressed;
  if (key === "w" || key === "ArrowUp" || key === " ") keys.jump = pressed;
}

window.addEventListener("keydown", (event) => {
  if (!gameActive || event.target.matches("button, a, input, textarea, select")) return;
  if (["a", "d", "w", "ArrowLeft", "ArrowRight", "ArrowUp", " "].includes(event.key)) {
    event.preventDefault();
    setControl(event.key, true);
  }
});
window.addEventListener("keyup", (event) => setControl(event.key, false));

document.querySelectorAll("[data-game-control]").forEach((button) => {
  const control = button.dataset.gameControl;
  const key = control === "left" ? "ArrowLeft" : control === "right" ? "ArrowRight" : "ArrowUp";
  const press = (event) => { event.preventDefault(); setControl(key, true); };
  const release = (event) => { event.preventDefault(); setControl(key, false); };
  button.addEventListener("pointerdown", press);
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("pointerleave", release);
});

window.addEventListener("resize", () => {
  if (gameActive) resetGame();
});

const keyboardNotes = {
  a: ["C4", 261.63],
  s: ["D4", 293.66],
  d: ["E4", 329.63],
  f: ["F4", 349.23],
  j: ["G4", 392],
  k: ["A4", 440],
  l: ["B4", 493.88],
  ";": ["C5", 523.25],
};

const keyboardShell = document.querySelector(".keyboard-shell");
const keyboardStatus = document.querySelector("#keyboard-status");
let keyboardAudioContext;
let keyboardTimer;

function playKeyboardNote(key, button) {
  const note = keyboardNotes[key];
  if (!note) return;

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (AudioContext) {
    keyboardAudioContext ||= new AudioContext();
    const oscillator = keyboardAudioContext.createOscillator();
    const gain = keyboardAudioContext.createGain();

    oscillator.type = "triangle";
    oscillator.frequency.value = note[1];
    gain.gain.setValueAtTime(0.13, keyboardAudioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, keyboardAudioContext.currentTime + 0.42);

    oscillator.connect(gain);
    gain.connect(keyboardAudioContext.destination);
    oscillator.start();
    oscillator.stop(keyboardAudioContext.currentTime + 0.42);
  }

  const activeKey = button || document.querySelector(`[data-key="${key}"]`);
  activeKey?.classList.add("active");
  keyboardShell.classList.add("playing");
  keyboardStatus.textContent = `${note[0]} is playing`;

  window.clearTimeout(keyboardTimer);
  keyboardTimer = window.setTimeout(() => {
    activeKey?.classList.remove("active");
    keyboardShell.classList.remove("playing");
    keyboardStatus.textContent = "Ready for the next note";
  }, 280);
}

document.querySelectorAll(".music-key").forEach((button) => {
  button.addEventListener("click", () => playKeyboardNote(button.dataset.key, button));
});

window.addEventListener("keydown", (event) => {
  if (gameActive || event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.target.matches("input, textarea, select")) return;
  const key = event.key.toLowerCase();
  if (keyboardNotes[key]) playKeyboardNote(key);
});
