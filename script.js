const { ipcRenderer } = require("electron")

const pet = {
  name: "Kitty",
  hunger: 80,
  happiness: 70,
  energy: 60,
  skin: "peach",
  mood: "idle",
  sleeping: false,
}

const SKINS = {
  peach: { body: "#ff9e7a", ear: "#e08050", earInner: "#ffb8a0", stripe: "#e08050", tail: "#ff9e7a", leg: "#ff9e7a", paw: "#e08050", head: "#ff9e7a" },
  gray: { body: "#8a8a8a", ear: "#707070", earInner: "#b0a0a0", stripe: "#6a6a6a", tail: "#8a8a8a", leg: "#8a8a8a", paw: "#707070", head: "#8a8a8a" },
  black: { body: "#1a1a1a", ear: "#000", earInner: "#504040", stripe: "#333", tail: "#1a1a1a", leg: "#1a1a1a", paw: "#000", head: "#1a1a1a" },
  cream: { body: "#f5deb3", ear: "#e0c8a0", earInner: "#f0d0c0", stripe: "#dcc89e", tail: "#f5deb3", leg: "#f5deb3", paw: "#e0c8a0", head: "#f5deb3" },
  brown: { body: "#d4a574", ear: "#b8895e", earInner: "#e0b090", stripe: "#b8895e", tail: "#d4a574", leg: "#d4a574", paw: "#b8895e", head: "#d4a574" },
}

const $ = id => document.getElementById(id)
const cat = $("cat")
const speech = $("speech-bubble")
const nameEl = $("pet-name")
const hungerFill = $("hunger-fill")
const happinessFill = $("happiness-fill")
const energyFill = $("energy-fill")

// ── Titlebar ──
$("min-btn").onclick = () => ipcRenderer.send("minimize")
$("quit-btn").onclick = () => ipcRenderer.send("quit")

// ── Rename ──
nameEl.onclick = () => {
  const n = prompt("Name your cat:", pet.name)
  if (n && n.trim()) { pet.name = n.trim(); nameEl.textContent = pet.name }
}

// ── Skin ──
function setSkin(name) {
  pet.skin = name
  document.querySelectorAll(".skin-dot").forEach(d => d.classList.remove("active"))
  const s = SKINS[name]
  document.querySelector(`.skin-dot[style*="${s.body}"]`)?.classList.add("active")
  applySkin()
}
window.setSkin = setSkin

function applySkin() {
  const s = SKINS[pet.skin]
  const svg = document.querySelector("#cat-svg")
  if (!svg) return

  const set = (id, attr, val) => { const el = svg.getElementById(id); if (el) el.setAttribute(attr, val) }

  set("ct-body", "fill", s.body)
  set("ct-body", "stroke", s.stripe)
  set("ct-head", "fill", s.head)
  set("ct-head", "stroke", s.stripe)
  set("ct-ear-l", "fill", s.ear)
  set("ct-ear-l", "stroke", s.ear)
  set("ct-ear-r", "fill", s.ear)
  set("ct-ear-r", "stroke", s.ear)
  set("ct-ear-inner-l", "fill", s.earInner)
  set("ct-ear-inner-l", "stroke", s.earInner)
  set("ct-ear-inner-r", "fill", s.earInner)
  set("ct-ear-inner-r", "stroke", s.earInner)
  set("ct-tail", "stroke", s.tail)
  set("ct-leg-fl", "stroke", s.leg)
  set("ct-leg-fr", "stroke", s.leg)
  set("ct-leg-bl", "stroke", s.leg)
  set("ct-leg-br", "stroke", s.leg)
  set("ct-paw-fl", "fill", s.paw)
  set("ct-paw-fr", "fill", s.paw)
  set("ct-paw-bl", "fill", s.paw)
  set("ct-paw-br", "fill", s.paw)
  set("ct-stripe1", "stroke", s.stripe)
  set("ct-stripe2", "stroke", s.stripe)
  set("ct-stripe3", "stroke", s.stripe)
}

// ── Stats ──
function updateUI() {
  hungerFill.style.width = pet.hunger + "%"
  happinessFill.style.width = pet.happiness + "%"
  energyFill.style.width = pet.energy + "%"
}

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
  pet.sleeping = mood === "sleeping"
}

// ── Actions ──
function feed() {
  if (pet.sleeping) { say(`${pet.name} is sleeping zzz`); return }
  pet.hunger = Math.min(100, pet.hunger + 25)
  pet.happiness = Math.min(100, pet.happiness + 5)
  say(`${pet.name} nom nom nom 🍽️`)
  setMood("idle")
  updateUI()
  setTimeout(randomWalk, 500)
}
window.feed = feed

function play() {
  if (pet.sleeping) { say(`${pet.name} is sleeping zzz`); return }
  if (pet.energy < 15) { say(`${pet.name} is too tired 😴`); return }
  pet.happiness = Math.min(100, pet.happiness + 20)
  pet.energy = Math.max(0, pet.energy - 15)
  pet.hunger = Math.max(0, pet.hunger - 8)
  say(`Yay! ${pet.name} loves playing! 🎮`)
  setMood("walking")
  setTimeout(() => { if (pet.mood === "walking") setMood("idle") }, 2500)
  updateUI()
}
window.play = play

function sleep() {
  if (pet.sleeping) { say(`${pet.name} is already sleeping!`); return }
  pet.sleeping = true
  say(`Night night ${pet.name} 🌙`)
  setMood("sleeping")
  const interval = setInterval(() => {
    if (!pet.sleeping) { clearInterval(interval); return }
    pet.energy = Math.min(100, pet.energy + 3)
    pet.hunger = Math.max(0, pet.hunger - 1)
    updateUI()
    if (pet.energy >= 100) {
      pet.sleeping = false
      setMood("idle")
      say(`${pet.name} woke up! 🌞`)
      clearInterval(interval)
    }
  }, 1000)
  updateUI()
}
window.sleep = sleep

function randomWalk() {
  if (pet.sleeping || pet.mood !== "idle") return
  setMood("walking")
  setTimeout(() => { if (pet.mood === "walking") setMood("idle") }, 1800)
}

// ── Idle animations ──
function idleAnim(type) {
  if (pet.sleeping) { say(`${pet.name} is sleeping zzz`); return }
  if (["stretch","yawn","scratch"].includes(pet.mood)) return
  setMood(type)
  const dur = { stretch: 1200, yawn: 1500, scratch: 1600 }[type] || 1200
  setTimeout(() => { if (pet.mood === type) setMood("idle") }, dur)
  const msgs = { stretch: `${pet.name} stretches out 🧘`, yawn: `${pet.name} lets out a big yawn 🥱`, scratch: `${pet.name} scratches behind the ear 🫳` }
  say(msgs[type] || "")
}
window.idleAnim = idleAnim

// ── Draggable ──
let dragging = false, startX, startY
document.addEventListener("mousedown", e => {
  if (e.target.closest("#titlebar-btns") || e.target.closest("#actions") || e.target.closest("#skin-picker") || e.target.closest(".stat")) return
  dragging = true
  startX = e.screenX; startY = e.screenY
})
document.addEventListener("mousemove", e => {
  if (!dragging) return
  const dx = e.screenX - startX, dy = e.screenY - startY
  if (dx || dy) ipcRenderer.send("drag-window", dx, dy)
  startX = e.screenX; startY = e.screenY
})
document.addEventListener("mouseup", () => { dragging = false })

// ── Notifications ──
let lastNotify = {}
function notify(title, body) {
  const key = title + body
  if (lastNotify[key] && Date.now() - lastNotify[key] < 30000) return
  lastNotify[key] = Date.now()
  try { new Notification(title, { body }) } catch (_) {}
}

// ── Click ──
cat.onclick = () => {
  const msgs = [`${pet.name} purrs softly 🐱`,`${pet.name} rubs against you 💛`,`Meow~ says ${pet.name}`,`${pet.name} blinks slowly 😊`]
  say(msgs[Math.floor(Math.random() * msgs.length)])
  if (!pet.sleeping && pet.mood === "idle") {
    cat.style.transform = "scale(1.1)"
    setTimeout(() => cat.style.transform = "scale(1)", 300)
    pet.happiness = Math.min(100, pet.happiness + 2)
    updateUI()
  }
}

// ── Decay ──
setInterval(() => {
  if (!pet.sleeping) {
    pet.hunger = Math.max(0, pet.hunger - 0.4)
    pet.happiness = Math.max(0, pet.happiness - 0.3)
    pet.energy = Math.max(0, pet.energy - 0.2)
    updateUI()
    if (pet.hunger < 20 && Math.random() < 0.05) { say(`${pet.name} is hungry! 🍽️`); notify(`${pet.name} is hungry!`,`Feed ${pet.name} 🍽️`) }
    if (pet.happiness < 20 && Math.random() < 0.05) { say(`${pet.name} wants to play 🎮`); notify(`${pet.name} is lonely`,`Play with ${pet.name} 🎮`) }
    if (pet.hunger < 10 && Math.random() < 0.02) notify(`⚠️ ${pet.name} is starving!`,`Feed them quick! 🍽️`)
    if (pet.happiness < 10 && Math.random() < 0.02) notify(`💔 ${pet.name} is very sad`,`Give them some love!`)
    if (pet.mood === "idle") {
      const r = Math.random()
      if (r < 0.02) idleAnim("stretch")
      else if (r < 0.035) idleAnim("yawn")
      else if (r < 0.045) idleAnim("scratch")
      else if (r < 0.08) randomWalk()
    }
  }
}, 3000)

// ── Init ──
pet.name = prompt("Name your cat:", "Kitty") || "Kitty"
nameEl.textContent = pet.name
setSkin("peach")
updateUI()
say(`Hi! I'm ${pet.name} 🐱`)
if (Notification.permission === "default") Notification.requestPermission()
setTimeout(() => notify("🐱 " + pet.name, "Your cat is here! Take good care of me 💛"), 2000)
