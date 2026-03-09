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


  /* 4 clickable stages derived from programLogic weekRules */
  const STAGES = [
    { phase: 'recovery', label: 'Technique',  sub: '1 set · RPE ~6',       weekLabel: 'Weeks 1–2',  weekStart: 1, weekCount: 2 },
    { phase: 'recovery', label: 'Volume',     sub: '2 sets · RPE ~7–8',     weekLabel: 'Weeks 3–5',  weekStart: 3, weekCount: 3 },
    { phase: 'ramping',  label: 'Intro',      sub: '1 set · new movements', weekLabel: 'Week 6',     weekStart: 6, weekCount: 1 },
    { phase: 'ramping',  label: 'Overload',   sub: '2–3 sets · to failure', weekLabel: 'Weeks 7–12', weekStart: 7, weekCount: 6 },
  ];

  /* Full 7-day schedule used for day tabs — shows both Rest days */
  const SCHEDULE = ['Upper', 'Lower', 'Rest', 'Pull', 'Push', 'Legs', 'Rest'];

  let currentPhaseName = ws.currentPhase || 'recovery';
  let currentPhaseData = currentPhaseName === 'ramping' ? RAMPING : RECOVERY;
  let currentDay       = ws.schedule[ws.currentDayIndex % ws.schedule.length];

  /* ── Build page shell ── */
  const inner = document.getElementById('workout-inner');
  inner.innerHTML = `
    ${buildPageHeader('JEFF NIPPARD UL+PPL', 'Workout', 'Program',
      'Recovery (Wks 1–5) → Ramping (Wks 6–12). Tap any exercise for notes & swaps.'
    )}
    <div id="workoutTabPanel"></div>`;

  /* ── Tab routing ── */
  let activeTab = 'today';
  const WORKOUT_TABS = [
    { id: 'today',   label: 'Routine'  },
    { id: 'logbook', label: 'Progress' },
  ];

  function buildTabs() {
    setPageTabs(inner, WORKOUT_TABS, activeTab, id => {
      activeTab = id;
      buildTabs();
      renderTab();
    });
  }

  function renderTab() {
    const panel = document.getElementById('workoutTabPanel');
    switch (activeTab) {
      case 'today':   renderToday();         break;
      case 'logbook': renderLogbook(panel);  break;
    }
  }

  buildTabs();
  renderTab();

  /* ══════════════════════════════════════════════════════════════
     TODAY TAB
     Displays the current scheduled day's exercises.
     Below the exercises: collapsible Morning Routine section,
     then collapsible Stretching section.
     "Log Session" form at the bottom advances the schedule → IDB.
  ══════════════════════════════════════════════════════════════ */
  function renderToday() {
    const panel   = document.getElementById('workoutTabPanel');
    currentDay    = ws.schedule[ws.currentDayIndex % ws.schedule.length];
    const weekNum = ws.weekNumber || 1;

    /* Determine active stage */
    const activeStageIdx = STAGES.findIndex(s =>
      s.phase === currentPhaseName && weekNum >= s.weekStart && weekNum < s.weekStart + s.weekCount
    );
    const activeStage = STAGES[activeStageIdx] ?? STAGES[0];

    /* Build each segment */
    function stageSegHTML(s, i) {
      const isRecovery = s.phase === 'recovery';
      const accent     = isRecovery ? 'var(--accent)' : 'var(--accent3)';
      const isPast     = i < activeStageIdx;
      const isCurrent  = i === activeStageIdx;
      const weekInStage   = isCurrent ? Math.max(0, weekNum - s.weekStart) : 0;
      const fillPct       = isPast ? 100 : isCurrent ? Math.round((weekInStage / s.weekCount) * 100) : 0;
      const radius = i === 0 ? '7px 0 0 7px' : i === STAGES.length - 1 ? '0 7px 7px 0' : '0';
      const border = isCurrent ? `2px solid ${accent}` : '2px solid transparent';
      return `
        <div data-stageidx="${i}" style="flex:${s.weekCount};position:relative;cursor:pointer;border-radius:${radius};overflow:hidden;background:rgba(255,255,255,0.04);border:${border};padding:8px 10px;min-width:0">
          <div style="position:absolute;inset:0;background:${accent};opacity:0.13;width:${fillPct}%;pointer-events:none"></div>
        </div>`;
    }

    panel.innerHTML = `
      <!-- Stage progress card -->
      <div class="card" style="margin-bottom:16px">
        <div class="card-header" style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
          <div>
            <div class="card-title">${activeStage.label} <span style="font-weight:400;color:var(--muted)">· ${activeStage.weekLabel}</span></div>
          </div>
          <span class="badge ${activeStage.phase === 'recovery' ? 'badge-accent' : 'badge-warn'}">${activeStage.phase === 'recovery' ? 'Recovery Phase' : 'Ramping Phase'}</span>
        </div>
        <div class="card-body" style="padding:10px 16px 14px">
          <!-- Segmented stage bar -->
          <div style="display:flex;gap:2px" id="stageBar">
            ${STAGES.map((s, i) => stageSegHTML(s, i)).join('')}
          </div>
          <!-- Phase group labels -->
          <div style="display:flex;margin-top:4px">
            <div style="flex:5;font-size:9px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--accent)">Recovery</div>
            <div style="flex:7;font-size:9px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--accent3);text-align:right">Ramping</div>
          </div>
          <!-- Day tabs -->
          <div class="day-tabs" style="margin-top:12px;flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none" id="dayTabs"></div>
        </div>
      </div>

      <!-- Exercise card -->
      <div id="workoutContent"></div>

      <div class="section-label" style="margin-top:18px">Training Principles</div>
      <div class="grid-2" id="principlesBody"></div>`;

    /* Stage bar — clicking any segment jumps to that stage */
    function jumpToStage(idx) {
      const s = STAGES[idx];
      ws.weekNumber    = s.weekStart;
      currentPhaseName = s.phase;
      currentPhaseData = s.phase === 'ramping' ? RAMPING : RECOVERY;
      STATE.setWorkoutPhase(s.phase);
      renderToday();
    }
    panel.querySelectorAll('#stageBar [data-stageidx]').forEach(el => {
      el.addEventListener('click', () => jumpToStage(Number(el.dataset.stageidx)));
    });

    renderDayTabs();
    renderDayContent();

    /* ── Principles (inline, no card) ── */
    panel.querySelector('#principlesBody').innerHTML =
      (APP_DATA.healthPrinciples?.workout || []).map(p => `
        <div style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
          <div style="font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700;color:var(--accent);margin-bottom:4px">${p.title}</div>
          <div style="font-size:12px;color:rgba(226,234,242,0.72);line-height:1.6">${p.body}</div>
        </div>`).join('');
  }

  /* Day tabs — uses the full 7-step schedule so BOTH Rest days appear.
     Tabs are labelled by position: "Rest" and "Rest" — clicking either
     shows the rest day info (same content). */
  function renderDayTabs() {
    const tabs = document.getElementById('dayTabs');
    if (!tabs) return;
    tabs.innerHTML = '';
    SCHEDULE.forEach(day => {
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

    const sr = APP_DATA.stretchingRoutine || {};

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

        ${currentDay !== 'Rest' ? `
        <!-- Warmup section -->
        <div style="border-bottom:1px solid rgba(255,255,255,0.07)">
          <div id="warmupToggle" style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;cursor:pointer">
            <div style="font-family:'Rajdhani',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--accent)">Warmup</div>
            <span style="font-size:16px;color:var(--muted);transition:transform 0.2s" id="warmupArrow">▾</span>
          </div>
          <div id="warmupBody" style="display:none;padding:0 16px 10px">
            ${(sr.morning || []).map(s => `
              <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
                <div style="flex:1">
                  <div style="font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700;margin-bottom:2px">${s.name}</div>
                  <div style="font-size:11.5px;color:rgba(226,234,242,0.65);line-height:1.5">${s.instruction}</div>
                </div>
                <span class="badge badge-muted" style="margin-left:10px;flex-shrink:0">${s.duration}</span>
              </div>`).join('')}
          </div>
        </div>` : ''}

        <!-- Routine section -->
        ${currentDay !== 'Rest' ? `
        <div style="border-bottom:1px solid rgba(255,255,255,0.07);padding:10px 16px 4px">
          <div style="font-family:'Rajdhani',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--accent);margin-bottom:6px">Routine</div>
        </div>` : ''}
        <div class="exercise-list" id="exerciseList"></div>

        ${currentDay !== 'Rest' ? `
        <!-- Stretches section -->
        <div style="border-top:1px solid rgba(255,255,255,0.07)">
          <div id="stretchesToggle" style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;cursor:pointer">
            <div style="font-family:'Rajdhani',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--accent)">Stretches</div>
            <span style="font-size:16px;color:var(--muted);transition:transform 0.2s" id="stretchesArrow">▾</span>
          </div>
          <div id="stretchesBody" style="display:none;padding:0 16px 10px">
            ${(sr.postWorkout || []).map(s => `
              <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
                <div style="flex:1">
                  <div style="font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700;margin-bottom:2px">${s.name}</div>
                  <div style="font-size:11.5px;color:rgba(226,234,242,0.65);line-height:1.5">${s.instruction}</div>
                </div>
                <span class="badge badge-muted" style="margin-left:10px;flex-shrink:0">${s.duration}</span>
              </div>`).join('')}
          </div>
        </div>` : ''}

        ${currentDay !== 'Rest' ? `
          <div style="border-top:1px solid rgba(255,255,255,0.07);padding:14px 16px 16px">
            <textarea class="venture-notes-input" id="workoutNotes" placeholder="Session notes — how it felt, what to adjust…" style="height:52px;margin-bottom:10px"></textarea>
            <button class="phase-btn active" id="logWorkoutBtn" style="width:100%;padding:11px;font-size:14px">✓ Complete ${currentDay} Session →</button>
          </div>` : `
          <div style="border-top:1px solid rgba(255,255,255,0.07);padding:16px;text-align:center">
            <div style="font-size:28px;margin-bottom:8px">😴</div>
            <div style="font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:700;margin-bottom:4px">Rest Day</div>
            <div style="font-size:12px;color:var(--muted);margin-bottom:14px">Active recovery only — walk, stretch, foam roll.</div>
            <button class="day-tab active" id="logRestBtn" style="padding:8px 20px">Mark Rest Day Complete →</button>
          </div>`}
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
        const { lastRPE } = getRPEForWeek(ex, currentPhaseName, weekNum);
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

    content.querySelector('#logWorkoutBtn')?.addEventListener('click', () => {
      const notes = (content.querySelector('#workoutNotes')?.value || '').trim();
      STATE.logWorkout(currentDay, currentPhaseName, [], notes);
      renderToday();
    });
    content.querySelector('#logRestBtn')?.addEventListener('click', () => {
      STATE.logWorkout(currentDay, currentPhaseName, [], '');
      renderToday();
    });

    /* Warmup toggle */
    content.querySelector('#warmupToggle')?.addEventListener('click', () => {
      const body  = content.querySelector('#warmupBody');
      const arrow = content.querySelector('#warmupArrow');
      const open  = body.style.display !== 'none';
      body.style.display = open ? 'none' : 'block';
      arrow.style.transform = open ? '' : 'rotate(180deg)';
    });

    /* Stretches toggle */
    content.querySelector('#stretchesToggle')?.addEventListener('click', () => {
      const body  = content.querySelector('#stretchesBody');
      const arrow = content.querySelector('#stretchesArrow');
      const open  = body.style.display !== 'none';
      body.style.display = open ? 'none' : 'block';
      arrow.style.transform = open ? '' : 'rotate(180deg)';
    });
  }

  /* ── Exercise modal ── */
  const exOverlay = document.getElementById('exModalOverlay');
  const exModal   = document.querySelector('#page-workout .ex-modal');

  function openExModal(ex) {
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
     LOGBOOK TAB
     Top: current stats table — most recent weight × reps per exercise.
     Bottom: session history from ws.log (date, day, notes).
     Data shape: logbook[].{ date, exercises[].{ name, sets[].{ reps, weight } } }
  ══════════════════════════════════════════════════════════════ */
  function renderLogbook(panel) {
    const logbook = (ws.logbook || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    const log     = (ws.log     || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date));

    /* Most-recent weight × reps per exercise */
    const latest = new Map();
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

    const fmtDate  = d => new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric' });
    const fmtFull  = d => new Date(d).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });
    const STATS    = APP_DATA.dashboard.stats;
    const bodyW    = STATS.find(s => s.label === 'Body Weight') || STATS[0];
    const bodyF    = STATS.find(s => s.label === 'Body Fat')    || STATS[1];

    const bodyPct = s => s.invert
      ? (s.current <= s.goal ? 100 : Math.round((s.goal / s.current) * 100))
      : (s.goal > 0 ? Math.min(100, Math.round((s.current / s.goal) * 100)) : 0);

    panel.innerHTML = `

      <!-- ══ Body Metrics + Progress Photos combined card ══ -->
      <div class="card" style="margin-bottom:16px;overflow:hidden">
        <div style="padding:14px 20px 10px;border-bottom:1px solid var(--border)">
          <div style="font-family:'Rajdhani',sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--muted)">Body Metrics</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0">

          <!-- Weight -->
          <div style="padding:16px 20px;border-right:1px solid var(--border)">
            <div style="font-family:'Rajdhani',sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:6px">Body Weight</div>
            <div style="font-family:'Rajdhani',sans-serif;font-size:40px;font-weight:700;color:${bodyW.color};line-height:1">${bodyW.value}<span style="font-size:14px;color:var(--muted);margin-left:3px">${bodyW.unit}</span></div>
            <div style="font-size:11px;color:var(--muted);margin-top:4px;margin-bottom:10px">Goal · 200 lbs</div>
            <div style="height:4px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden">
              <div style="height:100%;width:${bodyPct(bodyW)}%;background:${bodyW.color};border-radius:2px"></div>
            </div>
            <div style="font-size:10px;color:var(--muted);margin-top:4px">${bodyPct(bodyW)}% to goal</div>
          </div>

          <!-- Body Fat -->
          <div style="padding:16px 20px">
            <div style="font-family:'Rajdhani',sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:6px">Body Fat</div>
            <div style="font-family:'Rajdhani',sans-serif;font-size:40px;font-weight:700;color:${bodyF.color};line-height:1">${bodyF.value}<span style="font-size:14px;color:var(--muted);margin-left:3px">${bodyF.unit}</span></div>
            <div style="font-size:11px;color:var(--muted);margin-top:4px;margin-bottom:10px">Goal · 15%</div>
            <div style="height:4px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden">
              <div style="height:100%;width:${bodyPct(bodyF)}%;background:${bodyF.color};border-radius:2px"></div>
            </div>
            <div style="font-size:10px;color:var(--muted);margin-top:4px">${bodyPct(bodyF)}% to goal</div>
          </div>

        </div>

        <!-- Progress Photos (inside same card) -->
        <div id="progressPicsSection" style="border-top:1px solid var(--border)"></div>
      </div>

      <!-- ══ Lift Logbook ══ -->
      <div class="card" style="margin-bottom:16px;overflow:hidden">
        <div style="padding:12px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
          <div style="font-family:'Rajdhani',sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--muted)">Lift Logbook</div>
          <span style="font-size:11px;color:var(--muted)">${latest.size} exercises</span>
        </div>
        ${latest.size === 0 ? `
          <div style="padding:32px;text-align:center;color:var(--muted);font-size:13px">
            Log sets via the exercise modals on the Routine tab.
          </div>` : `
          <div style="display:grid;grid-template-columns:1fr 72px 56px;padding:8px 20px 6px;border-bottom:1px solid rgba(255,255,255,0.05)">
            <div style="font-size:9px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted)">Exercise</div>
            <div style="font-size:9px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);text-align:right">Weight</div>
            <div style="font-size:9px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);text-align:right">Reps</div>
          </div>
          <div id="liftTable" style="max-height:400px;overflow-y:auto">
            ${[...latest.entries()].map(([name, rec], i) => `
              <div class="lift-row" data-exname="${name.replace(/"/g,'&quot;')}" style="display:grid;grid-template-columns:1fr 72px 56px 24px;align-items:center;padding:10px 20px;cursor:pointer;${i % 2 === 1 ? 'background:rgba(255,255,255,0.02)' : ''}">
                <div>
                  <div style="font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700">${name}</div>
                  <div style="font-size:10px;color:var(--muted);margin-top:1px">${fmtDate(rec.date)} · ${rec.totalSets} sets total</div>
                </div>
                <div style="text-align:right;font-family:'Rajdhani',sans-serif;font-size:16px;font-weight:700;color:var(--accent)">
                  ${rec.weight ? `${rec.weight}<span style="font-size:10px;color:var(--muted)">lbs</span>` : '—'}
                </div>
                <div style="text-align:right;font-family:'Rajdhani',sans-serif;font-size:16px;font-weight:700;color:var(--fg)">
                  ${rec.reps || '—'}
                </div>
                <div style="text-align:right;color:var(--muted);font-size:12px">›</div>
              </div>`).join('')}
          </div>`}
      </div>

      <!-- ══ Session History ══ -->
      <div class="card" style="overflow:hidden">
        <div style="padding:12px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
          <div style="font-family:'Rajdhani',sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--muted)">Session History</div>
          <span style="font-size:11px;color:var(--muted)">${log.length} sessions</span>
        </div>
        ${log.length === 0 ? `
          <div style="padding:32px;text-align:center;color:var(--muted);font-size:13px">
            Complete sessions on the Routine tab to build your history.
          </div>` :
          log.map((entry, i) => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 20px;${i % 2 === 1 ? 'background:rgba(255,255,255,0.02)' : ''}border-bottom:1px solid rgba(255,255,255,0.03)">
              <div>
                <div style="font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:700">${entry.dayName}</div>
                ${entry.notes ? `<div style="font-size:11px;color:rgba(226,234,242,0.5);margin-top:2px;line-height:1.4">${entry.notes}</div>` : ''}
              </div>
              <div style="text-align:right;flex-shrink:0;margin-left:12px">
                <div style="font-size:11px;color:var(--muted)">${fmtFull(entry.date)}</div>
                <div style="font-size:10px;color:var(--muted);margin-top:2px;text-transform:capitalize">${entry.phase}</div>
              </div>
            </div>`).join('')}
      </div>`;

    renderProgressPics(panel.querySelector('#progressPicsSection'));

    /* ── Lift history modal (created once, reused) ── */
    let liftHistoryOverlay = document.getElementById('liftHistoryOverlay');
    if (!liftHistoryOverlay) {
      liftHistoryOverlay = document.createElement('div');
      liftHistoryOverlay.id = 'liftHistoryOverlay';
      liftHistoryOverlay.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:1000;align-items:flex-end;justify-content:center';
      liftHistoryOverlay.innerHTML = `
        <div id="liftHistorySheet" style="background:var(--surface);border-radius:18px 18px 0 0;width:100%;max-width:600px;max-height:80vh;display:flex;flex-direction:column">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--border);flex-shrink:0">
            <div>
              <div style="font-family:'Rajdhani',sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--muted);margin-bottom:3px">Exercise History</div>
              <div id="liftHistoryName" style="font-family:'Rajdhani',sans-serif;font-size:18px;font-weight:700"></div>
            </div>
            <button id="liftHistoryClose" style="background:rgba(255,255,255,0.08);border:none;color:var(--fg);font-size:18px;width:32px;height:32px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center">✕</button>
          </div>
          <div id="liftHistoryBody" style="overflow-y:auto;flex:1;padding:0 0 24px"></div>
        </div>`;
      document.body.appendChild(liftHistoryOverlay);
    }

    function openLiftHistory(exName) {
      const sessions = (ws.logbook || [])
        .map(entry => {
          const ex = (entry.exercises || []).find(e => e.name === exName);
          if (!ex) return null;
          const sets = (ex.sets || []).filter(s => s.reps || s.weight);
          if (!sets.length) return null;
          return { date: entry.date, sets };
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      document.getElementById('liftHistoryName').textContent = exName;
      const body = document.getElementById('liftHistoryBody');
      body.innerHTML = sessions.length === 0
        ? `<div style="padding:32px;text-align:center;color:var(--muted);font-size:13px">No sets logged yet for this exercise.</div>`
        : sessions.map((s, si) => `
            <div style="padding:12px 20px;${si > 0 ? 'border-top:1px solid rgba(255,255,255,0.06)' : ''}">
              <div style="font-family:'Rajdhani',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--accent);margin-bottom:8px">
                ${new Date(s.date).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'})}
              </div>
              ${s.sets.map((set, j) => `
                <div style="display:flex;align-items:center;gap:12px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.03)">
                  <span style="font-family:'Rajdhani',sans-serif;font-size:11px;color:var(--muted);min-width:40px">Set ${j+1}</span>
                  <span style="font-family:'Rajdhani',sans-serif;font-size:16px;font-weight:700;color:var(--accent)">${set.weight ? `${set.weight}<span style="font-size:10px;color:var(--muted)"> lbs</span>` : '—'}</span>
                  <span style="font-size:12px;color:var(--muted)">×</span>
                  <span style="font-family:'Rajdhani',sans-serif;font-size:16px;font-weight:700;color:var(--fg)">${set.reps || '—'}<span style="font-size:10px;color:var(--muted)"> reps</span></span>
                </div>`).join('')}
            </div>`).join('');

      liftHistoryOverlay.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }

    function closeLiftHistory() {
      liftHistoryOverlay.style.display = 'none';
      document.body.style.overflow = '';
    }

    document.getElementById('liftHistoryClose').onclick = closeLiftHistory;
    liftHistoryOverlay.addEventListener('click', e => { if (e.target === liftHistoryOverlay) closeLiftHistory(); });

    panel.querySelectorAll('.lift-row').forEach(row => {
      row.addEventListener('click', () => openLiftHistory(row.dataset.exname));
    });
  }

  /* ══════════════════════════════════════════════════════════════
     PROGRESS PICS TAB
     Images stored as base64 data URLs in STATE.data.workout.progressPics[].
     FileReader API converts uploads; addProgressPic() saves to IDB.
  ══════════════════════════════════════════════════════════════ */
  function renderProgressPics(panel) {
    const pics = ws.progressPics || [];
    panel.innerHTML = `
      <div style="padding:12px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
        <div style="font-family:'Rajdhani',sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--muted)">Progress Photos</div>
        <div style="display:flex;align-items:center;gap:8px">
          <input type="text" class="form-input" id="picNoteInput" placeholder="Label (e.g. Week 3 front)" style="width:160px;padding:4px 10px;font-size:11px" />
          <button class="day-tab active" id="uploadPicBtn" style="padding:5px 12px;font-size:11px;white-space:nowrap">+ Add</button>
          <input type="file" id="picFileInput" accept="image/*" style="display:none" />
        </div>
      </div>
      ${pics.length === 0 ? `
        <div style="padding:28px;text-align:center;color:var(--muted);font-size:13px">No photos yet — add your first check-in above.</div>` : `
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
          <img src="${pic.dataUrl}" alt="Progress ${idx + 1}" class="progress-pic-img" draggable="false" />
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

      /* ── Click-and-drag to scroll ── */
      let isDragging = false, startX = 0, scrollLeft = 0;
      strip.addEventListener('mousedown', e => {
        isDragging = true;
        startX     = e.pageX - strip.offsetLeft;
        scrollLeft = strip.scrollLeft;
        strip.style.cursor = 'grabbing';
        strip.style.userSelect = 'none';
      });
      strip.addEventListener('mouseleave', () => { isDragging = false; strip.style.cursor = ''; });
      strip.addEventListener('mouseup',    () => { isDragging = false; strip.style.cursor = ''; strip.style.userSelect = ''; });
      strip.addEventListener('mousemove', e => {
        if (!isDragging) return;
        e.preventDefault();
        strip.scrollLeft = scrollLeft - (e.pageX - strip.offsetLeft - startX);
      });
    }
  }



  /* ── Initial render ── */
  renderTab();
});
