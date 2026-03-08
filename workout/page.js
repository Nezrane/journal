/**
 * KOLTYN OS — workout/page.js
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
 *   Rest after Lower (posterior chain) + Rest after Legs.
 *
 * TABS: Today | Logbook | History | Morning | Stretching | Macro Calc | Principles
 */

window.registerPage('workout', function initWorkout() {

  /* ── Data ── */
  const RECOVERY = APP_DATA.workout.recovery;
  const RAMPING  = APP_DATA.workout.ramping;
  const REST_DAY = APP_DATA.workout.restDay;

  /* ── Live state ── */
  const ws = STATE.data.workout;

  const PHASE_LIMITS = { recovery: 5, ramping: 7 };
  const DAYS = ['Upper', 'Lower', 'Pull', 'Push', 'Legs'];

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

    <!-- Tab bar -->
    <div class="day-tabs" id="mainWorkoutTabs" style="margin-bottom:8px;flex-wrap:wrap">
      <button class="day-tab active" data-wtab="today">Today</button>
      <button class="day-tab"        data-wtab="logbook">Logbook</button>
      <button class="day-tab"        data-wtab="log">History</button>
      <button class="day-tab"        data-wtab="morning">Morning</button>
      <button class="day-tab"        data-wtab="stretch">Stretching</button>
      <button class="day-tab"        data-wtab="macro">Macro Calc</button>
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
      case 'morning':    renderMorning(panel);         break;
      case 'stretch':    renderStretching(panel);      break;
      case 'macro':      renderMacroCalc(panel);       break;
      case 'pics':       renderProgressPics(panel);    break;
      case 'principles': renderPrinciples(panel);      break;
    }
  }

  /* ══════════════════════════════════════════════════════════════
     TODAY TAB
     Displays the current scheduled day's exercise list.
     "Log Session" button opens an inline set-entry form, then
     advances the schedule via STATE.logWorkout() → IDB.
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
          <div class="day-tabs" style="margin-top:14px" id="dayTabs"></div>
        </div>
      </div>

      <!-- Exercise card -->
      <div id="workoutContent"></div>

      <!-- Log session form (hidden until "Log Session" clicked) -->
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
        </div>`}`;

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
      const notes = (inner.querySelector('#workoutNotes')?.value || '').trim();
      const exercises = collectLogFormData();
      /* STATE.logWorkout: advances schedule, tracks cycles, saves to IDB */
      STATE.logWorkout(currentDay, currentPhaseName, exercises.map(e => e.name), notes);
      /* STATE.addLogbookEntry: stores detailed sets/reps/weight to IDB */
      if (exercises.some(e => e.sets.length > 0)) {
        STATE.addLogbookEntry({ dayName: currentDay, phase: currentPhaseName, exercises });
      }
      renderToday();
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

  /* Collect the log form data into an array of exercise objects */
  function collectLogFormData() {
    const formEl = document.getElementById('logFormExercises');
    if (!formEl) return [];
    const dayData = currentPhaseData[currentDay] || { exercises: [] };
    const result  = [];
    formEl.querySelectorAll('.logbook-ex-row').forEach((row, ei) => {
      const sets = [];
      row.querySelectorAll('.logbook-set-row').forEach(sr => {
        const reps   = parseInt(sr.querySelector('.logbook-reps')?.value)   || 0;
        const weight = parseFloat(sr.querySelector('.logbook-weight')?.value) || 0;
        if (reps || weight) sets.push({ reps, weight, duration: null, notes: '' });
      });
      result.push({ name: dayData.exercises[ei]?.name || 'Exercise ' + (ei+1), sets });
    });
    return result;
  }

  function renderDayTabs() {
    const tabs = document.getElementById('dayTabs');
    if (!tabs) return;
    tabs.innerHTML = '';
    [...DAYS, 'Rest'].forEach(day => {
      const btn = document.createElement('button');
      btn.className = 'day-tab' + (day === currentDay ? ' active' : '');
      btn.textContent = day;
      btn.addEventListener('click', () => {
        currentDay = day;
        document.querySelectorAll('#dayTabs .day-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderDayContent();
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
     Shows detailed sets/reps/weight per session from STATE.data.workout.logbook.
     Logbook entries are separate from the summary log[] — they contain
     per-exercise set data recorded when logging a session.
  ══════════════════════════════════════════════════════════════ */
  function renderLogbook(panel) {
    const logbook = ws.logbook || [];
    panel.innerHTML = `
      <div class="section-label">Logbook</div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:14px">Detailed sets, reps, and weights from each session.</div>
      ${logbook.length === 0 ? `
        <div class="card">
          <div class="card-body" style="text-align:center;padding:40px;color:var(--muted);font-size:13px">
            No logbook entries yet. Log a session on the Today tab to record your lifts.
          </div>
        </div>` :
        logbook.map(entry => `
          <div class="card" style="margin-bottom:12px">
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
              <div>
                <span style="font-family:'Rajdhani',sans-serif;font-size:16px;font-weight:700">${entry.dayName}</span>
                <span class="badge badge-muted" style="margin-left:8px">${entry.phase}</span>
              </div>
              <span style="font-size:11px;color:var(--muted)">${new Date(entry.date).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</span>
            </div>
            <div class="card-body" style="padding:10px 16px">
              ${(entry.exercises || []).filter(e => e.sets?.length).map(ex => `
                <div style="margin-bottom:10px">
                  <div style="font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700;margin-bottom:4px">${ex.name}</div>
                  <div style="display:flex;gap:6px;flex-wrap:wrap">
                    ${ex.sets.map((s, i) => `
                      <span class="logbook-set-chip">
                        Set ${i+1}: ${s.reps || '?'} × ${s.weight ? s.weight + 'lbs' : '—'}
                      </span>`).join('')}
                  </div>
                </div>`).join('')}
            </div>
          </div>`).join('')}`;
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
     MORNING ROUTINE TAB — static reference from APP_DATA
  ══════════════════════════════════════════════════════════════ */
  function renderMorning(panel) {
    const routine = APP_DATA.morningRoutine || [];
    panel.innerHTML = `
      <div class="section-label">Morning Routine</div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:14px">Non-negotiable daily foundation. Complete before any work begins.</div>
      ${routine.map((step, i) => `
        <div class="card" style="margin-bottom:10px">
          <div class="card-body" style="display:flex;align-items:flex-start;gap:14px;padding:14px 16px">
            <div style="font-size:24px;line-height:1">${step.icon}</div>
            <div style="flex:1">
              <div style="font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:700;margin-bottom:3px">
                <span style="color:var(--accent);margin-right:6px">${i + 1}.</span>${step.step}
              </div>
              <div style="font-size:12px;color:rgba(226,234,242,0.72);line-height:1.55">${step.detail}</div>
            </div>
          </div>
        </div>`).join('')}`;
  }

  /* ══════════════════════════════════════════════════════════════
     STRETCHING TAB — static reference from APP_DATA
  ══════════════════════════════════════════════════════════════ */
  function renderStretching(panel) {
    const sr = APP_DATA.stretchingRoutine || {};
    function stretchCard(s) {
      return `
        <div class="card">
          <div class="card-body" style="padding:14px 16px">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
              <div style="font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:700">${s.name}</div>
              <span class="badge badge-muted">${s.duration}</span>
            </div>
            <div style="font-size:12px;color:rgba(226,234,242,0.72);line-height:1.55">${s.instruction}</div>
          </div>
        </div>`;
    }
    panel.innerHTML = `
      <div class="section-label">Morning Activation Stretches</div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:14px">Do these before morning activation drills. ~8 minutes.</div>
      <div class="grid-2" id="morningStretches"></div>
      <div class="section-label" style="margin-top:8px">Post-Workout Cooldown</div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:14px">10 minutes after every training session — non-negotiable.</div>
      <div class="grid-2" id="postStretches"></div>`;
    const morEl = panel.querySelector('#morningStretches');
    const posEl = panel.querySelector('#postStretches');
    (sr.morning     || []).forEach(s => { morEl.innerHTML += stretchCard(s); });
    (sr.postWorkout || []).forEach(s => { posEl.innerHTML += stretchCard(s); });
  }

  /* ══════════════════════════════════════════════════════════════
     MACRO CALCULATOR TAB
     Pure client-side calculation — no STATE writes.
     Formula:
       TDEE = weight(lbs) × activityFactor
       Bulk: +300 cal | Maintain: +0 | Cut: −500 cal
       Protein: 1.0 g/lb | Fat: 0.35 g/lb | Carbs: remainder
  ══════════════════════════════════════════════════════════════ */
  function renderMacroCalc(panel) {
    panel.innerHTML = `
      <div class="section-label">Macro Calculator</div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:14px">Manual inputs → auto-calculated targets. Use as a starting point.</div>
      <div class="card">
        <div class="card-body" style="padding:18px 20px">

          <!-- Body weight slider -->
          <div style="margin-bottom:18px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
              <label class="form-label">Body Weight</label>
              <span style="font-family:'Rajdhani',sans-serif;font-size:18px;font-weight:700;color:var(--accent)" id="calcWeightDisplay">175 lbs</span>
            </div>
            <input type="range" id="calcWeight" min="120" max="280" value="175" step="1" class="macro-slider" />
          </div>

          <!-- Goal toggle -->
          <div style="margin-bottom:18px">
            <div class="form-label" style="margin-bottom:8px">Goal</div>
            <div class="phase-toggle" id="calcGoalToggle">
              <button class="phase-btn" data-goal="cut">Cut</button>
              <button class="phase-btn active" data-goal="maintain">Maintain</button>
              <button class="phase-btn" data-goal="bulk">Bulk</button>
            </div>
          </div>

          <!-- Activity level -->
          <div style="margin-bottom:20px">
            <div class="form-label" style="margin-bottom:8px">Activity Level</div>
            <div class="phase-toggle" id="calcActivityToggle">
              <button class="phase-btn" data-activity="12">Sedentary</button>
              <button class="phase-btn active" data-activity="14">Light</button>
              <button class="phase-btn" data-activity="15.5">Moderate</button>
              <button class="phase-btn" data-activity="17">Active</button>
            </div>
          </div>

          <!-- Results -->
          <div class="macro-calc-results" id="calcResults"></div>
        </div>
      </div>`;

    let calcWeight   = 175;
    let calcGoal     = 'maintain';
    let calcActivity = 14;

    function calcMacros() {
      const tdee = calcWeight * calcActivity;
      const goalAdj = calcGoal === 'bulk' ? 300 : calcGoal === 'cut' ? -500 : 0;
      const calories = Math.round(tdee + goalAdj);
      const protein  = Math.round(calcWeight * 1.0);
      const fat      = Math.round(calcWeight * 0.35);
      const carbs    = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));

      const pPct = Math.round((protein * 4  / calories) * 100);
      const fPct = Math.round((fat     * 9  / calories) * 100);
      const cPct = Math.round((carbs   * 4  / calories) * 100);

      document.getElementById('calcResults').innerHTML = `
        <div class="macro-calc-main">
          <div class="macro-calc-calories">
            <span class="macro-calc-cal-val">${calories.toLocaleString()}</span>
            <span class="macro-calc-cal-unit">kcal/day</span>
          </div>
        </div>
        <div class="macro-calc-breakdown">
          <div class="macro-calc-macro" style="--mc:${pPct}%;--col:#f5a623">
            <div class="macro-calc-bar"><div class="macro-calc-bar-fill"></div></div>
            <div class="macro-calc-val">${protein}g</div>
            <div class="macro-calc-lbl">Protein (${pPct}%)</div>
          </div>
          <div class="macro-calc-macro" style="--mc:${cPct}%;--col:#42c4f5">
            <div class="macro-calc-bar"><div class="macro-calc-bar-fill"></div></div>
            <div class="macro-calc-val">${carbs}g</div>
            <div class="macro-calc-lbl">Carbs (${cPct}%)</div>
          </div>
          <div class="macro-calc-macro" style="--mc:${fPct}%;--col:#c97bff">
            <div class="macro-calc-bar"><div class="macro-calc-bar-fill"></div></div>
            <div class="macro-calc-val">${fat}g</div>
            <div class="macro-calc-lbl">Fats (${fPct}%)</div>
          </div>
        </div>
        <div style="font-size:11px;color:var(--muted);margin-top:12px;line-height:1.5">
          TDEE ≈ ${Math.round(tdee).toLocaleString()} kcal · ${calcGoal === 'bulk' ? '+300 surplus' : calcGoal === 'cut' ? '−500 deficit' : 'maintenance'}
        </div>`;
    }

    /* Weight slider */
    panel.querySelector('#calcWeight').addEventListener('input', e => {
      calcWeight = parseInt(e.target.value);
      panel.querySelector('#calcWeightDisplay').textContent = calcWeight + ' lbs';
      calcMacros();
    });

    /* Goal toggle */
    panel.querySelectorAll('[data-goal]').forEach(btn => {
      btn.addEventListener('click', () => {
        panel.querySelectorAll('[data-goal]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        calcGoal = btn.dataset.goal;
        calcMacros();
      });
    });

    /* Activity toggle */
    panel.querySelectorAll('[data-activity]').forEach(btn => {
      btn.addEventListener('click', () => {
        panel.querySelectorAll('[data-activity]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        calcActivity = parseFloat(btn.dataset.activity);
        calcMacros();
      });
    });

    calcMacros();
  }

  /* ══════════════════════════════════════════════════════════════
     PROGRESS PICS TAB
     Images stored as base64 data URLs in STATE.data.workout.progressPics[].
     FileReader API converts uploaded images; addProgressPic() saves to IDB.
     Images render in a horizontally scrollable strip.
  ══════════════════════════════════════════════════════════════ */
  function renderProgressPics(panel) {
    const pics = ws.progressPics || [];
    panel.innerHTML = `
      <div class="section-label">Progress Pictures</div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:14px">Stored locally in IndexedDB. Included in JSON export/import.</div>

      <!-- Upload row -->
      <div class="card" style="margin-bottom:16px">
        <div class="card-body" style="padding:14px 16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <button class="day-tab active" id="uploadPicBtn" style="padding:8px 18px">+ Add Photo</button>
          <input type="text" class="form-input" id="picNoteInput" placeholder="Note (e.g. Week 3 front)" style="flex:1;min-width:160px" />
          <input type="file" id="picFileInput" accept="image/*" style="display:none" />
        </div>
      </div>

      <!-- Horizontal scroll strip -->
      ${pics.length === 0 ? `
        <div class="card">
          <div class="card-body" style="text-align:center;padding:40px;color:var(--muted);font-size:13px">
            No progress pictures yet. Add your first photo above.
          </div>
        </div>` : `
        <div class="progress-pics-strip" id="picsStrip"></div>`}`;

    /* Upload button */
    panel.querySelector('#uploadPicBtn').addEventListener('click', () => {
      panel.querySelector('#picFileInput').click();
    });

    panel.querySelector('#picFileInput').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const note = panel.querySelector('#picNoteInput').value.trim();
      const reader = new FileReader();
      reader.onload = ev => {
        /* STATE.addProgressPic stores base64 dataUrl + note to IDB */
        STATE.addProgressPic(ev.target.result, note);
        renderProgressPics(panel);
      };
      reader.readAsDataURL(file);
    });

    /* Render pic cards */
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
          /* STATE.removeProgressPic splices the array and saves to IDB */
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
