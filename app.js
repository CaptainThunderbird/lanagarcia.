const tabs = [...document.querySelectorAll("[data-project-tab]")];
const panels = [...document.querySelectorAll("[data-project-panel]")];

let interfaceAudioContext;

function getInterfaceAudioContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;

  interfaceAudioContext ||= new AudioContext();
  if (interfaceAudioContext.state === "suspended") {
    interfaceAudioContext.resume().catch(() => {});
  }
  return interfaceAudioContext;
}

function scheduleInterfaceTone(context, {
  start = context.currentTime,
  duration = 0.08,
  frequency = 440,
  endFrequency = frequency,
  type = "square",
  volume = 0.035,
}) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const finish = start + duration;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(endFrequency, finish);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, finish);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(finish + 0.01);
}

function playInterfaceSound(target) {
  const context = getInterfaceAudioContext();
  if (!context) return;
  const now = context.currentTime;
  const label = (target.textContent || target.getAttribute("aria-label") || "pixel").trim();
  const pitchSet = [392, 440, 493.88, 523.25];
  const pitch = pitchSet[[...label].reduce((sum, character) => sum + character.charCodeAt(0), 0) % pitchSet.length];
  const tone = (offset, frequency, duration, type = "square", endFrequency = frequency, volume = 0.035) => {
    scheduleInterfaceTone(context, { start: now + offset, frequency, duration, type, endFrequency, volume });
  };

  if (target.matches(".resume-close")) {
    tone(0, 440, 0.07, "square", 330, 0.035);
    tone(0.045, 293.66, 0.09, "triangle", 196, 0.03);
    return;
  }

  if (target.matches("[data-project-tab]")) {
    tone(0, 293.66, 0.055, "square", 349.23, 0.035);
    tone(0.045, 523.25, 0.075, "triangle", 659.25, 0.04);
    return;
  }

  if (target.matches("#dot-portrait, #morph-button")) {
    tone(0, 180, 0.15, "sawtooth", 420, 0.025);
    tone(0.055, 520, 0.16, "triangle", 780, 0.038);
    return;
  }

  if (target.matches("#portrait-view-toggle")) {
    tone(0, 659.25, 0.06, "square", 523.25, 0.03);
    tone(0.055, 783.99, 0.085, "triangle", 1046.5, 0.035);
    return;
  }

  if (target.matches("#resume-open")) {
    tone(0, 261.63, 0.08, "square", 329.63, 0.032);
    tone(0.06, 392, 0.1, "triangle", 523.25, 0.038);
    return;
  }

  if (target.matches(".project-link, .button-primary")) {
    tone(0, 523.25, 0.055, "square", 659.25, 0.035);
    tone(0.05, 783.99, 0.07, "square", 1046.5, 0.04);
    tone(0.105, 1318.51, 0.1, "triangle", 1567.98, 0.035);
    return;
  }

  tone(0, pitch, 0.055, "square", pitch * 1.12, 0.028);
  tone(0.038, pitch * 1.5, 0.07, "triangle", pitch * 1.25, 0.025);
}

document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;
  const target = event.target.closest("button, a[href], #dot-portrait");
  if (!target || target.matches(".music-key, #game-toggle, #game-reset, [data-game-control], :disabled")) return;
  playInterfaceSound(target);
});

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
const morphButton = document.querySelector("#morph-button");
const portraitStatus = document.querySelector("#portrait-status");
const portraitStage = document.querySelector("#portrait-stage");
const portraitViewToggle = document.querySelector("#portrait-view-toggle");
const portraitData = "520s16f0s27c0s2810s28q0s2521016f1017c102811028q1029e1025a1805z1806n1807c180811808q1829e182a31825a1g05z1g06n1g07c1g0811g08q1g09n1g2ab1g2521o05q1o06f1o0741o07t1o08h1o0961o0a31o24d1v0521v05q1v06f1v0741v07t1v08h1v0961v09v1v0as1v24d230522305q2306f230742307t2308h230962309v230ak2313w2b04l2b05a2b05z2b06n2b07c2b0812b08q2b09e2b0a32b0b02b23o2j14d2j0522j05q2j06f2j0742j07t2j08h2j0962j09v2j0ak2j0b82j23g2r1452r04t2r05i2r0672r06w2r17k2r1892r18y2r09n2r0ab2r0b02r1bp2r23w2z04l2z05a2z05z2z06n2z17c2z1812z28q2z19e2z0a32z0as2z0bg2z23g370453704t3705i370673706w3717k372893728y3729n370ab370b0370bp3723o3e04d3e0523e05q3e06f3e1743e17t3e28h3e2963e29v3e0ak3e0b83e0383m03w3m04l3m05a3m05z3m16n3m17c3m2813m28q3m29e3m2a33m0as3m0303u03o3u04d3u0523u05q3u06f3u1743u27t3u28h3u2963u29v3u0ak3u0b83u0cd3u2384203w4204l4205a4205z4216n4217c422814228q4229e422a3420as420bg422cm422384a03w4a04l4a05a4a05z4a16n4a27c4a2814a28q4a29e4a2a34a0as4a0bp4a2304i03o4i04d4i0524i05q4i16f4i1744i17t4i28h4i2964i29v4i0ak4i0b84i0bx4i2304q03o4q04d4q0524q05q4q06f4q1744q27t4q28h4q2964q29v4q1ak4q0b84q0c54q2304y03o4y04d4y0524y05q4y16f4y1744y17t4y28h4y2964y29v4y0ak4y0b84y0bx4y22r5603g560455604t5605i561675616w5617k561895628y562a3560as560bg5602j5d0385d03w5d04l5d05a5d15z5d16n5d17c5d1815d28q5d29e5d2a35d0as5d0bg5d0c55d2305l03o5l04d5l0525l15q5l16f5l1745l17t5l18h5l1965l19v5l0ak5l0b85l0bx5l12b5t1305t03o5t04d5t0525t15q5t06f5t1745t17t5t18h5t2965t29v5t0ak5t0b85t0bx5t2da5t22b610306103o6104d610526115q6116f612746117t6128h611966129v611ak610b8610bx611cm612da6122b690306903o6904d691526915q6916f691746917t6928h692966919v690ak690b8690bx691d26921u6h02j6h0386h03w6h04l6h15a6h15z6h16n6h17c6h1816h28q6h09n6h0ab6h0b06h0bp6h0cd6h1d26h11u6p02j6p0386p03w6p04l6p15a6p15z6p16n6p17c6p1816p28q6p19e6p0a36p0as6p0bg6p0c56p0cu6p01m6w12r6w03g6w0456w14t6w25i6w1676w16w6w17k6w2896w18y6w29n6w0ab6w0b06w0bp6w0cd6w0d26w0237402r7403g740457414t7415i741677416w7417k742897418y7429n740ab741b0741bp740cd740d27402j7c0387c03w7c04l7c15a7c25z7c16n7c27c7c2817c28q7c29e7c2a37c0as7c0bg7c0c57c0cu7c0237k12r7k03g7k0457k14t7k15i7k1677k16w7k17k7k2897k28y7k29n7k0ab7k0b07k0bp7k0cd7k0d27k0237s1307s03o7s04d7s1527s15q7s16f7s1747s17t7s28h7s2967s29v7s1ak7s0b87s0bx7s0cm7s0da7s02j801388003w8014l8015a8015z8016n8017c801818028q8029e800a3800as800cd800d28001u8812r8813g880458804t8815i881678816w8807k881898828y8829n880ab880d2880238g02r8g13g8g0458g04t8g15i8g1678g16w8g17k8g1898g28y8g29n8g0ab8g01m8o02j8o1388o03w8o04l8o15a8o15z8o16n8o27c8o2818o28q8o29e8o0a38o01m8v02j8v0388v03w8v04l8v15a8v15z8v16n8v17c8v2818v28q8v29e8v0a38v01m9322b930309303o9304d930529315q9316f931749317t9328h932969309v930ak9312b9b0309b03o9b04d9b0529b15q9b16f9b0749b17t9b28h9b0969b09v9b0ak9b22j9j0389j03w9j04l9j05a9j15z9j16n9j17c9j1819j28q9j09e9j0a39j01u9r12j9r0389r03w9r04l9r05a9r15z9r16n9r07c9r1819r28q9r09e9r0a39r0as9r22b9z0309z03o9z04d9z0529z05q9z16f9z0749z07t9z28h9z0969z09v9z0ak9z11ma702ba7030a703oa704da7052a715qa716fa7174a717ta708ha7096a709va70aka711uae02jae038ae03wae04lae05aae15zae16nae17cae281ae08qae09eae0a3ae0asae12bam030am03oam04dam052am15qam06fam174am27tam08ham096am09vam0akam0bpam223au02rau03gau045au04tau05iau167au06wau07kau089au08yau09nau0abau0b0au01eb2123b202rb203gb2045b204tb215ib2167b206wb207kb2089b208yb209nb20abb20b0b20cdb221mba02bba030ba03oba04dba152ba15qba16fba074ba07tba08hba096ba09vba0akba0b8ba0cdba11mbi02bbi030bi03obi04dbi152bi05qbi16fbi074bi07tbi08hbi096bi09vbi0akbi1b8bi0bxbi0cmbi11ubq02jbq038bq03wbq04lbq15abq15zbq06nbq07cbq081bq08qbq09ebq0a3bq0bgbq0c5bq016by21uby02jby038by03wby04lby15aby15zby06nby07cby081by08qby09eby0a3by1bpby0cdby01mc602bc6130c603oc604dc6152c615qc616fc6074c607tc608hc6096c609vc60bpc61cdc601ucd02jcd038cd03wcd04lcd15acd15zcd06ncd07ccd081cd08qcd09ecd0a3cd1bpcd1cdcd023cl02rcl03gcl045cl14tcl15icl167cl06wcl07kcl089cl08ycl09ncl0bgcl22bct030ct13oct04dct152ct15qct06fct074ct07tct08hct096ct09vct12jd1138d103wd104ld115ad115zd106nd107cd1081d108qd109ed112bd9130d913od904dd9152d915qd906fd9074d907td908hd9096d902bdh130dh13odh04ddh152dh15qdh06fdh074dh07tdh08hdh096dh02jdp138dp13wdp04ldp15adp15zdp06ndp07cdp081dp08qdp09edp030dw13odw04ddw152dw15qdw06fdw074dw07tdw08hdw096dw038e413we404le415ae405ze406ne407ce4081e408qe409ee403oec04dec152ec15qec06fec074ec07tec08hec096ec0a3ec24dek152ek05qek06fek074ek07tek08hek096ek09vek24les15aes15zes06nes07ces081es08qes09ees0";
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
  const colors = ["#252433", "#df6d96", "#fffaf1"];
  const limited = [];
  for (let index = 0; index < portraitData.length; index += 5) {
    limited.push({
      px: Number.parseInt(portraitData.slice(index, index + 2), 36),
      py: Number.parseInt(portraitData.slice(index + 2, index + 4), 36),
      tint: colors[Number(portraitData[index + 4])],
    });
  }
  portraitParticles = limited.map((point, index) => {
    const portraitTarget = { x: point.px, y: point.py };
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
  if (!portraitStage.classList.contains("show-photo")) {
    portraitStatus.textContent = `${shapeNames[portraitMode]} / 0${portraitMode + 1}`;
  }
  window.clearTimeout(portraitAutoTimer);
  if (!portraitStage.classList.contains("show-photo")) {
    portraitAutoTimer = window.setTimeout(changePortraitShape, 6500);
  }
}

function startPortrait() {
  buildPortraitParticles();
  cancelAnimationFrame(portraitAnimation);
  drawPortrait();
  portraitAutoTimer = window.setTimeout(changePortraitShape, 6500);
}

startPortrait();

portraitCanvas.addEventListener("pointermove", (event) => {
  const rect = portraitCanvas.getBoundingClientRect();
  portraitPointer = { x: event.clientX - rect.left, y: event.clientY - rect.top, active: true };
});
portraitCanvas.addEventListener("pointerleave", () => { portraitPointer.active = false; });
portraitCanvas.addEventListener("click", changePortraitShape);
morphButton.addEventListener("click", changePortraitShape);
portraitViewToggle.addEventListener("click", () => {
  const showPhoto = !portraitStage.classList.contains("show-photo");
  portraitStage.classList.toggle("show-photo", showPhoto);
  portraitViewToggle.setAttribute("aria-pressed", String(showPhoto));
  portraitViewToggle.textContent = showPhoto ? "Show dots" : "Show photo";
  morphButton.hidden = showPhoto;
  window.clearTimeout(portraitAutoTimer);
  if (!showPhoto) {
    portraitAutoTimer = window.setTimeout(changePortraitShape, 6500);
  }
  portraitStatus.textContent = showPhoto
    ? "photo / real"
    : `${shapeNames[portraitMode]} / 0${portraitMode + 1}`;
});

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
let gameAudioContext;

function getGameAudioContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;

  gameAudioContext ||= new AudioContext();
  if (gameAudioContext.state === "suspended") {
    gameAudioContext.resume().catch(() => {});
  }
  return gameAudioContext;
}

function scheduleGameTone(context, {
  start = context.currentTime,
  duration = 0.12,
  frequency,
  endFrequency = frequency,
  type = "square",
  volume = 0.05,
}) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const finish = start + duration;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(endFrequency, finish);

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, finish);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(finish + 0.01);
}

function playGameSound(sound) {
  const context = getGameAudioContext();
  if (!context) return;
  const now = context.currentTime;

  if (sound === "jump") {
    scheduleGameTone(context, {
      start: now,
      duration: 0.13,
      frequency: 185,
      endFrequency: 430,
      type: "square",
      volume: 0.045,
    });
    scheduleGameTone(context, {
      start: now + 0.018,
      duration: 0.15,
      frequency: 280,
      endFrequency: 620,
      type: "triangle",
      volume: 0.055,
    });
  }

  if (sound === "star") {
    scheduleGameTone(context, {
      start: now,
      duration: 0.065,
      frequency: 230,
      endFrequency: 135,
      type: "square",
      volume: 0.035,
    });
    scheduleGameTone(context, {
      start: now + 0.035,
      duration: 0.13,
      frequency: 880,
      endFrequency: 1320,
      type: "triangle",
      volume: 0.075,
    });
    scheduleGameTone(context, {
      start: now + 0.095,
      duration: 0.11,
      frequency: 1320,
      endFrequency: 1760,
      type: "sine",
      volume: 0.045,
    });
  }

  if (sound === "start") {
    [130.81, 196, 261.63, 392].forEach((frequency, index) => {
      scheduleGameTone(context, {
        start: now + index * 0.055,
        duration: 0.12,
        frequency,
        endFrequency: frequency * 1.03,
        type: index % 2 ? "triangle" : "square",
        volume: 0.045,
      });
    });
  }

  if (sound === "reset") {
    scheduleGameTone(context, {
      start: now,
      duration: 0.18,
      frequency: 620,
      endFrequency: 180,
      type: "sawtooth",
      volume: 0.04,
    });
    scheduleGameTone(context, {
      start: now + 0.08,
      duration: 0.11,
      frequency: 220,
      endFrequency: 440,
      type: "square",
      volume: 0.035,
    });
  }

  if (sound === "exit") {
    [392, 293.66, 196].forEach((frequency, index) => {
      scheduleGameTone(context, {
        start: now + index * 0.055,
        duration: 0.09,
        frequency,
        endFrequency: frequency * 0.92,
        type: "square",
        volume: 0.035,
      });
    });
  }

  if (sound === "victory") {
    [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
      scheduleGameTone(context, {
        start: now + index * 0.085,
        duration: 0.24,
        frequency,
        endFrequency: frequency * 1.015,
        type: index === 3 ? "square" : "triangle",
        volume: index === 3 ? 0.06 : 0.075,
      });
    });
    scheduleGameTone(context, {
      start: now + 0.28,
      duration: 0.42,
      frequency: 1046.5,
      endFrequency: 1567.98,
      type: "sine",
      volume: 0.065,
    });
  }
}

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
  const useMobileLayout = width <= 480;
  const levelSpan = Math.min(width - 40, 1340);
  const compactHeightScale = Math.min(1, Math.max(0.72, (height - 72) / 440));
  const desktopHeightScale = Math.min(1, Math.max(0.65, (height - 72) / 490));
  const compactY = (offset) => height - offset * compactHeightScale;
  const desktopY = (offset) => height - offset * desktopHeightScale;
  const compactPlatforms = [
    { x: 14, y: compactY(103), width: 112, height: 8 },
    { x: width * 0.42, y: compactY(160), width: 82, height: 8 },
    { x: width - 106, y: compactY(225), width: 90, height: 8 },
    { x: width * 0.43, y: compactY(285), width: 80, height: 8 },
    { x: 18, y: compactY(220), width: 84, height: 8 },
    { x: width * 0.38, y: compactY(305), width: 82, height: 8 },
    { x: width - 104, y: compactY(370), width: 88, height: 8 },
    { x: width * 0.42, y: compactY(440), width: 78, height: 8 },
  ];
  const desktopPlatforms = [
    { x: 20, y: desktopY(58), width: Math.max(140, levelSpan * 0.13), height: 8 },
    { x: 20 + levelSpan * 0.18, y: desktopY(145), width: 112, height: 8 },
    { x: 20 + levelSpan * 0.37, y: desktopY(230), width: 118, height: 8 },
    { x: 20 + levelSpan * 0.58, y: desktopY(150), width: 110, height: 8 },
    { x: 20 + levelSpan * 0.78, y: desktopY(240), width: 105, height: 8 },
    { x: 20 + levelSpan * 0.62, y: desktopY(325), width: 100, height: 8 },
    { x: 20 + levelSpan * 0.44, y: desktopY(410), width: 98, height: 8 },
    { x: 20 + levelSpan * 0.31, y: desktopY(490), width: 92, height: 8 },
  ];

  platforms = (useMobileLayout ? compactPlatforms : desktopPlatforms).map((platform) => ({
    ...platform,
    x: Math.max(12, Math.min(platform.x, width - platform.width - 12)),
  }));
  const starColors = ["#f4a4bb", "#ffd938", "#6fcf9d", "#c9b8ed"];
  stars = platforms.slice(1).map((platform, index) => ({
    x: platform.x + platform.width / 2,
    y: platform.y - 28,
    collected: false,
    color: starColors[index % starColors.length],
  }));
}

function placePlayerAtStart() {
  const startPlatform = platforms[0];
  player.x = startPlatform.x + 28;
  player.y = startPlatform.y - player.height;
  player.vx = 0;
  player.vy = 0;
  player.grounded = true;
}

function resetGame() {
  sizeGame();
  makeLevel();
  placePlayerAtStart();
  collected = 0;
  gameScore.textContent = `0 / ${stars.length}`;
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
    playGameSound("jump");
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
    placePlayerAtStart();
  }

  stars.forEach((star) => {
    if (star.collected) return;
    const distance = Math.hypot(player.x + player.width / 2 - star.x, player.y + player.height / 2 - star.y);
    if (distance < 28) {
      star.collected = true;
      collected += 1;
      gameScore.textContent = `${collected} / ${stars.length}`;
      playGameSound("star");
      if (collected === stars.length) {
        gameMessage.textContent = "Level clear! You found every project star.";
        window.setTimeout(() => {
          if (gameActive) playGameSound("victory");
        }, 120);
      }
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
    getGameAudioContext();
    playGameSound("start");
    gameToggle.blur();
    resetGame();
    previousTime = 0;
    gameFrame = requestAnimationFrame(renderGame);
  } else {
    playGameSound("exit");
    gameContext.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
  }
}

gameToggle.addEventListener("click", () => setGameMode(!gameActive));
gameReset.addEventListener("click", () => {
  playGameSound("reset");
  resetGame();
});

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

function schedulePianoPartial(context, {
  start,
  frequency,
  duration,
  volume,
  type = "sine",
}) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const finish = start + duration;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(volume * 0.38, start + Math.min(0.18, duration * 0.3));
  gain.gain.exponentialRampToValueAtTime(0.0001, finish);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(finish + 0.02);
}

function playClassicalKeyboardTone(context, frequency) {
  const start = context.currentTime;
  [
    { multiple: 1, duration: 1.25, volume: 0.052, type: "triangle" },
    { multiple: 2, duration: 0.82, volume: 0.018, type: "sine" },
    { multiple: 3, duration: 0.56, volume: 0.009, type: "sine" },
    { multiple: 4, duration: 0.32, volume: 0.0045, type: "sine" },
  ].forEach((partial) => {
    schedulePianoPartial(context, {
      start,
      frequency: frequency * partial.multiple,
      duration: partial.duration,
      volume: partial.volume,
      type: partial.type,
    });
  });
}

function playKeyboardNote(key, button) {
  const note = keyboardNotes[key];
  if (!note) return;

  keyboardAudioContext = getInterfaceAudioContext();
  if (keyboardAudioContext) {
    playClassicalKeyboardTone(keyboardAudioContext, note[1]);
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
  }, 650);
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

const resumeDialog = document.querySelector("#resume-dialog");
const resumeOpenButton = document.querySelector("#resume-open");
const resumeCloseButton = document.querySelector("#resume-close");

function closeResume() {
  resumeDialog.close();
  document.body.classList.remove("resume-open");
}

resumeOpenButton.addEventListener("click", () => {
  if (gameActive) setGameMode(false);
  document.body.classList.add("resume-open");
  resumeDialog.showModal();
});

resumeCloseButton.addEventListener("click", closeResume);
resumeDialog.addEventListener("cancel", () => {
  document.body.classList.remove("resume-open");
});
resumeDialog.addEventListener("click", (event) => {
  if (event.target === resumeDialog) closeResume();
});
