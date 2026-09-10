(function () {
  "use strict";

  const API_BASE = "https://bible365-api.yjjn2005.workers.dev";
  const STORAGE_KEY = "bible365_progress_v1";
  const PIN_KEY = "bible365_pin";

  const MONTH_LENS = [31,28,31,30,31,30,31,31,30,31,30,31];

  function monthDayToDoy(monthIdx, dom) {
    let doy = dom;
    for (let i = 0; i < monthIdx; i++) doy += MONTH_LENS[i];
    return doy;
  }

  function todayDoy() {
    const d = new Date();
    let dom = d.getDate();
    const mi = d.getMonth();
    if (mi === 1 && dom === 29) dom = 28; // 2/29 -> treat as 2/28 entry
    return monthDayToDoy(mi, dom);
  }

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

  function entryFor(day) {
    return READING_PLAN[day - 1];
  }

  // ---------- Today card ----------
  function renderToday() {
    const doy = todayDoy();
    const e = entryFor(doy);
    const rec = progress[doy] || {};
    const d = new Date();
    const dateLabel = `${d.getMonth() + 1}월 ${d.getDate()}일`;

    const card = document.getElementById("todayCard");
    card.innerHTML = `
      <div class="tc-head">
        <span class="tc-day">${doy}일째</span>
        <span class="tc-date">${dateLabel}</span>
      </div>
      <div class="tc-refs">
        <div class="tc-ref">
          <div class="tc-ref-label">시편</div>
          <div class="tc-ref-value">${e.psalm}편</div>
        </div>
        <div class="tc-ref">
          <div class="tc-ref-label">잠언</div>
          <div class="tc-ref-value">${e.proverb}장</div>
        </div>
      </div>
      <div class="tc-prompts">
        <div class="tc-prompt">
          <div class="tc-prompt-q">${e.psalmPrompt}</div>
          <textarea id="psalmNote" placeholder="짧게 적어보세요 (선택)">${rec.psalmNote || ""}</textarea>
        </div>
        <div class="tc-prompt">
          <div class="tc-prompt-q">${e.proverbPrompt}</div>
          <textarea id="proverbNote" placeholder="짧게 적어보세요 (선택)">${rec.proverbNote || ""}</textarea>
        </div>
      </div>
      <div class="tc-foot">
        <button id="doneBtn" class="done-btn ${rec.done ? "checked" : ""}">
          ${rec.done ? "오늘 통독 완료 ✓" : "오늘 통독 완료로 표시"}
        </button>
      </div>
    `;

    document.getElementById("psalmNote").addEventListener("change", (ev) => {
      updateRecord(doy, { psalmNote: ev.target.value });
    });
    document.getElementById("proverbNote").addEventListener("change", (ev) => {
      updateRecord(doy, { proverbNote: ev.target.value });
    });
    document.getElementById("doneBtn").addEventListener("click", () => {
      const cur = progress[doy] || {};
      updateRecord(doy, { done: !cur.done, doneAt: Date.now() });
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
    let doy = todayDoy();
    while (doy >= 1) {
      if (progress[doy] && progress[doy].done) {
        streak++;
        doy--;
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
    document.getElementById("pctLabel").textContent = Math.round((doneCount / 365) * 100) + "%";
    document.getElementById("streakLabel").textContent = `연속 ${computeStreak()}일`;
  }

  // ---------- Calendar view ----------
  const MONTH_NAMES = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

  function initCalendar() {
    const sel = document.getElementById("monthSelect");
    MONTH_NAMES.forEach((name, i) => {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = name;
      sel.appendChild(opt);
    });
    sel.value = new Date().getMonth();
    sel.addEventListener("change", () => renderMonthList(parseInt(sel.value, 10)));
    renderMonthList(new Date().getMonth());
  }

  function renderMonthList(monthIdx) {
    const container = document.getElementById("monthList");
    container.innerHTML = "";
    const len = MONTH_LENS[monthIdx];
    for (let dom = 1; dom <= len; dom++) {
      const doy = monthDayToDoy(monthIdx, dom);
      const e = entryFor(doy);
      const rec = progress[doy] || {};
      const row = document.createElement("div");
      row.className = "month-row" + (rec.done ? " done" : "");
      row.innerHTML = `
        <span class="mr-day">${dom}일</span>
        <span class="mr-refs">시편 ${e.psalm}편 · 잠언 ${e.proverb}장</span>
        <span class="mr-check">✓</span>
      `;
      row.addEventListener("click", () => {
        updateRecord(doy, { done: !rec.done, doneAt: Date.now() });
        renderMonthList(monthIdx);
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
          document.getElementById("todayCard").scrollIntoView({ behavior: "smooth" });
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
    document.getElementById("btnSync").addEventListener("click", () => pullThenPush());

    document.getElementById("btnReset").addEventListener("click", () => {
      if (!confirm("이 기기의 모든 기록을 삭제할까요? 이 동작은 되돌릴 수 없습니다.")) return;
      progress = {};
      saveProgress(progress);
      renderToday();
      renderProgressStrip();
      renderMonthList(new Date().getMonth());
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
        body: JSON.stringify({ pin, data: progress }),
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
      if (!json.found) { setSyncStatus("서버에 저장된 기록이 없습니다."); return; }
      progress = json.data || {};
      saveProgress(progress);
      renderToday();
      renderProgressStrip();
      renderMonthList(new Date().getMonth());
      setSyncStatus("가져오기 완료: " + new Date().toLocaleString("ko-KR"));
    } catch (err) {
      setSyncStatus("가져오기 실패: " + err.message);
    }
  }

  async function pullThenPush() {
    // quick top-bar sync: try pull, then push current (merged manually by user via settings if conflict)
    const pin = getPin();
    if (!pin) { alert("설정 탭에서 먼저 PIN을 저장해주세요."); return; }
    await pushSync();
  }

  // ---------- Init ----------
  document.addEventListener("DOMContentLoaded", () => {
    renderToday();
    renderProgressStrip();
    initTabs();
    initCalendar();
    initSettings();
  });
})();
