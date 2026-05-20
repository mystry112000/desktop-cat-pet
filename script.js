const { ipcRenderer } = require("electron")

// ── Pet state ──
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
  peach: { body: "#ff9e7a", ear: "#e08060", inner: "#ffb0a0" },
  gray: { body: "#8a8a8a", ear: "#707070", inner: "#b0a0a0" },
  black: { body: "#1a1a1a", ear: "#000", inner: "#504040" },
  cream: { body: "#f5deb3", ear: "#e0c8a0", inner: "#f0d0c0" },
  brown: { body: "#d4a574", ear: "#b8895e", inner: "#e0b090" },
}

// ── DOM refs ──
const cat = document.getElementById("cat")
const catHead = cat.querySelector("#cat-head")
const ears = catHead.querySelectorAll(".ear")
const earInners = catHead.querySelectorAll(".ear-inner")
const speech = document.getElementById("speech-bubble")
const nameEl = document.getElementById("pet-name")

const hungerFill = document.getElementById("hunger-fill")
const happinessFill = document.getElementById("happiness-fill")
const energyFill = document.getElementById("energy-fill")

// ── Titlebar ──
document.getElementById("min-btn").onclick = () => ipcRenderer.send("minimize")
document.getElementById("quit-btn").onclick = () => ipcRenderer.send("quit")

// ── Rename ──
nameEl.onclick = () => {
  const n = prompt("Name your cat:", pet.name)
  if (n && n.trim()) {
    pet.name = n.trim()
    nameEl.textContent = pet.name
  }
}

// ── Skin ──
function setSkin(name) {
  pet.skin = name
  const s = SKINS[name]
  document.querySelectorAll(".skin-dot").forEach(d => d.classList.remove("active"))
  document.querySelector(`.skin-dot[style*="${s.body}"]`)?.classList.add("active")
  applySkin()
}
window.setSkin = setSkin

function applySkin() {
  const s = SKINS[pet.skin]
  catHead.style.background = s.body
  ears.forEach(e => e.style.borderBottomColor = s.ear)
  earInners.forEach(e => e.style.borderBottomColor = s.inner)
  cat.querySelector("#cat-tail").style.background = s.body

  // ear inner fix
  ears.forEach((ear, i) => {
    if (!ear.querySelector(".ear-inner")) {
      const inner = document.createElement("div")
      inner.className = "ear-inner"
      ear.appendChild(inner)
    }
  })
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
  randomWalk()
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
  setTimeout(() => { if (pet.mood === "walking") setMood("idle") }, 2000)
  updateUI()
}
window.play = play

function sleep() {
  if (pet.sleeping) {
    say(`${pet.name} is already sleeping!`)
    return
  }
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

// ── Random walk ──
function randomWalk() {
  if (pet.sleeping || pet.mood !== "idle") return
  setMood("walking")
  setTimeout(() => {
    if (pet.mood === "walking") setMood("idle")
  }, 1500)
}

// ── New animations ──
function idleAnim(type) {
  if (pet.sleeping) { say(`${pet.name} is sleeping zzz`); return }
  if (pet.mood === "stretch" || pet.mood === "yawn" || pet.mood === "scratch" || pet.mood === "bathe") return
  setMood(type)
  const durations = { stretch: 1200, yawn: 1500, scratch: 1600, bathe: 2000 }
  const dur = durations[type] || 1200
  setTimeout(() => {
    if (pet.mood === type) setMood("idle")
  }, dur)
  const msgs = {
    stretch: `${pet.name} stretches out 🧘`,
    yawn: `${pet.name} lets out a big yawn 🥱`,
    scratch: `${pet.name} scratches behind the ear 🫳`,
    bathe: `${pet.name} grooms their fur 🧼`,
  }
  say(msgs[type] || "")
}
window.idleAnim = idleAnim

// ── Draggable window ──
let dragging = false, startX, startY
document.addEventListener("mousedown", e => {
  if (e.target.closest("#titlebar-btns") || e.target.closest("#actions") || e.target.closest("#skin-picker") || e.target.closest(".stat")) return
  dragging = true
  startX = e.screenX
  startY = e.screenY
})
document.addEventListener("mousemove", e => {
  if (!dragging) return
  const dx = e.screenX - startX
  const dy = e.screenY - startY
  if (dx || dy) ipcRenderer.send("drag-window", dx, dy)
  startX = e.screenX
  startY = e.screenY
})
document.addEventListener("mouseup", () => { dragging = false })

// ── Notifications ──
let lastNotify = {}
function notify(title, body) {
  const key = title + body
  if (lastNotify[key] && Date.now() - lastNotify[key] < 30000) return
  lastNotify[key] = Date.now()
  try {
    new Notification(title, { body, icon: undefined })
  } catch (_) {}
}

// ── Pet click reactions ──
cat.onclick = () => {
  const msgs = [
    `${pet.name} purrs softly 🐱`,
    `${pet.name} rubs against you 💛`,
    `Meow~ says ${pet.name}`,
    `${pet.name} blinks slowly 😊`,
    `${pet.name} wants attention!`,
  ]
  say(msgs[Math.floor(Math.random() * msgs.length)])
  if (!pet.sleeping && pet.mood === "idle") {
    cat.style.transform = "scale(1.15)"
    setTimeout(() => cat.style.transform = "scale(1)", 300)
    pet.happiness = Math.min(100, pet.happiness + 2)
    updateUI()
  }
}

// ── Passive decay ──
setInterval(() => {
  if (!pet.sleeping) {
    pet.hunger = Math.max(0, pet.hunger - 0.4)
    pet.happiness = Math.max(0, pet.happiness - 0.3)
    pet.energy = Math.max(0, pet.energy - 0.2)
    updateUI()

    if (pet.hunger < 20 && Math.random() < 0.05) {
      say(`${pet.name} is hungry! 🍽️`)
      notify(`${pet.name} is hungry!`, `Feed ${pet.name} before they get too hungry 🍽️`)
    }
    if (pet.happiness < 20 && Math.random() < 0.05) {
      say(`${pet.name} wants to play 🎮`)
      notify(`${pet.name} is lonely`, `Play with ${pet.name} 🎮`)
    }
    if (pet.hunger < 10 && Math.random() < 0.02) {
      notify(`⚠️ ${pet.name} is starving!`, `Feed them quick! 🍽️`)
    }
    if (pet.happiness < 10 && Math.random() < 0.02) {
      notify(`💔 ${pet.name} is very sad`, `Give them some love!`)
    }

    // random idle animations
    if (pet.mood === "idle") {
      const r = Math.random()
      if (r < 0.02) idleAnim("stretch")
      else if (r < 0.035) idleAnim("yawn")
      else if (r < 0.045) idleAnim("scratch")
      else if (r < 0.05) idleAnim("bathe")
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
// request notif permission
if (Notification.permission === "default") Notification.requestPermission()
setTimeout(() => notify("🐱 " + pet.name, "Your cat is here! Take good care of me 💛"), 2000)
