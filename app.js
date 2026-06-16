const patterns = [
  {
    title: "4分音符だけ",
    level: "初級",
    goal: "足で1,2,3,4を感じながら、手で同じ場所をタップします。",
    meter: "4/4",
    bars: 2,
    notes: [0, 4, 8, 12, 16, 20, 24, 28],
  },
  {
    title: "2拍目と4拍目",
    level: "初級",
    goal: "足はずっと4分、手はバックビートだけ。グルーブの土台です。",
    meter: "4/4",
    bars: 2,
    notes: [4, 12, 20, 28],
  },
  {
    title: "8分表と裏",
    level: "初級",
    goal: "ワン・エン・ツー・エンを声に出しながら、均等にタップします。",
    meter: "4/4",
    bars: 2,
    notes: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
  },
  {
    title: "裏拍だけ",
    level: "中級",
    goal: "足の着地と手のタップが交互になる感覚を育てます。",
    meter: "4/4",
    bars: 2,
    notes: [2, 6, 10, 14, 18, 22, 26, 30],
  },
  {
    title: "休符を読む",
    level: "中級",
    goal: "鳴らさない場所もリズムです。次の音まで拍を数え続けます。",
    meter: "4/4",
    bars: 2,
    notes: [0, 4, 10, 12, 16, 22, 24, 28],
  },
  {
    title: "シンコペーション",
    level: "中級",
    goal: "タップをまたぐ音を、足の4分に引っ張られずに狙います。",
    meter: "4/4",
    bars: 2,
    notes: [0, 3, 6, 8, 12, 15, 16, 19, 22, 24, 28, 31],
  },
  {
    title: "16分の4つ目",
    level: "上級",
    goal: "タカタカの最後だけを狙う、細かい裏の入り口です。",
    meter: "4/4",
    bars: 2,
    notes: [3, 7, 11, 15, 19, 23, 27, 31],
  },
  {
    title: "ロックの定番",
    level: "上級",
    goal: "8分と16分が混ざる実践的なパターン。止まらず拍を刻みます。",
    meter: "4/4",
    bars: 2,
    notes: [0, 4, 6, 8, 11, 12, 16, 20, 22, 24, 27, 28],
  },
  {
    title: "シャッフル感",
    level: "上級",
    goal: "跳ねた裏拍を安定させる練習。LISTENで感じを確認してから始めます。",
    meter: "4/4",
    bars: 2,
    swing: true,
    notes: [0, 3, 4, 7, 8, 11, 12, 15, 16, 19, 20, 23, 24, 27, 28, 31],
  },
  {
    title: "空白多め",
    level: "プロ",
    goal: "音が少ないほど、内側のカウントが試されます。",
    meter: "4/4",
    bars: 2,
    notes: [0, 7, 12, 18, 25, 31],
  },
  {
    title: "2小節フレーズ",
    level: "プロ",
    goal: "1小節目と2小節目で形が変わる、曲中フレーズ向けの練習です。",
    meter: "4/4",
    bars: 2,
    notes: [0, 4, 6, 10, 12, 16, 19, 20, 23, 26, 28, 30],
  },
  {
    title: "マイスロット",
    level: "自由",
    goal: "下のエディタで作ったパターンを保存できます。",
    meter: "4/4",
    bars: 2,
    notes: [0, 4, 8, 14, 16, 20, 24, 30],
    custom: true,
  },
];

const state = {
  patternIndex: 0,
  isRunning: false,
  isMuted: false,
  bpm: 72,
  beat: -1,
  countInStart: 0,
  countInBeat: -1,
  step: 0,
  cycleStart: 0,
  timer: null,
  schedulerTimer: null,
  audio: null,
  audioStartTime: 0,
  nextClickIndex: 0,
  nextClickAudioTime: 0,
  tapTempoTimes: [],
  judged: new Set(),
  stats: { perfect: 0, good: 0, late: 0, miss: 0 },
  editorNotes: new Set(patterns[11].notes),
};

const $ = (id) => document.getElementById(id);
const totalSteps = 32;
const audioLeadMs = 80;
const scheduleAheadSeconds = 0.18;
const schedulerIntervalMs = 25;
const visualIntervalMs = 20;

function init() {
  loadCustomPattern();
  bindControls();
  renderTabs();
  renderSlots();
  renderEditor();
  selectPattern(0);
}

function bindControls() {
  $("bpm").addEventListener("input", (event) => setBpm(Number(event.target.value)));
  $("bpmDown").addEventListener("click", () => setBpm(state.bpm - 1));
  $("bpmUp").addEventListener("click", () => setBpm(state.bpm + 1));
  $("tapTempo").addEventListener("click", registerTapTempo);
  $("startBtn").addEventListener("click", togglePractice);
  $("listenBtn").addEventListener("click", playPreview);
  $("muteBtn").addEventListener("click", toggleMute);
  $("hitBtn").addEventListener("pointerdown", registerHit);
  $("saveCustom").addEventListener("click", saveCustomPattern);

  window.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
      event.preventDefault();
      registerHit();
    }
  });
}

function renderTabs() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      showPanel(tab.dataset.panel);
    });
  });
}

function showPanel(panelName) {
  document.querySelectorAll(".tab").forEach((item) => item.classList.toggle("active", item.dataset.panel === panelName));
  document.querySelectorAll(".panel").forEach((panel) => panel.classList.remove("active"));
  $(`${panelName}-panel`).classList.add("active");
}

function renderSlots() {
  const grid = $("slotGrid");
  grid.innerHTML = "";
  patterns.forEach((pattern, index) => {
    const button = document.createElement("button");
    button.className = "slot-card";
    button.innerHTML = `
      <span>${String(index + 1).padStart(2, "0")} / ${pattern.level}</span>
      <strong>${pattern.title}</strong>
      <p>${pattern.goal}</p>
    `;
    button.addEventListener("click", () => {
      selectPattern(index);
      showPanel("trainer");
      setFeedback("Ready", `${pattern.title}を選びました。LISTENで確認してからSTARTできます。`);
    });
    grid.appendChild(button);
  });
}

function renderEditor() {
  const grid = $("editorGrid");
  grid.innerHTML = "";
  for (let step = 0; step < totalSteps; step += 1) {
    const button = document.createElement("button");
    button.className = `editor-cell ${step % 4 === 0 ? "beat" : ""} ${state.editorNotes.has(step) ? "on" : ""}`;
    button.setAttribute("aria-label", `${step + 1}番目の16分`);
    button.addEventListener("click", () => {
      if (state.editorNotes.has(step)) {
        state.editorNotes.delete(step);
      } else {
        state.editorNotes.add(step);
      }
      renderEditor();
    });
    grid.appendChild(button);
  }
}

function selectPattern(index) {
  state.patternIndex = index;
  resetPractice();
  const pattern = patterns[index];
  $("levelLabel").textContent = pattern.level;
  $("patternTitle").textContent = pattern.title;
  $("patternGoal").textContent = pattern.goal;
  $("meterLabel").textContent = pattern.meter;
  $("barsLabel").textContent = `${pattern.bars}小節`;
  $("subdivisionLabel").textContent = pattern.swing ? "シャッフル想定" : "16分グリッド";
  document.querySelectorAll(".slot-card").forEach((card, cardIndex) => {
    card.classList.toggle("active", cardIndex === index);
  });
  renderNotation();
}

function renderNotation() {
  const pattern = patterns[state.patternIndex];
  const notation = $("notation");
  notation.innerHTML = "";
  for (let step = 0; step < totalSteps; step += 1) {
    const cell = document.createElement("div");
    cell.className = "cell";
    if (step % 4 === 0) cell.classList.add("beat");
    if (step === 16) cell.classList.add("barline");
    if (pattern.notes.includes(step)) {
      const note = document.createElement("i");
      note.className = "note";
      cell.appendChild(note);
    } else {
      cell.classList.add("rest");
    }
    notation.appendChild(cell);
  }

  const beatNumbers = $("beatNumbers");
  beatNumbers.innerHTML = "";
  ["1", "2", "3", "4", "1", "2", "3", "4"].forEach((number) => {
    const span = document.createElement("span");
    span.textContent = number;
    beatNumbers.appendChild(span);
  });
}

function setBpm(value) {
  const wasRunning = state.isRunning;
  state.bpm = Math.max(40, Math.min(180, Math.round(value)));
  $("bpm").value = state.bpm;
  $("bpmValue").textContent = state.bpm;
  if (wasRunning) {
    stopClock();
    state.isRunning = true;
    state.beat = -1;
    state.countInStart = performance.now() + audioLeadMs;
    state.countInBeat = -1;
    state.cycleStart = state.countInStart + quarterDuration() * 4;
    state.audioStartTime = state.audio.currentTime + audioLeadMs / 1000;
    state.nextClickIndex = 0;
    state.nextClickAudioTime = state.audioStartTime;
    startClock();
    $("nextCue").textContent = "COUNT 1";
  }
}

function registerTapTempo() {
  const now = performance.now();
  state.tapTempoTimes = state.tapTempoTimes.filter((time) => now - time < 2500);
  state.tapTempoTimes.push(now);
  if (state.tapTempoTimes.length >= 2) {
    const intervals = state.tapTempoTimes.slice(1).map((time, index) => time - state.tapTempoTimes[index]);
    const average = intervals.reduce((sum, item) => sum + item, 0) / intervals.length;
    setBpm(60000 / average);
  }
}

function togglePractice() {
  if (state.isRunning) {
    stopClock();
    $("startBtn").textContent = "START";
    $("nextCue").textContent = "PAUSED";
  } else {
    resetPractice();
    ensureAudio();
    state.isRunning = true;
    state.countInStart = performance.now() + audioLeadMs;
    state.countInBeat = -1;
    state.cycleStart = state.countInStart + quarterDuration() * 4;
    state.audioStartTime = state.audio.currentTime + audioLeadMs / 1000;
    state.nextClickIndex = 0;
    state.nextClickAudioTime = state.audioStartTime;
    startClock();
    $("startBtn").textContent = "STOP";
    $("nextCue").textContent = "COUNT 1";
  }
}

function startClock() {
  window.clearInterval(state.timer);
  window.clearInterval(state.schedulerTimer);
  state.timer = window.setInterval(tick, visualIntervalMs);
  state.schedulerTimer = window.setInterval(scheduleClicks, schedulerIntervalMs);
  scheduleClicks();
  tick();
}

function stopClock() {
  window.clearInterval(state.timer);
  window.clearInterval(state.schedulerTimer);
  state.timer = null;
  state.schedulerTimer = null;
  state.isRunning = false;
}

function scheduleClicks() {
  if (!state.isRunning || !state.audio) return;

  const quarterSeconds = quarterDuration() / 1000;
  while (state.nextClickAudioTime < state.audio.currentTime + scheduleAheadSeconds) {
    const clickIndex = state.nextClickIndex;
    const isCountIn = clickIndex < 4;
    const practiceBeat = (clickIndex - 4) % 8;
    const isStrongBeat = isCountIn ? clickIndex === 0 : practiceBeat === 0 || practiceBeat === 4;
    const frequency = isStrongBeat ? 920 : 620;
    const duration = isCountIn ? 0.055 : 0.045;

    playToneAt(frequency, state.nextClickAudioTime, duration);
    state.nextClickIndex += 1;
    state.nextClickAudioTime += quarterSeconds;
  }
}

function tick() {
  const now = performance.now();
  const interval = stepDuration();

  if (now < state.cycleStart) {
    const countBeat = Math.max(0, Math.floor((now - state.countInStart) / quarterDuration()));
    if (countBeat !== state.countInBeat && countBeat >= 0 && countBeat < 4) {
      state.countInBeat = countBeat;
      swingPendulum(countBeat * 4);
    }
    highlightStep(-1);
    $("nextCue").textContent = `COUNT ${Math.min(4, countBeat + 1)}`;
    return;
  }

  const elapsed = Math.max(0, now - state.cycleStart);
  const step = Math.floor(elapsed / interval) % totalSteps;
  state.step = step;

  highlightStep(step);
  markMisses(now);

  if (step % 4 === 0 && step !== state.beat) {
    state.beat = step;
    swingPendulum(step);
  }

  $("nextCue").textContent = state.isRunning ? `STEP ${step + 1}` : "READY";
}

function highlightStep(step) {
  document.querySelectorAll(".cell").forEach((cell, index) => {
    cell.classList.toggle("current", index === step);
  });
}

function markMisses(now) {
  const pattern = patterns[state.patternIndex];
  pattern.notes.forEach((noteStep) => {
    const target = targetTime(noteStep);
    const key = `${currentCycle()}-${noteStep}`;
    if (!state.judged.has(key) && now - target > 170) {
      state.judged.add(key);
      state.stats.miss += 1;
      markCell(noteStep, "hit-miss");
      updateScore("Miss", "拍を止めずに、次の音へ戻りましょう。");
    }
  });
}

function registerHit() {
  if (!state.isRunning) {
    $("feedbackLine").textContent = "STARTしてから、譜面の白い音符の場所でタップします。";
    return;
  }

  ensureAudio();
  playClick(360, 0.025);
  const pattern = patterns[state.patternIndex];
  const now = performance.now();
  const cycle = currentCycle();
  const candidates = pattern.notes
    .map((noteStep) => ({
      step: noteStep,
      diff: now - targetTime(noteStep),
      key: `${cycle}-${noteStep}`,
    }))
    .concat(
      pattern.notes.includes(0)
        ? [
            {
              step: 0,
              diff: now - targetTimeForCycle(cycle + 1, 0),
              key: `${cycle + 1}-0`,
            },
          ]
        : [],
    )
    .filter((candidate) => !state.judged.has(candidate.key))
    .sort((a, b) => Math.abs(a.diff) - Math.abs(b.diff));

  const nearest = candidates[0];
  if (!nearest || Math.abs(nearest.diff) > 180) {
    state.stats.late += 1;
    updateScore("Too far", "音符の少し手前から準備して、拍の上に置く感じで。");
    return;
  }

  state.judged.add(nearest.key);
  if (Math.abs(nearest.diff) <= 55) {
    state.stats.perfect += 1;
    markCell(nearest.step, "hit-perfect");
    updateScore("Perfect", nearest.diff < 0 ? "少し前ノリ。かなり良いです。" : "拍にきれいに乗っています。");
  } else if (Math.abs(nearest.diff) <= 110) {
    state.stats.good += 1;
    markCell(nearest.step, "hit-good");
    updateScore("Good", nearest.diff < 0 ? "ほんの少し早めです。" : "ほんの少し遅めです。");
  } else {
    state.stats.late += 1;
    markCell(nearest.step, "hit-miss");
    updateScore(nearest.diff < 0 ? "Early" : "Late", "足の4分を止めずに、もう一度。");
  }
}

function updateScore(label, message) {
  const score = state.stats.perfect * 100 + state.stats.good * 70 + state.stats.late * 25 - state.stats.miss * 15;
  $("scoreValue").textContent = Math.max(0, score);
  $("greatCount").textContent = state.stats.perfect;
  $("goodCount").textContent = state.stats.good;
  $("lateCount").textContent = state.stats.late;
  $("missCount").textContent = state.stats.miss;
  setFeedback(label, message);
}

function setFeedback(label, message) {
  const feedback = $("feedbackLine");
  const status = feedbackStatus(label);
  feedback.classList.remove("is-ready", "is-perfect", "is-good", "is-warning", "is-miss");
  feedback.classList.add(status);
  feedback.textContent = `${label}: ${message}`;
}

function feedbackStatus(label) {
  if (label === "Perfect") return "is-perfect";
  if (label === "Good") return "is-good";
  if (label === "Miss") return "is-miss";
  if (label === "Early" || label === "Late" || label === "Too far") return "is-warning";
  return "is-ready";
}

function resetPractice() {
  state.beat = -1;
  state.countInStart = 0;
  state.countInBeat = -1;
  state.judged.clear();
  state.stats = { perfect: 0, good: 0, late: 0, miss: 0 };
  updateScore("Ready", "足で拍を刻みながら、手は譜面の白い音符だけを狙ってみましょう。");
  document.querySelectorAll(".cell").forEach((cell) => {
    cell.classList.remove("hit-perfect", "hit-good", "hit-miss", "current");
  });
}

function playPreview() {
  ensureAudio();
  const pattern = patterns[state.patternIndex];
  const startAt = state.audio.currentTime + 0.08;
  pattern.notes.forEach((step) => {
    playToneAt(step % 4 === 0 ? 760 : 520, startAt + (step * stepDuration()) / 1000, 0.04);
  });
}

function toggleMute() {
  state.isMuted = !state.isMuted;
  $("muteBtn").setAttribute("aria-pressed", String(state.isMuted));
  $("muteBtn").textContent = state.isMuted ? "SOUND ON" : "MUTE";
}

function ensureAudio() {
  if (!state.audio) {
    state.audio = new AudioContext();
  }
  if (state.audio.state === "suspended") {
    state.audio.resume();
  }
}

function playClick(frequency, duration) {
  if (state.isMuted) return;
  ensureAudio();
  playToneAt(frequency, state.audio.currentTime, duration);
}

function playToneAt(frequency, when, duration) {
  if (state.isMuted) return;
  const oscillator = state.audio.createOscillator();
  const gain = state.audio.createGain();
  oscillator.frequency.value = frequency;
  oscillator.type = "square";
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(0.16, when + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  oscillator.connect(gain).connect(state.audio.destination);
  oscillator.start(when);
  oscillator.stop(when + duration + 0.01);
}

function stepDuration() {
  return 60000 / state.bpm / 4;
}

function quarterDuration() {
  return 60000 / state.bpm;
}

function currentCycle() {
  return Math.floor(Math.max(0, performance.now() - state.cycleStart) / (stepDuration() * totalSteps));
}

function targetTime(step) {
  return state.cycleStart + currentCycle() * stepDuration() * totalSteps + step * stepDuration();
}

function targetTimeForCycle(cycle, step) {
  return state.cycleStart + cycle * stepDuration() * totalSteps + step * stepDuration();
}

function markCell(step, className) {
  const cell = $("notation").children[step];
  if (!cell) return;
  cell.classList.remove("hit-perfect", "hit-good", "hit-miss");
  cell.classList.add(className);
}

function swingPendulum(step) {
  const left = step % 8 === 0;
  $("pendulum").style.setProperty("--swing", left ? "-18deg" : "18deg");
  $("pendulum").style.setProperty("--bob", left ? "-24px" : "24px");
}

function saveCustomPattern() {
  const notes = Array.from(state.editorNotes).sort((a, b) => a - b);
  if (!notes.length) {
    $("feedbackLine").textContent = "マイスロットには、最低1つ音符を入れてください。";
    return;
  }
  patterns[11].notes = notes;
  localStorage.setItem("rhythm-trainer-custom", JSON.stringify(notes));
  selectPattern(11);
  renderSlots();
}

function loadCustomPattern() {
  const saved = localStorage.getItem("rhythm-trainer-custom");
  if (!saved) return;
  try {
    const notes = JSON.parse(saved).filter((step) => Number.isInteger(step) && step >= 0 && step < totalSteps);
    if (notes.length) {
      patterns[11].notes = notes;
      state.editorNotes = new Set(notes);
    }
  } catch {
    localStorage.removeItem("rhythm-trainer-custom");
  }
}

init();
