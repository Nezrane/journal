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
  const RECOVERY       = APP_DATA.workout.recovery;
  const RAMPING        = APP_DATA.workout.ramping;
  const REST_DAY       = APP_DATA.workout.restDay;
  const PROGRAM_LOGIC  = APP_DATA.workout.programLogic;

  /* ── Live state ── */
  const ws = STATE.data.workout;

  /* ── Program logic helpers ── */
  const COMPOUND_KEYWORDS = ['squat', 'bench', 'row', 'pulldown', 'pull-up', 'lunge'];

  function getWeekRule(phaseName, weekNum) {
    const phaseLogic = PROGRAM_LOGIC.phases.find(p => p.name.toLowerCase() === phaseName);
    if (!phaseLogic) return null;
    return phaseLogic.weekRules.find(r => r.weeks.includes(weekNum)) || phaseLogic.weekRules[0];
  }

  function isCompound(exName) {
    const lower = exName.toLowerCase();
    return COMPOUND_KEYWORDS.some(k => lower.includes(k));
  }

  function getSets(ex, phaseName, weekNum) {
    if (phaseName === 'ramping' && weekNum >= 7) {
      return isCompound(ex.name) ? 3 : 2;
    }
    const rule = getWeekRule(phaseName, weekNum);
    return rule ? rule.sets : 1;
  }

  function getRPEForWeek(ex, phaseName, weekNum) {
    if (phaseName === 'recovery') {
      const key = weekNum <= 2 ? 'wk12' : 'wk35';
      return { earlyRPE: ex.earlyRPE?.[key] || '~7', lastRPE: ex.lastRPE?.[key] || '~8' };
    } else {
      const key = weekNum <= 6 ? 'wk6' : 'wk712';
      return { earlyRPE: ex.earlyRPE?.[key] || '~7', lastRPE: ex.lastRPE?.[key] || '~8' };
    }
  }

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
      'Recovery (Wks 1–5) → Ramping (Wks 6–12). Tap any exercise for notes & swaps.'
    )}

    <div class="day-tabs" id="mainWorkoutTabs" style="margin-bottom:8px;flex-wrap:wrap">
      <button class="day-tab active" data-wtab="today">Today</button>
      <button class="day-tab"        data-wtab="movement">Movement</button>
      <button class="day-tab"        data-wtab="logbook">Logbook</button>
      <button class="day-tab"        data-wtab="pics">Progress Pics</button>
      <button class="day-tab"        data-wtab="principles">Principles</button>
    </div>

    <div id="workoutTabPanel"></div>`;

  /* ── Phase toggle ── */
  function setPhase(name) {
    currentPhaseName = name;
    currentPhaseData = name === 'ramping' ? RAMPING : RECOVERY;
    STATE.setWorkoutPhase(name);
    if (activeTab === 'today') renderToday();
  }

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
      case 'movement':   renderMovement(panel);        break;
      case 'logbook':    renderLogbook(panel);         break;
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
          <!-- Phase toggle — lives inside the schedule card -->
          <div class="phase-toggle" style="margin-top:12px">
            <button class="phase-btn${currentPhaseName === 'recovery' ? ' active' : ''}" id="phaseRecoveryBtn">Recovery</button>
            <button class="phase-btn${currentPhaseName === 'ramping'  ? ' active' : ''}" id="phaseRampingBtn">Ramping</button>
          </div>
          <!-- Day tabs — full 7-step schedule so both Rest days are shown -->
          <div class="day-tabs" style="margin-top:10px" id="dayTabs"></div>
        </div>
      </div>

      <!-- Exercise card -->
      <div id="workoutContent"></div>

      <!-- Session complete -->
      ${currentDay !== 'Rest' ? `
        <div class="card" style="margin-top:16px">
          <div class="card-body" style="padding:16px;text-align:center">
            <div style="font-size:12px;color:var(--muted);margin-bottom:12px">
              Log sets via each exercise above, then mark the session done to advance the schedule.
            </div>
            <textarea class="venture-notes-input" id="workoutNotes" placeholder="Session notes — how it felt, what to adjust…" style="height:56px;margin-bottom:12px"></textarea>
            <button class="phase-btn active" id="logWorkoutBtn" style="padding:10px 24px;font-size:14px">✓ Complete ${currentDay} Session →</button>
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
      renderToday();
    });

    /* Phase toggle buttons (live inside the re-rendered card) */
    panel.querySelector('#phaseRecoveryBtn')?.addEventListener('click', () => setPhase('recovery'));
    panel.querySelector('#phaseRampingBtn')?.addEventListener('click',  () => setPhase('ramping'));

    renderDayTabs();
    renderDayContent();

    /* Rest day log button */
    inner.querySelector('#logRestBtn')?.addEventListener('click', () => {
      STATE.logWorkout(currentDay, currentPhaseName, [], '');
      renderToday();
    });

    /* Log session button — advances schedule; per-exercise sets are logged via the modal */
    inner.querySelector('#logWorkoutBtn')?.addEventListener('click', () => {
      const notes = (inner.querySelector('#workoutNotes')?.value || '').trim();
      STATE.logWorkout(currentDay, currentPhaseName, [], notes);
      renderToday();
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
    const weekNum = ws.weekNumber || 1;
    dayData.exercises.forEach((ex, i) => {
      const row = document.createElement('div');
      row.className = 'exercise-row';
      if (currentDay === 'Rest') {
        /* restDay keeps original field names */
        row.innerHTML = `
          <div class="ex-num">${i + 1}</div>
          <div class="ex-info">
            <div class="ex-name">${ex.name}</div>
            <div class="ex-meta">
              <span class="ex-chip">${ex.muscle}</span>
              <span class="ex-chip reps">${ex.reps}</span>
              ${ex.rpe ? `<span class="ex-chip rpe">RPE ${ex.rpe}</span>` : ''}
              <span class="ex-chip">Rest: ${ex.rest}</span>
            </div>
            ${ex.notes ? `<div class="ex-notes">${ex.notes}</div>` : ''}
          </div>`;
      } else {
        const { earlyRPE, lastRPE } = getRPEForWeek(ex, currentPhaseName, weekNum);
        const sets = getSets(ex, currentPhaseName, weekNum);
        const rule = getWeekRule(currentPhaseName, weekNum);
        row.innerHTML = `
          <div class="ex-num">${i + 1}</div>
          <div class="ex-info">
            <div class="ex-name">${ex.name}</div>
            <div class="ex-meta">
              <span class="ex-chip reps">${sets} × ${ex.reps}</span>
              <span class="ex-chip rpe">Last RPE ${lastRPE}</span>
              <span class="ex-chip">Rest: ${ex.rest}</span>
              ${ex.warmupSets ? `<span class="ex-chip">${ex.warmupSets} warmup</span>` : ''}
              ${ex.toFailure && rule?.toFailure ? `<span class="ex-chip" style="color:var(--accent3)">→ Failure</span>` : ''}
            </div>
            ${ex.note ? `<div class="ex-notes">${ex.note}</div>` : ''}
          </div>`;
      }
      row.addEventListener('click', () => openExModal(ex, i + 1));
      list.appendChild(row);
    });
  }

  /* ── Exercise modal ── */
  const exOverlay = document.getElementById('exModalOverlay');
  const exModal   = document.querySelector('#page-workout .ex-modal');

  function openExModal(ex, num) {
    const weekNum = ws.weekNumber || 1;
    const isRestDay = currentDay === 'Rest';

    if (isRestDay) {
      document.getElementById('exModalEyebrow').textContent = ex.muscle + ' · Active Recovery';
      document.getElementById('exModalTitle').textContent   = ex.name;
      document.getElementById('exModalChips').innerHTML = `
        <span class="badge badge-accent">${ex.reps}</span>
        ${ex.rpe ? `<span class="badge badge-warn">RPE ${ex.rpe}</span>` : ''}
        <span class="badge badge-muted">Rest ${ex.rest}</span>`;
      document.getElementById('exModalBody').innerHTML = `
        <div class="modal-section">
          <div class="modal-section-label" style="color:var(--accent)">Notes
            <span style="flex:1;height:1px;background:var(--border);display:block;margin-left:10px"></span>
          </div>
          <div class="description-text" style="line-height:1.7">${ex.notes || ''}</div>
        </div>
        <div class="modal-section" style="margin-top:20px">
          <div class="modal-section-label" style="color:var(--accent)">Alternatives
            <span style="flex:1;height:1px;background:var(--border);display:block;margin-left:10px"></span>
          </div>
          <div class="swap-list">
            ${(ex.swaps || []).map((s, si) => `<div class="swap-item"><strong>Option ${si+1}:</strong> ${s}</div>`).join('')}
          </div>
        </div>`;
    } else {
      const { earlyRPE, lastRPE } = getRPEForWeek(ex, currentPhaseName, weekNum);
      const sets     = getSets(ex, currentPhaseName, weekNum);
      const rule     = getWeekRule(currentPhaseName, weekNum);
      const VIDEO_ID = 'ZaTM37cfiDs'; /* placeholder — swap per-exercise when ready */

      const options = [
        { name: ex.name, note: ex.note },
        ex.sub1 ? { name: ex.sub1, note: null } : null,
        ex.sub2 ? { name: ex.sub2, note: null } : null,
      ].filter(Boolean);
      const OPT_LABELS = ['Primary', 'Substitute 1', 'Substitute 2'];
      let activeIdx = 0;

      /* Chips are static across all options */
      document.getElementById('exModalChips').innerHTML = `
        <span class="badge badge-accent">${sets} × ${ex.reps}</span>
        <span class="badge badge-warn">Last RPE ${lastRPE}</span>
        <span class="badge badge-muted">Rest ${ex.rest}</span>
        ${ex.warmupSets ? `<span class="badge badge-muted">${ex.warmupSets} warmup sets</span>` : ''}`;

      /* Build modal body — only text nodes update on nav, iframe stays loaded */
      document.getElementById('exModalBody').innerHTML = `
        <!-- ── Option navigator ── -->
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
          <button id="exPrevBtn" style="width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.1);color:var(--fg);font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;opacity:0.3;line-height:1">‹</button>
          <div style="flex:1;text-align:center">
            <div id="exOptLabel" style="font-size:10px;color:var(--accent);font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:5px">Primary</div>
            <div id="exOptDots" style="display:flex;justify-content:center;gap:5px">
              ${options.map((_, i) => `<span style="width:7px;height:7px;border-radius:50%;background:${i === 0 ? 'var(--accent)' : 'rgba(255,255,255,0.2)'};display:inline-block;transition:background 0.2s"></span>`).join('')}
            </div>
          </div>
          <button id="exNextBtn" style="width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.1);color:var(--fg);font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;${options.length <= 1 ? 'opacity:0.3;' : ''}line-height:1">›</button>
        </div>

        <!-- ── Exercise name (updates with nav) ── -->
        <div id="exOptName" style="font-family:'Rajdhani',sans-serif;font-size:20px;font-weight:800;color:var(--fg);line-height:1.25;margin-bottom:14px">${ex.name}</div>

        <!-- ── Video (static — iframe stays loaded across nav) ── -->
        <div style="position:relative;width:100%;height:44vh;background:#000;border-radius:12px;overflow:hidden;margin-bottom:14px">
          <iframe
            src="https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&mute=1&rel=0&controls=1&modestbranding=1&loop=1&playlist=${VIDEO_ID}"
            style="position:absolute;inset:0;width:100%;height:100%;border:none"
            allow="autoplay; encrypted-media; fullscreen"
            allowfullscreen
          ></iframe>
        </div>

        <!-- ── Notes (updates with nav) ── -->
        <div id="exOptNote" style="font-size:12px;color:rgba(226,234,242,0.72);line-height:1.7;margin-bottom:14px">${ex.note || 'Focus on quality reps. Control the negative on every set.'}</div>

        ${rule ? `<!-- ── Week prescription (static) ── -->
        <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:11px 14px;margin-bottom:20px">
          <div style="font-size:10px;color:var(--accent);font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:5px">Week ${weekNum} Prescription</div>
          <div style="font-size:12px;color:rgba(226,234,242,0.75);line-height:1.6">
            <strong>${sets} working set${sets !== 1 ? 's' : ''}</strong> · Early sets: ${earlyRPE} · Last set: ${lastRPE}
            ${ex.toFailure && rule.toFailure ? ' · <span style="color:var(--accent3)">Last set to failure</span>' : ''}
          </div>
          <div style="font-size:11px;color:var(--muted);margin-top:3px;font-style:italic">${rule.note}</div>
        </div>` : ''}

        <!-- ── Log form ── -->
        <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:16px">
          <div style="font-size:10px;color:var(--muted);font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px">
            Log: <span id="exLogExName" style="color:var(--accent)">${ex.name}</span>
          </div>
          <div id="exModalSetList"></div>
          <button id="exAddSetBtn" style="font-size:12px;color:var(--accent);background:none;border:1px dashed rgba(255,255,255,0.15);border-radius:8px;padding:7px 14px;cursor:pointer;width:100%;margin-top:6px">+ Add Set</button>
          <button id="exLogSetsBtn" style="margin-top:10px;width:100%;padding:11px;background:var(--accent);color:#000;border:none;border-radius:10px;font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:700;cursor:pointer;letter-spacing:0.5px">✓ Log Sets</button>
        </div>`;

      /* ── Add a set row ── */
      function addSetRow(setNum) {
        const setList = document.getElementById('exModalSetList');
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:8px';
        row.innerHTML = `
          <span style="font-size:11px;color:var(--muted);width:40px;flex-shrink:0">Set ${setNum}</span>
          <input class="form-input ex-modal-reps" type="number" placeholder="Reps" min="1" style="flex:1;padding:8px 10px;font-size:13px" />
          <span style="font-size:11px;color:var(--muted)">×</span>
          <input class="form-input ex-modal-weight" type="number" placeholder="lbs" min="0" style="flex:1;padding:8px 10px;font-size:13px" />
          ${setNum > 1 ? `<button class="ex-rm-set" style="background:none;border:none;color:var(--muted);font-size:16px;cursor:pointer;flex-shrink:0;width:24px;line-height:1">×</button>` : '<span style="width:24px;flex-shrink:0"></span>'}`;
        if (setNum > 1) {
          row.querySelector('.ex-rm-set').addEventListener('click', () => {
            row.remove();
            document.getElementById('exModalSetList')?.querySelectorAll('div').forEach((r, i) => {
              const lbl = r.querySelector('span');
              if (lbl) lbl.textContent = `Set ${i + 1}`;
            });
          });
        }
        setList.appendChild(row);
      }
      addSetRow(1);

      /* ── Update text when navigating options (iframe stays untouched) ── */
      function updateOption(idx) {
        const opt   = options[idx];
        const label = OPT_LABELS[idx] || `Option ${idx + 1}`;
        activeIdx = idx;
        document.getElementById('exOptLabel').textContent   = label;
        document.getElementById('exOptName').textContent    = opt.name;
        document.getElementById('exOptNote').textContent    = opt.note || (idx === 0
          ? 'Focus on quality reps. Control the negative on every set.'
          : 'Use the same rep scheme and RPE targets as the primary exercise.');
        document.getElementById('exLogExName').textContent  = opt.name;
        document.getElementById('exModalTitle').textContent = opt.name;
        document.getElementById('exModalEyebrow').textContent = label + ' · ' + (currentPhaseName === 'recovery' ? 'Recovery' : 'Ramping') + ' · Wk ' + weekNum;
        document.getElementById('exOptDots').querySelectorAll('span').forEach((dot, i) => {
          dot.style.background = i === idx ? 'var(--accent)' : 'rgba(255,255,255,0.2)';
        });
        document.getElementById('exPrevBtn').style.opacity = idx === 0 ? '0.3' : '1';
        document.getElementById('exNextBtn').style.opacity = idx === options.length - 1 ? '0.3' : '1';
      }

      /* Set initial header state */
      document.getElementById('exModalEyebrow').textContent = 'Primary · ' + (currentPhaseName === 'recovery' ? 'Recovery' : 'Ramping') + ' · Wk ' + weekNum;
      document.getElementById('exModalTitle').textContent   = ex.name;

      /* Arrow nav */
      document.getElementById('exPrevBtn').addEventListener('click', () => { if (activeIdx > 0) updateOption(activeIdx - 1); });
      document.getElementById('exNextBtn').addEventListener('click', () => { if (activeIdx < options.length - 1) updateOption(activeIdx + 1); });

      /* + Add Set */
      document.getElementById('exAddSetBtn').addEventListener('click', () => {
        addSetRow(document.getElementById('exModalSetList').children.length + 1);
      });

      /* ✓ Log Sets */
      document.getElementById('exLogSetsBtn').addEventListener('click', () => {
        const opt = options[activeIdx];
        const loggedSets = [];
        document.getElementById('exModalSetList').querySelectorAll('div').forEach(row => {
          const reps   = parseInt(row.querySelector('.ex-modal-reps')?.value)    || 0;
          const weight = parseFloat(row.querySelector('.ex-modal-weight')?.value) || 0;
          if (reps || weight) loggedSets.push({ reps, weight, duration: null, notes: '' });
        });
        if (!loggedSets.length) return;
        STATE.addLogbookEntry({ dayName: currentDay, phase: currentPhaseName, exercises: [{ name: opt.name, sets: loggedSets }] });
        const btn = document.getElementById('exLogSetsBtn');
        btn.textContent = '✓ Logged!';
        btn.style.background = 'var(--accent3)';
        setTimeout(() => { btn.textContent = '✓ Log Sets'; btn.style.background = 'var(--accent)'; }, 1800);
      });
    }
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
     MOVEMENT TAB — morning calisthenics skill practice
  ══════════════════════════════════════════════════════════════ */
  function renderMovement(panel) {
    const SKILLS = [
      {
        name: 'Pull-Ups',
        goal: 'Max reps / weighted',
        cue: 'Dead hang start. Scapular retraction before pulling. Chin clears bar.',
        sets: '3–5 sets',
        rest: '2–3 min',
        progression: 'Add reps → add band resistance → add weight vest',
      },
      {
        name: 'Pike Push-Ups',
        goal: 'Shoulder strength & handstand press prep',
        cue: 'Hips high, head through on descent. Elbows track forward.',
        sets: '3–4 sets × 8–15 reps',
        rest: '90 sec',
        progression: 'Elevate feet → decline → wall handstand push-up negative',
      },
      {
        name: 'Handstand Practice',
        goal: 'Balance & overhead compression',
        cue: 'Finger-pad pressure controls balance. Hollow body, slight shoulder shrug.',
        sets: '10–15 min skill block',
        rest: 'As needed between attempts',
        progression: 'Wall kick-up → wall freestanding → freestanding hold → walk',
      },
      {
        name: 'Push-Ups',
        goal: 'Chest & tricep volume',
        cue: 'Elbows ~45°. Full ROM — chest to floor, lock out top.',
        sets: '3–4 sets',
        rest: '60–90 sec',
        progression: 'Standard → archer → weighted vest → ring push-up',
      },
      {
        name: 'L-Sit',
        goal: 'Hip flexor & core compression',
        cue: 'Straight legs, toes pointed. Depress shoulders hard. Push floor away.',
        sets: '5 × max hold',
        rest: '60 sec',
        progression: 'Tuck → one leg extended → full L-sit → V-sit',
      },
      {
        name: 'Planche Lean',
        goal: 'Straight arm strength & planche prep',
        cue: 'Lean forward until weight shifts to wrists. Posterior pelvic tilt. Full depression.',
        sets: '4–5 × 10–20 sec',
        rest: '90 sec',
        progression: 'Lean → tuck planche → advanced tuck → straddle → full planche',
      },
    ];

    panel.innerHTML = `
      <div class="section-label">Morning Movement</div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:14px">
        Calisthenics skill work — do this before your PPL session or as a standalone morning block.
      </div>
      ${SKILLS.map(s => `
        <div class="card" style="margin-bottom:12px">
          <div class="card-header" style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px">
            <div>
              <div class="card-title">${s.name}</div>
              <div style="font-size:11px;color:var(--accent);margin-top:2px">${s.goal}</div>
            </div>
            <div style="text-align:right;flex-shrink:0">
              <span class="badge badge-accent">${s.sets}</span>
              <span class="badge badge-muted" style="margin-left:5px">Rest ${s.rest}</span>
            </div>
          </div>
          <div class="card-body" style="padding:10px 16px 14px;display:flex;flex-direction:column;gap:10px">
            <div>
              <div style="font-size:10px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--accent);margin-bottom:4px">Cue</div>
              <div style="font-size:12px;color:rgba(226,234,242,0.8);line-height:1.6">${s.cue}</div>
            </div>
            <div>
              <div style="font-size:10px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-bottom:4px">Progression</div>
              <div style="font-size:11.5px;color:var(--muted);line-height:1.5">${s.progression}</div>
            </div>
          </div>
        </div>`).join('')}`;
  }

  /* ══════════════════════════════════════════════════════════════
     LOGBOOK TAB
     Top: current stats table — most recent weight × reps per exercise.
     Bottom: session history from ws.log (date, day, notes).
     Data shape: logbook[].{ date, exercises[].{ name, sets[].{ reps, weight } } }
  ══════════════════════════════════════════════════════════════ */
  function renderLogbook(panel) {
    const logbook = (ws.logbook || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    const log     = (ws.log     || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date));

    /* Most-recent weight × reps per exercise — first occurrence in date-desc order wins */
    const latest = new Map(); /* name → { weight, reps, date, totalSets } */
    logbook.forEach(entry => {
      (entry.exercises || []).forEach(ex => {
        const sets = (ex.sets || []).filter(s => s.reps || s.weight);
        if (!sets.length) return;
        if (!latest.has(ex.name)) {
          const last = sets[sets.length - 1];
          latest.set(ex.name, { weight: last.weight || 0, reps: last.reps || 0, date: entry.date, totalSets: 0 });
        }
        latest.get(ex.name).totalSets += sets.length;
      });
    });

    const fmtDate = d => new Date(d).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });

    panel.innerHTML = `
      <div class="section-label">Current Stats</div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:12px">
        Most recent logged weight &amp; reps per exercise — updates as you log sets via the exercise modals.
      </div>

      ${latest.size === 0 ? `
        <div class="card" style="margin-bottom:20px">
          <div class="card-body" style="text-align:center;padding:40px;color:var(--muted);font-size:13px">
            No sets logged yet. Tap any exercise on the Today tab to log sets.
          </div>
        </div>` : `
        <div class="card" style="margin-bottom:20px">
          <!-- Table header -->
          <div style="display:grid;grid-template-columns:1fr 80px 70px 60px;gap:8px;padding:8px 16px 6px;border-bottom:1px solid rgba(255,255,255,0.07)">
            <div style="font-size:10px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--muted)">Exercise</div>
            <div style="font-size:10px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--muted);text-align:right">Weight</div>
            <div style="font-size:10px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--muted);text-align:right">Reps</div>
            <div style="font-size:10px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--muted);text-align:right">Sets</div>
          </div>
          ${[...latest.entries()].map(([name, rec]) => `
            <div style="display:grid;grid-template-columns:1fr 80px 70px 60px;gap:8px;align-items:center;padding:10px 16px;border-bottom:1px solid rgba(255,255,255,0.04)">
              <div>
                <div style="font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700;line-height:1.2">${name}</div>
                <div style="font-size:10px;color:var(--muted);margin-top:2px">${fmtDate(rec.date)}</div>
              </div>
              <div style="text-align:right;font-family:'Rajdhani',sans-serif;font-size:18px;font-weight:700;color:var(--accent);line-height:1">
                ${rec.weight || '—'}<span style="font-size:11px;color:var(--muted)">${rec.weight ? 'lbs' : ''}</span>
              </div>
              <div style="text-align:right;font-family:'Rajdhani',sans-serif;font-size:18px;font-weight:700;color:var(--fg);line-height:1">
                ${rec.reps || '—'}
              </div>
              <div style="text-align:right;font-size:12px;color:var(--muted)">${rec.totalSets}</div>
            </div>`).join('')}
        </div>`}

      <div class="section-label" style="margin-top:4px">Session History</div>
      ${log.length === 0 ? `
        <div class="card">
          <div class="card-body" style="text-align:center;padding:32px;color:var(--muted);font-size:13px">
            No sessions completed yet. Hit "Complete Session" on the Today tab after your workout.
          </div>
        </div>` :
        log.map(entry => `
          <div class="card" style="margin-bottom:8px">
            <div class="card-body" style="padding:12px 16px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:${entry.notes ? '6px' : '0'}">
                <div>
                  <span style="font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:700">${entry.dayName}</span>
                  <span class="badge badge-muted" style="margin-left:8px">${entry.phase}</span>
                </div>
                <span style="font-size:11px;color:var(--muted)">${fmtDate(entry.date)}</span>
              </div>
              ${entry.notes ? `<div style="font-size:12px;color:rgba(226,234,242,0.6);line-height:1.5">${entry.notes}</div>` : ''}
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
