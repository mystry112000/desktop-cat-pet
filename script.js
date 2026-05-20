const { ipcRenderer } = require("electron")

const pet = {
  name: "Kitty",
  hunger: 80, happiness: 70, energy: 60,
  skin: "peach", mood: "idle",
  sleeping: false, menuOpen: false,
  lastX: 0, targetX: 0,
  walking: false, walkTimer: null,
}

const SKINS = {
  peach: { body:"#ff9e7a", ear:"#e08050", earInner:"#ffb8a0", stripe:"#e08050", tail:"#ff9e7a", leg:"#ff9e7a", paw:"#e08050", head:"#ff9e7a" },
  gray: { body:"#8a8a8a", ear:"#707070", earInner:"#b0a0a0", stripe:"#6a6a6a", tail:"#8a8a8a", leg:"#8a8a8a", paw:"#707070", head:"#8a8a8a" },
  black: { body:"#1a1a1a", ear:"#000", earInner:"#504040", stripe:"#333", tail:"#1a1a1a", leg:"#1a1a1a", paw:"#000", head:"#1a1a1a" },
  cream: { body:"#f5deb3", ear:"#e0c8a0", earInner:"#f0d0c0", stripe:"#dcc89e", tail:"#f5deb3", leg:"#f5deb3", paw:"#e0c8a0", head:"#f5deb3" },
  brown: { body:"#d4a574", ear:"#b8895e", earInner:"#e0b090", stripe:"#b8895e", tail:"#d4a574", leg:"#d4a574", paw:"#b8895e", head:"#d4a574" },
}

const wrap = document.getElementById("cat-wrap")
const cat = document.getElementById("cat")
const speech = document.getElementById("speech-bubble")
const tip = document.getElementById("tip")
const menu = document.getElementById("menu")

// ── Skin ──
function setSkin(name) {
  pet.skin = name
  document.querySelectorAll(".skin-dot").forEach(d => d.classList.remove("active"))
  const s = SKINS[name]
  const dot = [...document.querySelectorAll(".skin-dot")].find(d => d.style.background === s.body || d.style.background.startsWith(s.body))
  if (dot) dot.classList.add("active")
  applySkin()
}
window.setSkin = setSkin

function applySkin() {
  const s = SKINS[pet.skin]
  const svg = document.getElementById("cat-svg")
  if (!svg) return
  const set = (id, attr, val) => { const el = svg.getElementById(id); if (el) el.setAttribute(attr, val) }
  set("ct-body","fill",s.body); set("ct-body","stroke",s.stripe)
  set("ct-head","fill",s.head); set("ct-head","stroke",s.stripe)
  set("ct-ear-l","fill",s.ear); set("ct-ear-l","stroke",s.ear)
  set("ct-ear-r","fill",s.ear); set("ct-ear-r","stroke",s.ear)
  set("ct-ear-inner-l","fill",s.earInner); set("ct-ear-inner-l","stroke",s.earInner)
  set("ct-ear-inner-r","fill",s.earInner); set("ct-ear-inner-r","stroke",s.earInner)
  set("ct-tail","stroke",s.tail)
  set("ct-leg-fl","stroke",s.leg); set("ct-leg-fr","stroke",s.leg)
  set("ct-leg-bl","stroke",s.leg); set("ct-leg-br","stroke",s.leg)
  set("ct-paw-fl","fill",s.paw); set("ct-paw-fr","fill",s.paw)
  set("ct-paw-bl","fill",s.paw); set("ct-paw-br","fill",s.paw)
  set("ct-stripe1","stroke",s.stripe); set("ct-stripe2","stroke",s.stripe); set("ct-stripe3","stroke",s.stripe)
}

// ── Speech ──
function say(text) {
  speech.textContent = text
  speech.classList.add("show")
  clearTimeout(speech._t)
  speech._t = setTimeout(() => speech.classList.remove("show"), 3000)
}

// ── Mood ──
function setMood(mood) {
  cat.className = mood
  pet.mood = mood
  if (mood === "sleeping") pet.sleeping = true
  else if (mood !== "sleeping") pet.sleeping = false
}

// ── Stats ──
function updateUI() {
  document.getElementById("mhunger").style.width = pet.hunger + "%"
  document.getElementById("mhappy").style.width = pet.happiness + "%"
  document.getElementById("menergy").style.width = pet.energy + "%"
}

// ── Menu ──
function openMenu() {
  pet.menuOpen = true
  menu.classList.remove("hidden")
  tip.classList.remove("show")
  document.getElementById("m-name").textContent = pet.name
  updateUI()
}
function closeMenu() {
  pet.menuOpen = false
  menu.classList.add("hidden")
}
window.closeMenu = closeMenu

// ── Actions ──
function feed() {
  if (pet.sleeping) { say(`${pet.name} is sleeping zzz`); return }
  pet.hunger = Math.min(100, pet.hunger + 25)
  pet.happiness = Math.min(100, pet.happiness + 5)
  say(`Nom nom nom 🍽️`)
  setMood("idle"); updateUI()
}
window.feed = feed

function play() {
  if (pet.sleeping) { say(`${pet.name} is sleeping zzz`); return }
  if (pet.energy < 15) { say(`${pet.name} is too tired 😴`); return }
  pet.happiness = Math.min(100, pet.happiness + 20)
  pet.energy = Math.max(0, pet.energy - 15)
  pet.hunger = Math.max(0, pet.hunger - 8)
  say(`Yay! 🎮`)
  setMood("walking")
  setTimeout(() => { if (pet.mood === "walking") setMood("idle") }, 2000)
  updateUI()
}
window.play = play

function goSleep() {
  if (pet.sleeping) { say(`Already sleeping!`); return }
  pet.sleeping = true
  say(`Night night 🌙`)
  setMood("sleeping")
  walkStop()
  const interval = setInterval(() => {
    if (!pet.sleeping) { clearInterval(interval); return }
    pet.energy = Math.min(100, pet.energy + 3)
    pet.hunger = Math.max(0, pet.hunger - 1)
    updateUI()
    if (pet.energy >= 100) {
      pet.sleeping = false; setMood("idle")
      say(`Good morning! 🌞`)
      clearInterval(interval)
      scheduleWalk()
    }
  }, 1000)
  updateUI()
}
window.goSleep = goSleep

function idleAnim(type) {
  if (pet.sleeping) { say(`zzz`); return }
  if (["stretch","yawn","scratch"].includes(pet.mood)) return
  setMood(type)
  const dur = { stretch:1200, yawn:1500, scratch:1600 }[type] || 1200
  setTimeout(() => { if (pet.mood === type) setMood("idle") }, dur)
  const msgs = { stretch:`Stretches out 🧘`, yawn:`Big yawn 🥱`, scratch:`Scratch scratch 🫳` }
  say(msgs[type]||"")
}
window.idleAnim = idleAnim

// ── Walking AI ──
function walkTo(x) {
  if (pet.sleeping || pet.menuOpen) return
  walkStop()
  pet.walking = true
  setMood("walking")
  const maxX = window.innerWidth - 80
  const target = Math.max(40, Math.min(maxX, x))
  wrap.style.left = target + "px"
  pet.targetX = target
  pet.walkTimer = setTimeout(() => {
    pet.walking = false
    if (!pet.sleeping) setMood("idle")
    scheduleWalk()
  }, 2800)
}

function walkStop() {
  pet.walking = false
  clearTimeout(pet.walkTimer)
}

function scheduleWalk() {
  clearTimeout(pet._walkSched)
  if (pet.sleeping || pet.menuOpen) return
  const delay = 3000 + Math.random() * 7000
  pet._walkSched = setTimeout(() => {
    if (pet.sleeping || pet.menuOpen || pet.mood !== "idle") { scheduleWalk(); return }
    const r = Math.random()
    if (r < 0.5) {
      // walk somewhere
      const maxX = window.innerWidth - 80
      const x = 40 + Math.random() * (maxX - 40)
      walkTo(x)
    } else {
      // do idle anim
      const a = Math.random()
      if (a < 0.3) idleAnim("stretch")
      else if (a < 0.5) idleAnim("yawn")
      else if (a < 0.65) idleAnim("scratch")
      scheduleWalk()
    }
  }, delay)
}

// ── Cat click ──
cat.onclick = (e) => {
  e.stopPropagation()
  if (pet.menuOpen) { closeMenu(); return }
  const msgs = [`Purrs 🐱`,`Meow~`,`Blinks 😊`,`Rub rub 💛`]
  say(msgs[Math.floor(Math.random()*msgs.length)])
  if (!pet.sleeping && pet.mood === "idle") {
    cat.style.transform = "scale(1.1)"
    setTimeout(() => cat.style.transform = "scale(1)", 300)
    pet.happiness = Math.min(100, pet.happiness + 2)
    updateUI()
  }
  openMenu()
}

// click outside menu to close
document.addEventListener("click", (e) => {
  if (pet.menuOpen && !menu.contains(e.target) && e.target !== cat && !cat.contains(e.target)) {
    closeMenu()
  }
})

// ── Mouse hover → enable interaction ──
document.addEventListener("mousemove", (e) => {
  const r = wrap.getBoundingClientRect()
  const px = r.left + r.width / 2
  const py = r.top + r.height / 2
  const dx = e.clientX - px
  const dy = e.clientY - py
  const dist = Math.sqrt(dx*dx + dy*dy)

  // show tip when near first time
  if (dist < 120) tip.classList.add("show")

  // enable mouse events on window when near cat or menu open
  const near = dist < 100 || pet.menuOpen || menu.contains(e.target)
  ipcRenderer.send("set-ignore-mouse", !near)

  // cat looks at cursor
  if (!pet.sleeping) {
    const angle = Math.atan2(dx, dy) * (180 / Math.PI)
    const lookX = Math.max(-3, Math.min(3, dx * 0.03))
    cat.style.transform = `rotate(${lookX * 1.5}deg)`
  }
})

// ── Rename ──
document.getElementById("menu-title").onclick = () => {
  const n = prompt("Name your cat:", pet.name)
  if (n && n.trim()) { pet.name = n.trim(); document.getElementById("m-name").textContent = pet.name }
}

// ── Decay ──
setInterval(() => {
  if (!pet.sleeping) {
    pet.hunger = Math.max(0, pet.hunger - 0.3)
    pet.happiness = Math.max(0, pet.happiness - 0.25)
    pet.energy = Math.max(0, pet.energy - 0.15)
    updateUI()
    if (pet.hunger < 20 && Math.random() < 0.05) { say(`Hungry! 🍽️`); notify(`Hungry!`,`Feed me 🍽️`) }
    if (pet.happiness < 20 && Math.random() < 0.05) { say(`Bored... 🎮`); notify(`Bored!`,`Play with me 🎮`) }
    if (pet.hunger < 10 && Math.random() < 0.02) notify(`⚠️ Starving!`,`Feed quick!`)
  }
}, 4000)

// ── Notifications ──
let lastN = {}
function notify(title, body) {
  const k = title+body
  if (lastN[k] && Date.now()-lastN[k]<30000) return
  lastN[k]=Date.now()
  try { new Notification(title,{body}) } catch(_) {}
}

// ── Init ──
pet.name = prompt("Name your cat:","Kitty") || "Kitty"
document.getElementById("m-name").textContent = pet.name
setSkin("peach")
updateUI()
setTimeout(scheduleWalk, 1500)
setTimeout(() => say(`Hi! I'm ${pet.name} 🐱`), 800)
setTimeout(() => tip.classList.add("show"), 3000)
if (Notification.permission === "default") Notification.requestPermission()
