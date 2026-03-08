/**
 * KOLTYN OS — pages/workout.js
 *
 * DATA FLOW
 *   APP_DATA.workout             → exercise data (recovery + ramping phases)
 *   APP_DATA.stretchingRoutine   → static stretching reference
 *   APP_DATA.morningRoutine      → static morning routine reference
 *   APP_DATA.healthPrinciples.workout → static principles
 *
 *   STATE.data.workout → currentPhase, schedule, currentDayIndex,
 *                        cycleCount, weekNumber, log, logbook, progressPics
 *
 * WRITES TO STATE → IDB (all mutators call save() → IndexedDB asynchronously)
 *   STATE.logWorkout(dayName, phase, exercises, notes)
 *     → advances currentDayIndex, tracks cycleCount/weekNumber
 *   STATE.addLogbookEntry(entry)  → detailed sets/reps/weight log
 *   STATE.setWorkoutPhase(phase)  → manual phase override
 *   STATE.advancePhase()          → auto-advance when cycle limit reached
 *   STATE.addProgressPic(dataUrl, note) → stores base64 image
 *   STATE.removeProgressPic(idx)        → deletes image
 *
 * PHASE CYCLING
 *   Recovery: 5 cycles (Weeks 1–5). After 5 cycles, advance button appears.
 *   Ramping:  7 cycles (Weeks 6–12). After 7 cycles, reset button appears.
 *   Cycle = one full run through all 7 scheduled days.
 *
 * SCHEDULE
 *   ['Upper','Lower','Rest','Pull','Push','Legs','Rest']
 *   Rest after Lower (posterior chain) + Rest after Legs (both taxing).
 *   Day tabs show the full 7-step schedule so both Rest days are visible.
 *
 * TABS: Today | Logbook | History | Progress Pics | Principles
 *   Morning Routine and Stretching are collapsible sections inside the Today tab.
 *   Macro Calculator lives on the Nutrition page.
 */

window.registerPage('workout', function initWorkout() {

  /* ── Data ── */
  const RECOVERY = APP_DATA.workout.recovery;
  const RAMPING  = APP_DATA.workout.ramping;
  const REST_DAY = APP_DATA.workout.restDay;

  /* ── Live state ── */
  const ws = STATE.data.workout;

  const PHASE_LIMITS = { recovery: 5, ramping: 7 };

  /* Full 7-day schedule used for day tabs — shows both Rest days */
  const SCHEDULE = ['Upper', 'Lower', 'Rest', 'Pull', 'Push', 'Legs', 'Rest'];

  let currentPhaseName = ws.currentPhase || 'recovery';
  let currentPhaseData = currentPhaseName === 'ramping' ? RAMPING : RECOVERY;
  let currentDay       = ws.schedule[ws.currentDayIndex % ws.schedule.length];

  /* ── Build page shell ── */
  const inner = document.getElementById('workout-inner');
  inner.innerHTML = `
    ${buildPageHeader('Jeff Nippard PPL', 'Workout', 'Program',
      'Recovery (Wks 1–5) → Ramping (Wks 6–12). Tap any exercise for notes & swaps.',
      `<div class="phase-toggle">
         <button class="phase-btn${currentPhaseName === 'recovery' ? ' active' : ''}" id="btnRecovery">Recovery</button>
         <button class="phase-btn${currentPhaseName === 'ramping'  ? ' active' : ''}" id="btnRamping">Ramping</button>
       </div>`
    )}

    <!-- Tab bar: Morning + Stretching are sections inside Today; Macro Calc is on Nutrition page -->
    <div class="day-tabs" id="mainWorkoutTabs" style="margin-bottom:8px;flex-wrap:wrap">
      <button class="day-tab active" data-wtab="today">Today</button>
      <button class="day-tab"        data-wtab="logbook">Logbook</button>
      <button class="day-tab"        data-wtab="log">History</button>
      <button class="day-tab"        data-wtab="pics">Progress Pics</button>
      <button class="day-tab"        data-wtab="principles">Principles</button>
    </div>

    <div id="workoutTabPanel"></div>`;

  /* ── Phase toggle ── */
  function setPhase(name) {
    currentPhaseName = name;
    currentPhaseData = name === 'ramping' ? RAMPING : RECOVERY;
    STATE.setWorkoutPhase(name);
    inner.querySelector('#btnRecovery').classList.toggle('active', name === 'recovery');
    inner.querySelector('#btnRamping').classList.toggle('active',  name === 'ramping');
    if (activeTab === 'today') renderToday();
  }

  inner.querySelector('#btnRecovery').addEventListener('click', () => setPhase('recovery'));
  inner.querySelector('#btnRamping').addEventListener('click',  () => setPhase('ramping'));

  /* ── Tab routing ── */
  let activeTab = 'today';
  inner.querySelectorAll('[data-wtab]').forEach(btn => {
    btn.addEventListener('click', () => {
      inner.querySelectorAll('[data-wtab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTab = btn.dataset.wtab;
      renderTab();
    });
  });

  function renderTab() {
    const panel = document.getElementById('workoutTabPanel');
    switch (activeTab) {
      case 'today':      renderToday();               break;
      case 'logbook':    renderLogbook(panel);         break;
      case 'log':        renderHistory(panel);         break;
      case 'pics':       renderProgressPics(panel);    break;
      case 'principles': renderPrinciples(panel);      break;
    }
  }

  /* ══════════════════════════════════════════════════════════════
     TODAY TAB
     Displays the current scheduled day's exercises.
     Below the exercises: collapsible Morning Routine section,
     then collapsible Stretching section.
     "Log Session" form at the bottom advances the schedule → IDB.
  ══════════════════════════════════════════════════════════════ */
  function renderToday() {
    const panel = document.getElementById('workoutTabPanel');
    currentDay = ws.schedule[ws.currentDayIndex % ws.schedule.length];
    const dayData     = currentDay === 'Rest' ? REST_DAY : (currentPhaseData[currentDay] || { focus:'', exercises:[] });
    const phaseName   = currentPhaseName === 'recovery' ? 'Recovery Phase' : 'Ramping Phase';
    const cycleLimit  = PHASE_LIMITS[currentPhaseName];
    const cyclesDone  = ws.cycleCount || 0;
    const canAdvance  = cyclesDone >= cycleLimit;
    const nextPhase   = currentPhaseName === 'recovery' ? 'Ramping' : 'Recovery';

    panel.innerHTML = `
      <!-- Phase status card -->
      <div class="card" style="margin-bottom:16px">
        <div class="card-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
          <div>
            <div class="card-title">${phaseName} — ${currentPhaseName === 'recovery' ? 'Weeks 1–5' : 'Weeks 6–12'}</div>
            <div style="font-size:11px;color:var(--muted);margin-top:2px">
              Week ${ws.weekNumber || 1} · Cycle ${cyclesDone + 1} of ${cycleLimit}
            </div>
          </div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            ${canAdvance ? `
              <div style="font-size:11px;color:var(--accent3);margin-right:4px">${cyclesDone}/${cycleLimit} cycles ✓ Phase complete!</div>
              <button class="day-tab active" id="advancePhaseBtn" style="padding:7px 16px;font-size:12px">
                → Switch to ${nextPhase} Phase
              </button>` : `
              <span class="badge badge-warn">${currentPhaseName === 'recovery' ? 'Technique Focus' : 'Progressive Overload'}</span>`}
          </div>
        </div>
        <!-- Cycle progress bar -->
        <div class="card-body" style="padding:10px 16px 14px">
          <div style="font-size:10px;color:var(--muted);margin-bottom:5px">Cycles completed: ${cyclesDone} / ${cycleLimit}</div>
          <div class="progress-track"><div class="progress-fill" style="width:${Math.min(100, (cyclesDone/cycleLimit)*100)}%"></div></div>
          <!-- Day tabs — full 7-step schedule so both Rest days are shown -->
          <div class="day-tabs" style="margin-top:14px" id="dayTabs"></div>
        </div>
      </div>

      <!-- Exercise card -->
      <div id="workoutContent"></div>

      <!-- Log session form -->
      ${currentDay !== 'Rest' ? `
        <div class="card" style="margin-top:16px">
          <div class="card-header" style="display:flex;align-items:center;justify-content:space-between">
            <div class="card-title">Log Session</div>
            <span class="badge badge-muted">${currentDay}</span>
          </div>
          <div class="card-body" style="padding:16px">
            <div style="font-size:12px;color:var(--muted);margin-bottom:12px">
              Record your actual sets, reps, and weight. Saves to Logbook + advances schedule.
            </div>
            <div id="logFormExercises"></div>
            <textarea class="venture-notes-input" id="workoutNotes" placeholder="Session notes — how it felt, what to adjust…" style="height:56px;margin-top:10px"></textarea>
            <button class="phase-btn active" id="logWorkoutBtn" style="margin-top:12px;padding:10px 24px;font-size:14px">✓ Log ${currentDay} Session</button>
          </div>
        </div>` : `
        <div class="card" style="margin-top:16px">
          <div class="card-body" style="padding:20px;text-align:center">
            <div style="font-size:28px;margin-bottom:8px">😴</div>
            <div style="font-family:'Rajdhani',sans-serif;font-size:16px;font-weight:700;margin-bottom:4px">Rest Day</div>
            <div style="font-size:12px;color:var(--muted);margin-bottom:16px">Active recovery only — walk, stretch, foam roll.</div>
            <button class="day-tab active" id="logRestBtn" style="padding:8px 20px">Mark Rest Day Complete →</button>
          </div>
        </div>`}

      <!-- ── Morning Routine — collapsible section in Today tab ── -->
      <div class="card" style="margin-top:16px" id="morningSection">
        <div class="card-header" style="cursor:pointer;display:flex;align-items:center;justify-content:space-between" id="morningToggle">
          <div class="card-title">Morning Routine</div>
          <span style="font-size:18px;color:var(--muted);transition:transform 0.2s" id="morningArrow">▾</span>
        </div>
        <div id="morningBody" style="display:none"></div>
      </div>

      <!-- ── Stretching — collapsible section in Today tab ── -->
      <div class="card" style="margin-top:10px" id="stretchSection">
        <div class="card-header" style="cursor:pointer;display:flex;align-items:center;justify-content:space-between" id="stretchToggle">
          <div class="card-title">Stretching</div>
          <span style="font-size:18px;color:var(--muted);transition:transform 0.2s" id="stretchArrow">▾</span>
        </div>
        <div id="stretchBody" style="display:none"></div>
      </div>`;

    /* Phase advance button */
    inner.querySelector('#advancePhaseBtn')?.addEventListener('click', () => {
      if (!confirm(`Switch from ${currentPhaseName} to ${nextPhase.toLowerCase()} phase? This resets your cycle count.`)) return;
      STATE.advancePhase();
      currentPhaseName = ws.currentPhase;
      currentPhaseData = currentPhaseName === 'ramping' ? RAMPING : RECOVERY;
      inner.querySelector('#btnRecovery').classList.toggle('active', currentPhaseName === 'recovery');
      inner.querySelector('#btnRamping').classList.toggle('active',  currentPhaseName === 'ramping');
      renderToday();
    });

    renderDayTabs();
    renderDayContent();
    buildLogForm();

    /* Rest day log button */
    inner.querySelector('#logRestBtn')?.addEventListener('click', () => {
      STATE.logWorkout(currentDay, currentPhaseName, [], '');
      renderToday();
    });

    /* Log session button */
    inner.querySelector('#logWorkoutBtn')?.addEventListener('click', () => {
      const notes     = (inner.querySelector('#workoutNotes')?.value || '').trim();
      const exercises = collectLogFormData();
      STATE.logWorkout(currentDay, currentPhaseName, exercises.map(e => e.name), notes);
      if (exercises.some(e => e.sets.length > 0)) {
        STATE.addLogbookEntry({ dayName: currentDay, phase: currentPhaseName, exercises });
      }
      renderToday();
    });

    /* ── Morning Routine collapsible ── */
    const morningToggle = panel.querySelector('#morningToggle');
    const morningBody   = panel.querySelector('#morningBody');
    const morningArrow  = panel.querySelector('#morningArrow');
    const routine       = APP_DATA.morningRoutine || [];
    morningBody.innerHTML = `
      <div class="card-body" style="padding:4px 16px">
        <div style="font-size:12px;color:var(--muted);padding:8px 0 10px">Non-negotiable daily foundation. Complete before any work begins.</div>
        ${routine.map((step, i) => `
          <div style="display:flex;align-items:flex-start;gap:12px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
            <span style="font-size:20px;line-height:1.1">${step.icon}</span>
            <div style="flex:1">
              <div style="font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:700;margin-bottom:2px">
                <span style="color:var(--accent);margin-right:5px">${i+1}.</span>${step.step}
              </div>
              <div style="font-size:11.5px;color:rgba(226,234,242,0.65);line-height:1.5">${step.detail}</div>
            </div>
          </div>`).join('')}
      </div>`;
    morningToggle.addEventListener('click', () => {
      const open = morningBody.style.display !== 'none';
      morningBody.style.display = open ? 'none' : 'block';
      morningArrow.style.transform = open ? '' : 'rotate(180deg)';
    });

    /* ── Stretching collapsible ── */
    const stretchToggle = panel.querySelector('#stretchToggle');
    const stretchBody   = panel.querySelector('#stretchBody');
    const stretchArrow  = panel.querySelector('#stretchArrow');
    const sr            = APP_DATA.stretchingRoutine || {};

    function stretchCard(s) {
      return `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
          <div style="flex:1">
            <div style="font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700;margin-bottom:2px">${s.name}</div>
            <div style="font-size:11.5px;color:rgba(226,234,242,0.65);line-height:1.5">${s.instruction}</div>
          </div>
          <span class="badge badge-muted" style="margin-left:10px;flex-shrink:0">${s.duration}</span>
        </div>`;
    }

    stretchBody.innerHTML = `
      <div class="card-body" style="padding:4px 16px">
        <div style="font-size:11px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--accent);padding:8px 0 4px">Morning Activation</div>
        ${(sr.morning || []).map(stretchCard).join('')}
        <div style="font-size:11px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--accent);padding:12px 0 4px">Post-Workout Cooldown</div>
        ${(sr.postWorkout || []).map(stretchCard).join('')}
      </div>`;
    stretchToggle.addEventListener('click', () => {
      const open = stretchBody.style.display !== 'none';
      stretchBody.style.display = open ? 'none' : 'block';
      stretchArrow.style.transform = open ? '' : 'rotate(180deg)';
    });
  }

  /* Build the inline log form with one row per exercise */
  function buildLogForm() {
    const formEl = document.getElementById('logFormExercises');
    if (!formEl || currentDay === 'Rest') return;
    const dayData = currentPhaseData[currentDay] || { exercises: [] };
    formEl.innerHTML = '';
    dayData.exercises.forEach((ex, ei) => {
      const row = document.createElement('div');
      row.className = 'logbook-ex-row';
      row.dataset.exidx = ei;
      row.innerHTML = `
        <div class="logbook-ex-name">${ex.name}</div>
        <div class="logbook-sets" id="lsets-${ei}">
          <div class="logbook-set-row" data-set="0">
            <span class="logbook-set-label">Set 1</span>
            <input class="form-input logbook-reps" type="number" placeholder="Reps" min="1" style="width:70px" />
            <span style="font-size:11px;color:var(--muted)">×</span>
            <input class="form-input logbook-weight" type="number" placeholder="lbs" min="0" style="width:80px" />
          </div>
        </div>
        <button class="logbook-add-set" data-exidx="${ei}">+ Set</button>`;
      formEl.appendChild(row);

      row.querySelector('.logbook-add-set').addEventListener('click', () => {
        const setsEl = row.querySelector(`#lsets-${ei}`);
        const setNum = setsEl.children.length + 1;
        const setRow = document.createElement('div');
        setRow.className = 'logbook-set-row';
        setRow.dataset.set = setNum - 1;
        setRow.innerHTML = `
          <span class="logbook-set-label">Set ${setNum}</span>
          <input class="form-input logbook-reps" type="number" placeholder="Reps" min="1" style="width:70px" />
          <span style="font-size:11px;color:var(--muted)">×</span>
          <input class="form-input logbook-weight" type="number" placeholder="lbs" min="0" style="width:80px" />
          <button class="logbook-rm-set" title="Remove set">×</button>`;
        setRow.querySelector('.logbook-rm-set').addEventListener('click', () => setRow.remove());
        setsEl.appendChild(setRow);
      });
    });
  }

  /* Collect log form data into [{name, sets:[{reps,weight}]}] */
  function collectLogFormData() {
    const formEl = document.getElementById('logFormExercises');
    if (!formEl) return [];
    const dayData = currentPhaseData[currentDay] || { exercises: [] };
    const result  = [];
    formEl.querySelectorAll('.logbook-ex-row').forEach((row, ei) => {
      const sets = [];
      row.querySelectorAll('.logbook-set-row').forEach(sr => {
        const reps   = parseInt(sr.querySelector('.logbook-reps')?.value)    || 0;
        const weight = parseFloat(sr.querySelector('.logbook-weight')?.value) || 0;
        if (reps || weight) sets.push({ reps, weight, duration: null, notes: '' });
      });
      result.push({ name: dayData.exercises[ei]?.name || 'Exercise ' + (ei+1), sets });
    });
    return result;
  }

  /* Day tabs — uses the full 7-step schedule so BOTH Rest days appear.
     Tabs are labelled by position: "Rest" and "Rest" — clicking either
     shows the rest day info (same content). */
  function renderDayTabs() {
    const tabs = document.getElementById('dayTabs');
    if (!tabs) return;
    tabs.innerHTML = '';
    SCHEDULE.forEach((day, idx) => {
      const btn = document.createElement('button');
      /* Both Rest slots highlight when currentDay is 'Rest' — they show the same content */
      btn.className = 'day-tab' + (currentDay === day ? ' active' : '');
      btn.textContent = day;
      btn.addEventListener('click', () => {
        currentDay = day;
        tabs.querySelectorAll('.day-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderDayContent();
        buildLogForm();
      });
      tabs.appendChild(btn);
    });
  }

  function renderDayContent() {
    const content = document.getElementById('workoutContent');
    if (!content) return;
    const dayData   = currentDay === 'Rest' ? REST_DAY : (currentPhaseData[currentDay] || { focus:'', exercises:[] });
    const phaseName = currentPhaseName === 'recovery' ? 'Recovery Phase' : 'Ramping Phase';

    content.innerHTML = `
      <div class="workout-card">
        <div class="workout-card-header">
          <div>
            <div class="workout-card-phase">${phaseName}</div>
            <div class="workout-card-day">${currentDay}</div>
            <div class="workout-card-focus">${dayData.focus}</div>
          </div>
          <span class="badge badge-accent">${dayData.exercises.length} exercises</span>
        </div>
        <div class="exercise-list" id="exerciseList"></div>
      </div>`;

    const list = document.getElementById('exerciseList');
    dayData.exercises.forEach((ex, i) => {
      const row = document.createElement('div');
      row.className = 'exercise-row';
      row.innerHTML = `
        <div class="ex-num">${i + 1}</div>
        <div class="ex-info">
          <div class="ex-name">${ex.name}</div>
          <div class="ex-meta">
            <span class="ex-chip">${ex.muscle}</span>
            <span class="ex-chip reps">${ex.reps}</span>
            <span class="ex-chip rpe">RPE ${ex.rpe}</span>
            <span class="ex-chip">Rest: ${ex.rest}</span>
          </div>
          ${ex.notes ? `<div class="ex-notes">${ex.notes}</div>` : ''}
        </div>`;
      row.addEventListener('click', () => openExModal(ex, i + 1));
      list.appendChild(row);
    });
  }

  /* ── Exercise modal ── */
  const exOverlay = document.getElementById('exModalOverlay');
  const exModal   = document.querySelector('#page-workout .ex-modal');

  function openExModal(ex, num) {
    document.getElementById('exModalEyebrow').textContent = ex.muscle + ' · ' + (currentPhaseName === 'recovery' ? 'Recovery Phase' : 'Ramping Phase');
    document.getElementById('exModalTitle').textContent   = ex.name;
    document.getElementById('exModalChips').innerHTML = `
      <span class="badge badge-accent">${ex.reps}</span>
      <span class="badge badge-warn">RPE ${ex.rpe}</span>
      <span class="badge badge-muted">Rest ${ex.rest}</span>`;
    document.getElementById('exModalBody').innerHTML = `
      <div class="modal-section">
        <div class="modal-section-label" style="color:var(--accent)">Coaching Notes
          <span style="flex:1;height:1px;background:var(--border);display:block;margin-left:10px"></span>
        </div>
        <div class="description-text" style="line-height:1.7">${ex.notes || 'Focus on quality reps. Control the negative on every set.'}</div>
      </div>
      <div class="modal-section" style="margin-top:20px">
        <div class="modal-section-label" style="color:var(--accent)">Swap Options
          <span style="flex:1;height:1px;background:var(--border);display:block;margin-left:10px"></span>
        </div>
        <div class="swap-list">
          ${(ex.swaps || []).map((s, i) => `<div class="swap-item"><strong>Option ${i+1}:</strong> ${s}</div>`).join('')}
          ${!ex.swaps?.length ? '<div style="color:var(--muted);font-size:13px">No direct swaps — this exercise is foundational.</div>' : ''}
        </div>
      </div>`;
    exOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeExModal() {
    if (exModal) { exModal.style.transform = ''; exModal.style.transition = ''; }
    exOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  exOverlay.addEventListener('click', e => { if (e.target === exOverlay) closeExModal(); });
  document.getElementById('exModalClose').addEventListener('click', closeExModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && exOverlay.classList.contains('open')) closeExModal(); });
  setupSwipeDismiss(exModal, closeExModal);

  /* ══════════════════════════════════════════════════════════════
     LOGBOOK TAB
     Shows every unique exercise with its personal record (PR):
     highest weight × reps logged across all sessions.
     Aggregates across all logbook entries in STATE.data.workout.logbook.
     Data shape: logbook[].exercises[].sets[].{ reps, weight }
  ══════════════════════════════════════════════════════════════ */
  function renderLogbook(panel) {
    const logbook = ws.logbook || [];

    /* Build a map: exerciseName → { bestWeight, bestReps, totalSets, sessions } */
    const exMap = new Map();
    logbook.forEach(entry => {
      (entry.exercises || []).forEach(ex => {
        if (!exMap.has(ex.name)) {
          exMap.set(ex.name, { bestWeight: 0, bestReps: 0, totalSets: 0, sessions: 0 });
        }
        const rec = exMap.get(ex.name);
        rec.sessions++;
        (ex.sets || []).forEach(s => {
          rec.totalSets++;
          /* PR = highest weight; if tie, pick more reps */
          if (s.weight > rec.bestWeight || (s.weight === rec.bestWeight && s.reps > rec.bestReps)) {
            rec.bestWeight = s.weight || 0;
            rec.bestReps   = s.reps   || 0;
          }
        });
      });
    });

    panel.innerHTML = `
      <div class="section-label">Exercise Logbook</div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:14px">
        Personal records across all sessions — best set (highest weight) per exercise.
      </div>
      ${exMap.size === 0 ? `
        <div class="card">
          <div class="card-body" style="text-align:center;padding:40px;color:var(--muted);font-size:13px">
            No logbook entries yet. Log a session on the Today tab to record your lifts.
          </div>
        </div>` : `
        <div class="card">
          <div class="card-body" style="padding:0 16px">
            ${[...exMap.entries()].map(([name, rec]) => `
              <div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
                <div style="flex:1;min-width:0">
                  <div style="font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:700;margin-bottom:2px">${name}</div>
                  <div style="font-size:11px;color:var(--muted)">${rec.sessions} session${rec.sessions !== 1 ? 's' : ''} · ${rec.totalSets} total sets</div>
                </div>
                <div style="text-align:right;flex-shrink:0">
                  <div style="font-family:'Rajdhani',sans-serif;font-size:20px;font-weight:700;color:var(--accent);line-height:1">
                    ${rec.bestWeight ? rec.bestWeight + '<span style="font-size:12px;color:var(--muted)">lbs</span>' : '—'}
                  </div>
                  <div style="font-size:11px;color:var(--muted);margin-top:1px">
                    ${rec.bestReps ? rec.bestReps + ' reps' : 'no weight logged'}
                  </div>
                </div>
                <span class="logbook-set-chip" style="flex-shrink:0">PR</span>
              </div>`).join('')}
          </div>
        </div>`}`;
  }

  /* ══════════════════════════════════════════════════════════════
     HISTORY TAB — summary log from STATE.data.workout.log
  ══════════════════════════════════════════════════════════════ */
  function renderHistory(panel) {
    const log = ws.log || [];
    panel.innerHTML = `
      <div class="section-label">Session History</div>
      ${log.length === 0 ? `
        <div class="card">
          <div class="card-body" style="text-align:center;padding:40px;color:var(--muted);font-size:13px">
            No sessions logged yet. Log your first workout on the Today tab.
          </div>
        </div>` :
        log.map(entry => `
          <div class="card" style="margin-bottom:10px">
            <div class="card-body" style="padding:14px 16px">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">
                <div>
                  <span style="font-family:'Rajdhani',sans-serif;font-size:16px;font-weight:700">${entry.dayName}</span>
                  <span class="badge badge-muted" style="margin-left:8px">${entry.phase}</span>
                </div>
                <span style="font-size:11px;color:var(--muted)">${new Date(entry.date).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</span>
              </div>
              ${entry.notes ? `<div style="font-size:12px;color:rgba(226,234,242,0.65);line-height:1.5;margin-top:4px">${entry.notes}</div>` : ''}
            </div>
          </div>`).join('')}`;
  }

  /* ══════════════════════════════════════════════════════════════
     PROGRESS PICS TAB
     Images stored as base64 data URLs in STATE.data.workout.progressPics[].
     FileReader API converts uploads; addProgressPic() saves to IDB.
  ══════════════════════════════════════════════════════════════ */
  function renderProgressPics(panel) {
    const pics = ws.progressPics || [];
    panel.innerHTML = `
      <div class="section-label">Progress Pictures</div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:14px">Stored locally in IndexedDB. Included in JSON export/import.</div>

      <div class="card" style="margin-bottom:16px">
        <div class="card-body" style="padding:14px 16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <button class="day-tab active" id="uploadPicBtn" style="padding:8px 18px">+ Add Photo</button>
          <input type="text" class="form-input" id="picNoteInput" placeholder="Note (e.g. Week 3 front)" style="flex:1;min-width:160px" />
          <input type="file" id="picFileInput" accept="image/*" style="display:none" />
        </div>
      </div>

      ${pics.length === 0 ? `
        <div class="card">
          <div class="card-body" style="text-align:center;padding:40px;color:var(--muted);font-size:13px">
            No progress pictures yet. Add your first photo above.
          </div>
        </div>` : `
        <div class="progress-pics-strip" id="picsStrip"></div>`}`;

    panel.querySelector('#uploadPicBtn').addEventListener('click', () => {
      panel.querySelector('#picFileInput').click();
    });

    panel.querySelector('#picFileInput').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const note   = panel.querySelector('#picNoteInput').value.trim();
      const reader = new FileReader();
      reader.onload = ev => {
        STATE.addProgressPic(ev.target.result, note);
        renderProgressPics(panel);
      };
      reader.readAsDataURL(file);
    });

    if (pics.length > 0) {
      const strip = panel.querySelector('#picsStrip');
      pics.forEach((pic, idx) => {
        const card = document.createElement('div');
        card.className = 'progress-pic-card';
        card.innerHTML = `
          <img src="${pic.dataUrl}" alt="Progress ${idx + 1}" class="progress-pic-img" />
          <div class="progress-pic-meta">
            <div class="progress-pic-date">${new Date(pic.date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>
            ${pic.note ? `<div class="progress-pic-note">${pic.note}</div>` : ''}
            <button class="progress-pic-del" data-idx="${idx}">Remove</button>
          </div>`;
        card.querySelector('.progress-pic-del').addEventListener('click', () => {
          if (!confirm('Remove this progress picture?')) return;
          STATE.removeProgressPic(idx);
          renderProgressPics(panel);
        });
        strip.appendChild(card);
      });
    }
  }

  /* ══════════════════════════════════════════════════════════════
     PRINCIPLES TAB — static reference from APP_DATA
  ══════════════════════════════════════════════════════════════ */
  function renderPrinciples(panel) {
    panel.innerHTML = `
      <div class="section-label">Training Principles</div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:14px">Internalize these. They separate people who get results from those who go through the motions.</div>
      <div class="grid-2" id="workoutPrinciples"></div>`;
    const prEl = panel.querySelector('#workoutPrinciples');
    (APP_DATA.healthPrinciples?.workout || []).forEach(p => {
      prEl.innerHTML += `
        <div style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
          <div style="font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700;color:var(--accent);margin-bottom:4px">${p.title}</div>
          <div style="font-size:12px;color:rgba(226,234,242,0.72);line-height:1.6">${p.body}</div>
        </div>`;
    });
  }

  /* ── Initial render ── */
  renderTab();
});
