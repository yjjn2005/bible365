(function () {
  "use strict";

  const API_BASE = "https://bible365-api.yjjn2005.workers.dev";
  const STORAGE_KEY = "bible365_progress_v1";
  const START_KEY = "bible365_start_date_v1";
  const PIN_KEY = "bible365_pin";
  const DAY_MS = 24 * 60 * 60 * 1000;

  function loadProgress() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  }
  function saveProgress(p) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  }

  let progress = loadProgress();

  // ---------- Self-paced day: Day 1 = the day this app was first opened ----------
  function getStartDate() {
    let raw = localStorage.getItem(START_KEY);
    if (!raw) {
      raw = String(Date.now());
      localStorage.setItem(START_KEY, raw);
    }
    return parseInt(raw, 10);
  }

  function currentDay() {
    const start = getStartDate();
    const startMidnight = new Date(start);
    startMidnight.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diff = Math.floor((now - startMidnight) / DAY_MS);
    return Math.min(365, Math.max(1, diff + 1));
  }

  function entryFor(day) {
    return READING_PLAN[day - 1];
  }

  // ---------- Reading hero (today) ----------
  function renderToday() {
    const day = currentDay();
    const e = entryFor(day);
    const rec = progress[day] || {};

    const card = document.getElementById("todayCard");
    card.innerHTML = `
      <div class="rh-day">
        <div class="rh-day-num">${day}</div>
        <div class="rh-day-label">일 차</div>
      </div>
      <div class="rh-refs">
        <div class="rh-ref">
          <div class="rh-ref-label">시편</div>
          <div class="rh-ref-value">${e.psalm}편</div>
        </div>
        <div class="rh-ref">
          <div class="rh-ref-label">잠언</div>
          <div class="rh-ref-value">${e.proverb}장</div>
        </div>
      </div>
      <div class="rh-divider"></div>
      <div class="rh-prompts">
        <div class="rh-prompt">
          <div class="rh-prompt-q">${e.psalmPrompt}</div>
          <textarea id="psalmNote" placeholder="짧게 적어보세요 (선택)">${rec.psalmNote || ""}</textarea>
        </div>
        <div class="rh-prompt">
          <div class="rh-prompt-q">${e.proverbPrompt}</div>
          <textarea id="proverbNote" placeholder="짧게 적어보세요 (선택)">${rec.proverbNote || ""}</textarea>
        </div>
      </div>
      <div class="rh-foot">
        <button id="doneBtn" class="done-btn ${rec.done ? "checked" : ""}">
          ${rec.done ? "오늘 통독 완료 ✓" : "오늘 통독 완료로 표시"}
        </button>
      </div>
    `;

    document.getElementById("psalmNote").addEventListener("change", (ev) => {
      updateRecord(day, { psalmNote: ev.target.value });
    });
    document.getElementById("proverbNote").addEventListener("change", (ev) => {
      updateRecord(day, { proverbNote: ev.target.value });
    });
    document.getElementById("doneBtn").addEventListener("click", () => {
      const cur = progress[day] || {};
      updateRecord(day, { done: !cur.done, doneAt: Date.now() });
      renderToday();
      renderProgressStrip();
    });
  }

  function updateRecord(day, patch) {
    progress[day] = Object.assign({}, progress[day] || {}, patch);
    saveProgress(progress);
  }

  // ---------- Progress strip ----------
  function computeStreak() {
    let streak = 0;
    let day = currentDay();
    while (day >= 1) {
      if (progress[day] && progress[day].done) {
        streak++;
        day--;
      } else {
        break;
      }
    }
    return streak;
  }

  function renderProgressStrip() {
    const doneCount = Object.values(progress).filter((r) => r.done).length;
    document.getElementById("doneCount").textContent = doneCount;
    document.getElementById("progressFill").style.width = ((doneCount / 365) * 100).toFixed(1) + "%";
    document.getElementById("streakLabel").textContent = `연속 ${computeStreak()}일`;
  }

  // ---------- Range list (전체 목록) ----------
  const RANGE_SIZE = 30;
  const RANGE_COUNT = Math.ceil(365 / RANGE_SIZE);

  function initRangeSelect() {
    const sel = document.getElementById("rangeSelect");
    for (let i = 0; i < RANGE_COUNT; i++) {
      const from = i * RANGE_SIZE + 1;
      const to = Math.min(365, (i + 1) * RANGE_SIZE);
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = `${from}일 ~ ${to}일`;
      sel.appendChild(opt);
    }
    const todayRangeIdx = Math.floor((currentDay() - 1) / RANGE_SIZE);
    sel.value = todayRangeIdx;
    sel.addEventListener("change", () => renderRangeList(parseInt(sel.value, 10)));
    renderRangeList(todayRangeIdx);
  }

  function renderRangeList(rangeIdx) {
    const container = document.getElementById("rangeList");
    container.innerHTML = "";
    const from = rangeIdx * RANGE_SIZE + 1;
    const to = Math.min(365, (rangeIdx + 1) * RANGE_SIZE);
    for (let day = from; day <= to; day++) {
      const e = entryFor(day);
      const rec = progress[day] || {};
      const row = document.createElement("div");
      row.className = "range-row" + (rec.done ? " done" : "");
      row.innerHTML = `
        <span class="rr-day">${day}일</span>
        <span class="rr-refs">시편 ${e.psalm}편 · 잠언 ${e.proverb}장</span>
        <span class="rr-check">✓</span>
      `;
      row.addEventListener("click", () => {
        updateRecord(day, { done: !rec.done, doneAt: Date.now() });
        renderRangeList(rangeIdx);
        renderProgressStrip();
        renderToday();
      });
      container.appendChild(row);
    }
  }

  // ---------- Tabs ----------
  function initTabs() {
    const tabs = document.querySelectorAll(".tab");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        document.querySelectorAll(".view").forEach((v) => v.classList.add("hidden"));
        const view = tab.dataset.view;
        if (view === "today") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          document.getElementById(view + "View").classList.remove("hidden");
        }
      });
    });
  }

  // ---------- Settings / sync ----------
  function initSettings() {
    const pinInput = document.getElementById("pinInput");
    pinInput.value = localStorage.getItem(PIN_KEY) || "";

    document.getElementById("btnSavePin").addEventListener("click", () => {
      const pin = pinInput.value.trim();
      if (!pin) return;
      localStorage.setItem(PIN_KEY, pin);
      setSyncStatus("PIN이 저장되었습니다: " + pin);
    });

    document.getElementById("btnPush").addEventListener("click", () => pushSync());
    document.getElementById("btnPull").addEventListener("click", () => pullSync());
    document.getElementById("btnSync").addEventListener("click", () => {
      const tabSettings = document.querySelector('.tab[data-view="settings"]');
      tabSettings.click();
    });

    document.getElementById("btnReset").addEventListener("click", () => {
      if (!confirm("이 기기의 모든 기록과 시작일을 삭제할까요? 이 동작은 되돌릴 수 없습니다.")) return;
      progress = {};
      saveProgress(progress);
      localStorage.removeItem(START_KEY);
      renderToday();
      renderProgressStrip();
      initRangeSelect();
    });
  }

  function setSyncStatus(text) {
    document.getElementById("syncStatus").textContent = text;
  }

  function getPin() {
    return localStorage.getItem(PIN_KEY) || document.getElementById("pinInput").value.trim();
  }

  async function pushSync() {
    const pin = getPin();
    if (!pin) { setSyncStatus("먼저 PIN을 입력하고 저장하세요."); return; }
    setSyncStatus("업로드 중...");
    try {
      const res = await fetch(API_BASE + "/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, data: { progress, startDate: getStartDate() } }),
      });
      if (!res.ok) throw new Error("서버 오류");
      setSyncStatus("업로드 완료: " + new Date().toLocaleString("ko-KR"));
    } catch (err) {
      setSyncStatus("업로드 실패: " + err.message);
    }
  }

  async function pullSync() {
    const pin = getPin();
    if (!pin) { setSyncStatus("먼저 PIN을 입력하고 저장하세요."); return; }
    setSyncStatus("가져오는 중...");
    try {
      const res = await fetch(API_BASE + "/sync?pin=" + encodeURIComponent(pin));
      if (!res.ok) throw new Error("서버 오류");
      const json = await res.json();
      if (!json.found || !json.data) { setSyncStatus("서버에 저장된 기록이 없습니다."); return; }
      progress = json.data.progress || {};
      saveProgress(progress);
      if (json.data.startDate) localStorage.setItem(START_KEY, String(json.data.startDate));
      renderToday();
      renderProgressStrip();
      initRangeSelect();
      setSyncStatus("가져오기 완료: " + new Date().toLocaleString("ko-KR"));
    } catch (err) {
      setSyncStatus("가져오기 실패: " + err.message);
    }
  }

  // ---------- Init ----------
  document.addEventListener("DOMContentLoaded", () => {
    renderToday();
    renderProgressStrip();
    initTabs();
    initRangeSelect();
    initSettings();
  });
})();
