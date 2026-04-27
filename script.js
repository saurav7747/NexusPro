/* ═══════════════════════════════════════════════════
   NEXUS FIGHTERS — script.js
   Complete Game Engine: Intro → Lobby → Fight
═══════════════════════════════════════════════════ */

'use strict';

// ──────────────────────────────────────────────────
// 1. FIREBASE SETUP
// ──────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCTTJWfGNmA73ifwfhUpHR8xXxoZrTdmLs",
  authDomain: "chatting-2d60f.firebaseapp.com",
  databaseURL: "https://chatting-2d60f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "chatting-2d60f",
  storageBucket: "chatting-2d60f.firebasestorage.app",
  messagingSenderId: "823509247651",
  appId: "1:823509247651:web:ce83a1199c7791c9870116"
};

let db = null;
let playerData = { name: 'Saurav', wins: 0, coins: 120, gems: 15 };

function initFirebase() {
  try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    loadPlayerData();
  } catch (e) {
    console.warn('Firebase init skipped:', e.message);
  }
}

function loadPlayerData() {
  if (!db) return;
  db.ref('players/saurav').once('value').then(snap => {
    if (snap.exists()) {
      Object.assign(playerData, snap.val());
    } else {
      db.ref('players/saurav').set(playerData);
    }
    updateHUD();
  }).catch(() => {});
}

function savePlayerData() {
  if (!db) return;
  db.ref('players/saurav').update(playerData).catch(() => {});
}

function updateHUD() {
  const coinEl = document.getElementById('coinDisplay');
  const gemEl  = document.getElementById('gemDisplay');
  if (coinEl) coinEl.textContent = playerData.coins;
  if (gemEl)  gemEl.textContent  = playerData.gems;
}

// ──────────────────────────────────────────────────
// 2. SCREEN MANAGER
// ──────────────────────────────────────────────────
const Screens = {
  current: null,
  show(id, delay = 0) {
    setTimeout(() => {
      document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
        s.style.opacity = '0';
      });
      const el = document.getElementById(id);
      if (!el) return;
      el.style.display = 'flex';
      requestAnimationFrame(() => {
        el.style.opacity = '1';
        el.style.transition = 'opacity 0.4s ease';
        el.classList.add('active');
      });
      this.current = id;
    }, delay);
  }
};

// ──────────────────────────────────────────────────
// 3. PARTICLE SYSTEM (DOM-based, lightweight)
// ──────────────────────────────────────────────────
function spawnParticles(containerId, count, colors) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 4 + 1;
    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random()*100}%;
      top:${Math.random()*100}%;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      animation-duration:${Math.random()*8+4}s;
      animation-delay:${Math.random()*6}s;
      opacity:0;
    `;
    container.appendChild(p);
  }
}

// ──────────────────────────────────────────────────
// 4. INTRO SEQUENCE
// ──────────────────────────────────────────────────
function runIntro() {
  spawnParticles('introParticles', 30, ['#00f5ff', '#ff6a00', '#ffffff']);
  // Logo shown → fade to lobby after 1.5s total
  setTimeout(() => {
    const intro = document.getElementById('screen-intro');
    if (intro) { intro.style.opacity = '0'; intro.style.transition = 'opacity 0.5s'; }
    setTimeout(() => showLobby(), 500);
  }, 1500);
}

// ──────────────────────────────────────────────────
// 5. LOBBY
// ──────────────────────────────────────────────────
function showLobby() {
  Screens.show('screen-lobby');
  spawnParticles('lobbyParticles', 25, ['rgba(0,245,255,0.6)', 'rgba(255,106,0,0.6)', 'rgba(255,255,255,0.3)']);
  drawLobbyCharacter();
  updateHUD();
  setupLobbyButtons();
}

// Draw pixelart-style character on lobby canvas
function drawLobbyCharacter() {
  const canvas = document.getElementById('lobbyCharCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  drawFighterSprite(ctx, 80, 110, 1.0, { primary:'#00f5ff', secondary:'#ff6a00', skin:'#f4a460', dir:1 });
}

// ──────────────────────────────────────────────────
// 6. CHARACTER SPRITE RENDERER (Canvas 2D)
// ──────────────────────────────────────────────────
function drawFighterSprite(ctx, cx, cy, scale, colors, pose='idle', frame=0) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(colors.dir || 1, 1);

  const s = scale;
  const bounce = pose === 'idle' ? Math.sin(frame * 0.1) * 2 * s : 0;

  // Shadow
  ctx.beginPath();
  ctx.ellipse(0, 55*s + bounce, 20*s, 5*s, 0, 0, Math.PI*2);
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill();

  // Legs
  const legSpread = pose === 'kick' ? 15*s : (pose === 'jump' ? 10*s : 5*s);
  drawRect(ctx, -10*s, 30*s+bounce, 8*s, 22*s, colors.secondary); // L leg
  drawRect(ctx,  2*s,  30*s+bounce + legSpread, 8*s, 22*s, colors.secondary); // R leg

  // Body/Torso
  ctx.save();
  if (pose === 'punch') ctx.translate(4*s, 0);
  drawRect(ctx, -14*s, 0+bounce, 28*s, 30*s, colors.primary, 4*s);
  // Belt
  drawRect(ctx, -14*s, 22*s+bounce, 28*s, 6*s, colors.secondary);
  ctx.restore();

  // Arms
  if (pose === 'punch') {
    drawRect(ctx, -22*s, 4*s+bounce, 10*s, 8*s, colors.skin);   // L arm
    drawRect(ctx,  14*s, 2*s+bounce, 20*s, 8*s, colors.skin);   // R arm extended
    // Fist glow
    ctx.beginPath();
    ctx.arc(34*s, 6*s+bounce, 6*s, 0, Math.PI*2);
    ctx.fillStyle = colors.skin; ctx.fill();
    ctx.shadowColor = '#ffaa00'; ctx.shadowBlur = 10*s;
    ctx.fill(); ctx.shadowBlur = 0;
  } else if (pose === 'kick') {
    drawRect(ctx, -22*s, 4*s+bounce, 10*s, 8*s, colors.skin);
    drawRect(ctx,  14*s, 4*s+bounce, 10*s, 8*s, colors.skin);
    // Kick leg
    drawRect(ctx,  2*s,  30*s, 8*s, 10*s, colors.secondary);
    drawRect(ctx,  10*s, 26*s, 18*s, 8*s, colors.secondary); // Extended
  } else if (pose === 'hurt') {
    drawRect(ctx, -22*s, 4*s+bounce, 10*s, 8*s, colors.skin);
    drawRect(ctx,  14*s, 4*s+bounce, 10*s, 8*s, colors.skin);
    // Hurt flash overlay
    ctx.globalAlpha = 0.5;
    drawRect(ctx, -14*s, 0, 28*s, 30*s, '#ff0000', 4*s);
    ctx.globalAlpha = 1;
  } else {
    drawRect(ctx, -24*s, 2*s+bounce, 10*s, 22*s, colors.skin);  // L
    drawRect(ctx,  14*s, 2*s+bounce, 10*s, 22*s, colors.skin);  // R
  }

  // Neck
  drawRect(ctx, -6*s, -8*s+bounce, 12*s, 10*s, colors.skin);

  // Head
  ctx.save();
  if (pose === 'hurt') { ctx.translate(6*s, 0); }
  drawRect(ctx, -14*s, -30*s+bounce, 28*s, 26*s, colors.skin, 6*s);
  // Eyes
  ctx.fillStyle = pose === 'hurt' ? '#ff0000' : '#111';
  ctx.beginPath(); ctx.arc(-5*s, -18*s+bounce, 3.5*s, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(5*s,  -18*s+bounce, 3.5*s, 0, Math.PI*2); ctx.fill();
  // Eye glow
  ctx.fillStyle = pose === 'hurt' ? 'rgba(255,0,0,0.6)' : 'rgba(0,245,255,0.6)';
  ctx.beginPath(); ctx.arc(-5*s, -18*s+bounce, 1.5*s, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(5*s,  -18*s+bounce, 1.5*s, 0, Math.PI*2); ctx.fill();
  // Hair / headband
  drawRect(ctx, -14*s, -30*s+bounce, 28*s, 8*s, colors.secondary, 6*s);
  ctx.restore();

  // Energy aura
  if (pose !== 'hurt') {
    ctx.globalAlpha = 0.15 + Math.abs(Math.sin(frame*0.08))*0.1;
    ctx.shadowColor = colors.primary;
    ctx.shadowBlur = 20*s;
    drawRect(ctx, -16*s, -32*s+bounce, 32*s, 90*s, colors.primary, 6*s);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

function drawRect(ctx, x, y, w, h, color, radius = 0) {
  ctx.beginPath();
  if (radius > 0) {
    ctx.roundRect(x, y, w, h, radius);
  } else {
    ctx.rect(x, y, w, h);
  }
  ctx.fillStyle = color;
  ctx.fill();
}

// ──────────────────────────────────────────────────
// 7. LOBBY BUTTONS
// ──────────────────────────────────────────────────
function setupLobbyButtons() {
  document.getElementById('btnStart')?.addEventListener('click', startGame);
  document.getElementById('btnMode')?.addEventListener('click', () => {
    // Future: mode selection modal
    showToast('More modes coming soon!');
  });
  document.getElementById('btnAddFriend')?.addEventListener('click', () => showToast('Friend system coming soon!'));
  document.getElementById('btnInviteFriend')?.addEventListener('click', () => showToast('Invite system coming soon!'));
  document.getElementById('btnInventory')?.addEventListener('click', () => showToast('Inventory coming soon!'));
  document.getElementById('btnSkills')?.addEventListener('click', () => showToast('Skills coming soon!'));
}

function showToast(msg) {
  const t = document.createElement('div');
  t.style.cssText = `
    position:fixed; bottom:100px; left:50%; transform:translateX(-50%);
    background:rgba(0,245,255,0.15); border:1px solid rgba(0,245,255,0.4);
    color:#fff; font-family:Rajdhani,sans-serif; font-size:0.85rem;
    padding:8px 18px; border-radius:20px; z-index:999;
    animation:fadeUp 2.5s forwards;
  `;
  t.textContent = msg;
  const style = document.createElement('style');
  style.textContent = `@keyframes fadeUp{0%{opacity:0;bottom:80px}20%{opacity:1;bottom:100px}80%{opacity:1}100%{opacity:0;bottom:120px}}`;
  document.head.appendChild(style);
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

// ──────────────────────────────────────────────────
// 8. LOADING TRANSITION
// ──────────────────────────────────────────────────
function startGame() {
  Screens.show('screen-loading');
  const bar = document.getElementById('loadingBar');
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 12 + 4;
    if (progress >= 100) { progress = 100; clearInterval(interval); }
    if (bar) bar.style.width = progress + '%';
    if (progress >= 100) {
      setTimeout(() => {
        Screens.show('screen-game');
        initGame();
      }, 400);
    }
  }, 120);
}

// ──────────────────────────────────────────────────
// 9. GAME ENGINE
// ──────────────────────────────────────────────────

// ─── Constants ───────────────────────────────────
const GRAVITY     = 0.55;
const GROUND_Y    = 0;        // set dynamically
const MOVE_SPEED  = 4.5;
const JUMP_POWER  = -13;
const FIGHTER_W   = 52;
const FIGHTER_H   = 96;
const PUNCH_DMG   = 8;
const KICK_DMG    = 13;
const SKILL_DMG   = 22;
const PUNCH_RANGE = 90;
const KICK_RANGE  = 100;
const KNOCK_BACK  = 9;
const MAX_HP      = 100;
const ROUND_TIME  = 99;

// ─── Game State ──────────────────────────────────
let canvas, ctx, gameRunning = false, gamePaused = false;
let animId = null, frameCount = 0;
let roundTimer = ROUND_TIME, timerInterval = null;
let groundY = 0;

// ─── Fighter Class ───────────────────────────────
class Fighter {
  constructor(x, isPlayer, colors) {
    this.x        = x;
    this.y        = 0;        // relative to groundY
    this.vx       = 0;
    this.vy       = 0;
    this.hp       = MAX_HP;
    this.isPlayer = isPlayer;
    this.colors   = colors;
    this.facing   = isPlayer ? 1 : -1;
    this.pose     = 'idle';
    this.poseTimer= 0;
    this.isGrounded = false;
    this.attackCooldown = 0;
    this.knockbackTimer = 0;
    // AI state
    this.aiState  = 'approach';
    this.aiTimer  = 0;
    this.retreatTimer = 0;
  }

  get cx() { return this.x + FIGHTER_W / 2; }
  get cy() { return groundY + this.y; }    // canvas Y
  get bottom() { return this.cy + FIGHTER_H; }

  applyGravity() {
    if (!this.isGrounded) {
      this.vy += GRAVITY;
    }
    this.y += this.vy;
    // Check landing
    if (this.y >= 0) {
      this.y = 0; this.vy = 0; this.isGrounded = true;
    }
  }

  move(dir) {
    if (this.knockbackTimer > 0) return;
    this.x += dir * MOVE_SPEED;
    this.facing = dir;
  }

  jump() {
    if (this.isGrounded) {
      this.vy = JUMP_POWER;
      this.isGrounded = false;
      this.pose = 'jump';
    }
  }

  clampToArena(w) {
    const margin = 10;
    if (this.x < margin) this.x = margin;
    if (this.x + FIGHTER_W > w - margin) this.x = w - FIGHTER_W - margin;
  }

  attack(type, target) {
    if (this.attackCooldown > 0) return false;
    const dist = Math.abs(this.cx - target.cx);
    let range, dmg;
    if (type === 'punch') { range = PUNCH_RANGE; dmg = PUNCH_DMG; this.pose = 'punch'; }
    else if (type === 'kick') { range = KICK_RANGE; dmg = KICK_DMG; this.pose = 'kick'; }
    else { range = PUNCH_RANGE + 20; dmg = SKILL_DMG; this.pose = 'punch'; spawnSkillFX(this, target); }

    this.attackCooldown = type === 'skill' ? 80 : (type === 'kick' ? 35 : 22);
    this.poseTimer = type === 'kick' ? 25 : 18;

    if (dist <= range) {
      target.takeDamage(dmg, this.facing);
      return true;
    }
    return false;
  }

  takeDamage(dmg, fromDir) {
    if (this.hp <= 0) return;
    this.hp = Math.max(0, this.hp - dmg);
    this.vx = fromDir * KNOCK_BACK;
    this.knockbackTimer = 12;
    this.pose = 'hurt';
    this.poseTimer = 18;
    spawnHitFX(this.cx, this.cy + FIGHTER_H * 0.3);
    updateHealthBars();
    if (this.hp <= 0) triggerKO();
  }

  update(cw) {
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.poseTimer > 0) { this.poseTimer--; if (this.poseTimer <= 0) this.pose = 'idle'; }
    if (this.knockbackTimer > 0) {
      this.knockbackTimer--;
      this.x += this.vx;
      this.vx *= 0.7;
    }
    this.applyGravity();
    this.clampToArena(cw);
  }

  draw(ctx, frame) {
    const screenX = this.cx;
    const screenY = this.cy - FIGHTER_H * 0.15;
    const col = { ...this.colors, dir: this.facing };
    drawFighterSprite(ctx, screenX, screenY, 1, col, this.pose, frame);
  }
}

// ─── Particles / FX ──────────────────────────────
const fxParticles = [];

function spawnHitFX(x, y) {
  const colors = ['#ffaa00','#ff5500','#fff','#ff0080'];
  for (let i = 0; i < 10; i++) {
    fxParticles.push({
      x, y,
      vx: (Math.random()-0.5)*8,
      vy: (Math.random()-1)*6,
      life: 30 + Math.random()*20,
      maxLife: 50,
      color: colors[Math.floor(Math.random()*colors.length)],
      size: Math.random()*5+2,
    });
  }
}

function spawnSkillFX(attacker, target) {
  for (let i = 0; i < 20; i++) {
    fxParticles.push({
      x: attacker.cx, y: attacker.cy + FIGHTER_H*0.3,
      vx: attacker.facing * (Math.random()*10+5),
      vy: (Math.random()-0.5)*4,
      life: 40, maxLife: 40,
      color: '#00f5ff', size: Math.random()*6+3,
    });
  }
}

function updateFX() {
  for (let i = fxParticles.length-1; i >= 0; i--) {
    const p = fxParticles[i];
    p.x += p.vx; p.y += p.vy; p.vy += 0.2;
    p.life--;
    if (p.life <= 0) fxParticles.splice(i, 1);
  }
}

function drawFX(ctx) {
  fxParticles.forEach(p => {
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color; ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (p.life/p.maxLife), 0, Math.PI*2);
    ctx.fill();
  });
  ctx.globalAlpha = 1; ctx.shadowBlur = 0;
}

// ─── Arena Background Layers ─────────────────────
function drawArena(ctx, w, h, frame) {
  // Sky gradient
  const sky = ctx.createLinearGradient(0,0,0,h);
  sky.addColorStop(0, '#020712');
  sky.addColorStop(0.5, '#05101f');
  sky.addColorStop(1, '#0a1628');
  ctx.fillStyle = sky; ctx.fillRect(0,0,w,h);

  // City silhouette (far, parallax)
  drawCitySilhouette(ctx, w, h, frame, '#0d1a2e', 0.5, 0.65);
  // City silhouette (near)
  drawCitySilhouette(ctx, w, h, frame, '#0a1520', 0.8, 0.75);

  // Neon grid floor
  drawNeonFloor(ctx, w, h, frame);

  // Stars
  drawStars(ctx, w, h, frame);

  // Neon signs (decorative)
  drawNeonSigns(ctx, w, h, frame);
}

function drawStars(ctx, w, h, frame) {
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  for (let i = 0; i < 60; i++) {
    const x = ((i * 137 + 50) % w);
    const y = ((i * 97 + 30) % (h * 0.5));
    const flicker = Math.sin(frame*0.05 + i) > 0.7 ? 0.3 : 1;
    ctx.globalAlpha = 0.4 * flicker;
    ctx.fillRect(x, y, 1.5, 1.5);
  }
  ctx.globalAlpha = 1;
}

function drawCitySilhouette(ctx, w, h, frame, color, parallaxFactor, heightFactor) {
  const off = (frame * 0.1 * parallaxFactor) % 80;
  ctx.fillStyle = color;
  const buildings = [
    [0,60],[50,90],[100,55],[140,75],[180,50],[220,100],[270,65],
    [310,85],[360,50],[400,95],[450,70],[490,60],[530,88],[570,52],[610,80],
    [650,65],[690,90],[730,55],[770,75],[810,60],[850,85]
  ];
  ctx.beginPath();
  ctx.moveTo(-off, h);
  buildings.forEach(([bx, bh]) => {
    const x = bx - off;
    ctx.lineTo(x, h * heightFactor - bh);
    ctx.lineTo(x + 35, h * heightFactor - bh);
  });
  ctx.lineTo(w + 80, h);
  ctx.closePath(); ctx.fill();

  // Windows glow
  ctx.fillStyle = 'rgba(255,230,100,0.4)';
  buildings.forEach(([bx, bh]) => {
    for (let wy = 0; wy < bh; wy += 12) {
      for (let wx = 4; wx < 28; wx += 10) {
        if (Math.random() > 0.4) {
          ctx.fillRect(bx - off + wx, h * heightFactor - bh + wy + 4, 5, 6);
        }
      }
    }
  });
}

function drawNeonFloor(ctx, w, h, frame) {
  const gy = groundY;
  // Platform base
  const grad = ctx.createLinearGradient(0, gy - 4, 0, gy + 30);
  grad.addColorStop(0, 'rgba(0,245,255,0.6)');
  grad.addColorStop(0.3, 'rgba(0,100,180,0.3)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, gy - 4, w, 40);

  // Grid lines on floor
  ctx.strokeStyle = 'rgba(0,245,255,0.08)';
  ctx.lineWidth = 1;
  for (let x = -50 + (frame*0.5 % 60); x < w + 60; x += 60) {
    ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x - 80, h); ctx.stroke();
  }
  for (let y = gy; y < h; y += 30) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  // Glow line
  ctx.shadowColor = '#00f5ff'; ctx.shadowBlur = 16;
  ctx.strokeStyle = 'rgba(0,245,255,0.8)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
  ctx.shadowBlur = 0;

  // Floor reflection
  const rg = ctx.createLinearGradient(0, gy, 0, h);
  rg.addColorStop(0, 'rgba(0,245,255,0.06)');
  rg.addColorStop(1, 'transparent');
  ctx.fillStyle = rg; ctx.fillRect(0, gy, w, h - gy);
}

function drawNeonSigns(ctx, w, h, frame) {
  const pulse = 0.6 + Math.sin(frame * 0.04) * 0.4;
  ctx.save();
  ctx.font = 'bold 14px Orbitron, sans-serif';
  ctx.textAlign = 'center';

  // Left sign
  ctx.shadowColor = '#ff0080'; ctx.shadowBlur = 18 * pulse;
  ctx.fillStyle = `rgba(255,0,128,${0.5 * pulse})`;
  ctx.fillText('NEXUS', w * 0.15, groundY - 80);

  // Right sign
  ctx.shadowColor = '#00f5ff'; ctx.shadowBlur = 18 * pulse;
  ctx.fillStyle = `rgba(0,245,255,${0.5 * pulse})`;
  ctx.fillText('ARENA', w * 0.85, groundY - 80);

  ctx.restore();
}

// ─── Player Controls ─────────────────────────────
const keys = { left:false, right:false, jump:false, punch:false, kick:false, skill:false };

function setupControls() {
  // Mobile buttons
  const btnMap = {
    'btnLeft':  'left', 'btnRight': 'right', 'btnJump':  'jump',
    'btnPunch': 'punch','btnKick':  'kick',  'btnSkill': 'skill'
  };
  Object.entries(btnMap).forEach(([id, action]) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('touchstart', e => { e.preventDefault(); keys[action] = true; btn.classList.add('pressed'); }, { passive:false });
    btn.addEventListener('touchend',   e => { e.preventDefault(); keys[action] = false; btn.classList.remove('pressed'); }, { passive:false });
    btn.addEventListener('mousedown',  e => { keys[action] = true; btn.classList.add('pressed'); });
    btn.addEventListener('mouseup',    e => { keys[action] = false; btn.classList.remove('pressed'); });
  });

  // Keyboard (desktop fallback)
  window.addEventListener('keydown', e => {
    if (e.key==='ArrowLeft')  keys.left  = true;
    if (e.key==='ArrowRight') keys.right = true;
    if (e.key==='ArrowUp'||e.key===' ') keys.jump = true;
    if (e.key==='z') keys.punch = true;
    if (e.key==='x') keys.kick  = true;
    if (e.key==='c') keys.skill = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key==='ArrowLeft')  keys.left  = false;
    if (e.key==='ArrowRight') keys.right = false;
    if (e.key==='ArrowUp'||e.key===' ') keys.jump = false;
    if (e.key==='z') keys.punch = false;
    if (e.key==='x') keys.kick  = false;
    if (e.key==='c') keys.skill = false;
  });
}

// ─── Settings Overlay ────────────────────────────
function setupSettingsOverlay() {
  document.getElementById('btnSettings')?.addEventListener('click', () => {
    gamePaused = true;
    document.getElementById('overlay-settings').classList.remove('hidden');
  });
  document.getElementById('btnResume')?.addEventListener('click', () => {
    gamePaused = false;
    document.getElementById('overlay-settings').classList.add('hidden');
  });
  document.getElementById('btnRestart')?.addEventListener('click', () => {
    document.getElementById('overlay-settings').classList.add('hidden');
    initGame();
  });
  document.getElementById('btnQuit')?.addEventListener('click', () => {
    document.getElementById('overlay-settings').classList.add('hidden');
    endGame(); showLobby();
  });
}

// ─── KO Overlay ──────────────────────────────────
function setupKOOverlay() {
  document.getElementById('btnRematch')?.addEventListener('click', () => {
    document.getElementById('overlay-ko').classList.add('hidden');
    initGame();
  });
  document.getElementById('btnReturnLobby')?.addEventListener('click', () => {
    document.getElementById('overlay-ko').classList.add('hidden');
    endGame(); showLobby();
  });
}

// ─── Health Bars ─────────────────────────────────
let p1Fighter, p2Fighter;

function updateHealthBars() {
  if (!p1Fighter || !p2Fighter) return;
  const p1El = document.getElementById('p1Health');
  const p2El = document.getElementById('p2Health');
  if (p1El) p1El.style.width = (p1Fighter.hp / MAX_HP * 100) + '%';
  if (p2El) p2El.style.width = (p2Fighter.hp / MAX_HP * 100) + '%';
}

// ─── Round Timer ─────────────────────────────────
function startRoundTimer() {
  roundTimer = ROUND_TIME;
  updateTimerDisplay();
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (gamePaused || !gameRunning) return;
    roundTimer--;
    updateTimerDisplay();
    if (roundTimer <= 0) {
      clearInterval(timerInterval);
      // Time up: higher HP wins
      if (p1Fighter && p2Fighter) {
        if (p1Fighter.hp >= p2Fighter.hp) triggerKO('player');
        else triggerKO('enemy');
      }
    }
  }, 1000);
}

function updateTimerDisplay() {
  const el = document.getElementById('roundTimer');
  if (el) {
    el.textContent = roundTimer;
    el.style.color = roundTimer <= 10 ? '#ff4444' : '#fff';
  }
}

// ─── KO Trigger ──────────────────────────────────
function triggerKO(winner) {
  if (!gameRunning) return;
  gameRunning = false;
  clearInterval(timerInterval);

  const isPlayerWin = winner === 'player' || (p2Fighter && p2Fighter.hp <= 0);
  const koEl   = document.getElementById('koText');
  const winEl  = document.getElementById('winnerText');
  if (koEl)  koEl.textContent  = 'K.O!';
  if (winEl) winEl.textContent = isPlayerWin ? '🏆 SAURAV WINS!' : '💀 ENEMY WINS!';

  if (isPlayerWin) {
    playerData.wins++;
    playerData.coins += 50;
    savePlayerData();
  }

  setTimeout(() => {
    document.getElementById('overlay-ko').classList.remove('hidden');
  }, 800);
}

// ─── AI System ───────────────────────────────────
function updateAI(ai, player, w) {
  if (ai.hp <= 0 || player.hp <= 0) return;
  ai.aiTimer--;

  const dist = ai.cx - player.cx;
  const absDist = Math.abs(dist);
  const hpRatio = ai.hp / MAX_HP;

  // Low HP retreat
  if (hpRatio < 0.2) {
    ai.aiState = 'retreat';
    ai.retreatTimer = 60;
  }
  if (ai.retreatTimer > 0) {
    ai.retreatTimer--;
    const dir = dist > 0 ? 1 : -1;
    ai.move(dir);
    if (ai.retreatTimer <= 0) ai.aiState = 'approach';
    return;
  }

  // Face player
  ai.facing = dist > 0 ? -1 : 1;

  if (ai.aiState === 'approach') {
    if (absDist > 70) {
      ai.move(dist > 0 ? -1 : 1);
    } else {
      ai.aiState = 'attack';
    }
    // Random jump
    if (ai.aiTimer <= 0 && Math.random() < 0.015 && ai.isGrounded) {
      ai.jump();
      ai.aiTimer = 60;
    }
  } else if (ai.aiState === 'attack') {
    if (absDist > 110) { ai.aiState = 'approach'; return; }
    if (ai.aiTimer <= 0 && ai.attackCooldown <= 0) {
      const r = Math.random();
      if (r < 0.45)      ai.attack('punch', player);
      else if (r < 0.8)  ai.attack('kick', player);
      else               ai.attack('skill', player);
      ai.aiTimer = 25 + Math.floor(Math.random()*20);
    }
    // Step back and forward
    if (ai.aiTimer % 20 === 0) {
      ai.move(dist > 0 ? -1 : 1);
    }
  }
}

// ─── MAIN GAME LOOP ──────────────────────────────
function gameLoop() {
  if (!gameRunning) return;
  animId = requestAnimationFrame(gameLoop);
  if (gamePaused) return;

  frameCount++;
  const cw = canvas.width;
  const ch = canvas.height;

  // Clear
  ctx.clearRect(0, 0, cw, ch);

  // Draw arena
  drawArena(ctx, cw, ch, frameCount);

  // Player input
  if (gameRunning && p1Fighter && p1Fighter.hp > 0) {
    if (keys.left)  p1Fighter.move(-1);
    if (keys.right) p1Fighter.move(1);
    if (keys.jump)  p1Fighter.jump();
    if (keys.punch && p1Fighter.attackCooldown <= 0) { p1Fighter.attack('punch', p2Fighter); keys.punch = false; }
    if (keys.kick  && p1Fighter.attackCooldown <= 0) { p1Fighter.attack('kick', p2Fighter);  keys.kick  = false; }
    if (keys.skill && p1Fighter.attackCooldown <= 0) { p1Fighter.attack('skill', p2Fighter); keys.skill = false; }
  }

  // AI
  updateAI(p2Fighter, p1Fighter, cw);

  // Update
  p1Fighter.update(cw);
  p2Fighter.update(cw);
  updateFX();

  // Draw fighters
  p1Fighter.draw(ctx, frameCount);
  p2Fighter.draw(ctx, frameCount);

  // Draw FX
  drawFX(ctx);
}

// ─── INIT GAME ───────────────────────────────────
function initGame() {
  // Canvas setup
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  resizeCanvas();

  // Fighter spawn
  const cw = canvas.width;
  groundY = canvas.height * 0.68;

  p1Fighter = new Fighter(cw * 0.22, true,  { primary:'#00f5ff', secondary:'#ff6a00', skin:'#f4a460' });
  p2Fighter = new Fighter(cw * 0.62, false, { primary:'#ff0080', secondary:'#44ff00', skin:'#cd853f' });

  // Reset
  fxParticles.length = 0;
  gameRunning = true;
  gamePaused = false;
  frameCount = 0;

  // Reset overlays
  document.getElementById('overlay-settings').classList.add('hidden');
  document.getElementById('overlay-ko').classList.add('hidden');

  updateHealthBars();
  startRoundTimer();
  setupControls();
  setupSettingsOverlay();
  setupKOOverlay();

  if (animId) cancelAnimationFrame(animId);
  gameLoop();
}

function endGame() {
  gameRunning = false;
  if (animId) cancelAnimationFrame(animId);
  clearInterval(timerInterval);
}

function resizeCanvas() {
  if (!canvas) return;
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  groundY = canvas.height * 0.68;
  if (p1Fighter) { p1Fighter.y = 0; }
  if (p2Fighter) { p2Fighter.y = 0; }
}

window.addEventListener('resize', resizeCanvas);

// ──────────────────────────────────────────────────
// 10. BOOT
// ──────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  initFirebase();

  // Show intro immediately
  const introEl = document.getElementById('screen-intro');
  if (introEl) {
    introEl.style.display = 'flex';
    introEl.style.opacity = '1';
  }

  runIntro();
});
