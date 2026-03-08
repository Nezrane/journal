/**
 * KOLTYN OS — workout/page.js
 *
 * DATA FLOW
 *   APP_DATA.workout     → exercise data (recovery + ramping phases)
 *   APP_DATA.stretchingRoutine, morningRoutine → static reference sections
 *   APP_DATA.healthPrinciples.workout → static principles
 *   STATE.data.workout   → live: current day, phase, log (persisted to IDB)
 *
 * KEY FEATURES
 *   • Current workout day auto-tracked via STATE.data.workout.schedule
 *   • "Log Workout" button advances schedule and writes to IDB
 *   • Recovery / Ramping phase toggle persisted to STATE
 *   • Rest day after every Lower workout (built into schedule)
 *   • Morning routine section
 *   • Stretching section (morning + post-workout)
 *   • Health principles section
 *   • Click any exercise to see notes + swap options
 */

window.registerPage('workout', function initWorkout() {

  /* ── Data from data.js ── */
  const RECOVERY = APP_DATA.workout.recovery;
  const RAMPING  = APP_DATA.workout.ramping;
  const REST_DAY = APP_DATA.workout.restDay;

  /* ── Live state ── */
  const ws = STATE.data.workout;

  let currentPhaseData = ws.currentPhase === 'ramping' ? RAMPING : RECOVERY;
  let currentPhaseName = ws.currentPhase || 'recovery';
  let currentDay       = ws.schedule[ws.currentDayIndex % ws.schedule.length];

  const DAYS = ['Upper','Lower','Pull','Push','Legs'];

  /* ── Build page HTML (tabs) ── */
  const inner = document.getElementById('workout-inner');
  inner.innerHTML = `
    ${buildPageHeader('Jeff Nippard PPL', 'Workout', 'Program',
      'Recovery Phase (Weeks 1–5) → Ramping Phase (Week 6+). Tap any exercise for full notes & swaps.',
      `<div class="phase-toggle">
         <button class="phase-btn${currentPhaseName==='recovery'?' active':''}" id="btnRecovery">Recovery</button>
         <button class="phase-btn${currentPhaseName==='ramping'?' active':''}"  id="btnRamping">Ramping</button>
       </div>`
    )}

    <!-- Tab bar -->
    <div class="day-tabs" id="mainWorkoutTabs" style="margin-bottom:8px">
      <button class="day-tab active" data-wtab="today">Today</button>
      <button class="day-tab"        data-wtab="log">History</button>
      <button class="day-tab"        data-wtab="morning">Morning</button>
      <button class="day-tab"        data-wtab="stretch">Stretching</button>
      <button class="day-tab"        data-wtab="principles">Principles</button>
    </div>

    <div id="workoutTabPanel"></div>`;

  /* ── Phase toggle ── */
  function setPhase(name) {
    currentPhaseName  = name;
    currentPhaseData  = name === 'ramping' ? RAMPING : RECOVERY;
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
    if      (activeTab === 'today')      renderToday();
    else if (activeTab === 'log')        renderLog(panel);
    else if (activeTab === 'morning')    renderMorning(panel);
    else if (activeTab === 'stretch')    renderStretching(panel);
    else if (activeTab === 'principles') renderPrinciples(panel);
  }

  /* ══════════════════════════════════════════════════════════════
     TODAY TAB
  ══════════════════════════════════════════════════════════════ */
  function renderToday() {
    const panel = document.getElementById('workoutTabPanel');
    currentDay = ws.schedule[ws.currentDayIndex % ws.schedule.length];
    const dayData = currentDay === 'Rest' ? REST_DAY : (currentPhaseData[currentDay] || { focus:'', exercises:[] });
    const phaseName = currentPhaseName === 'recovery' ? 'Recovery Phase' : 'Ramping Phase';

    panel.innerHTML = `
      <!-- Day navigator (all days of cycle as tabs) -->
      <div class="card" style="margin-bottom:16px">
        <div class="card-header" style="display:flex;align-items:center;justify-content:space-between">
          <div class="card-title" id="phaseLabel">${phaseName} — ${currentPhaseName === 'recovery' ? 'Weeks 1–5' : 'Week 6+'}</div>
          <span class="badge badge-warn" id="phaseSubtitle">${currentPhaseName === 'recovery' ? 'Technique Focus' : 'Progressive Overload'}</span>
        </div>
        <div class="card-body" style="padding:14px 16px">
          <div class="day-tabs" id="dayTabs"></div>
        </div>
      </div>

      <!-- Exercise card -->
      <div id="workoutContent"></div>

      <!-- Log workout button -->
      ${currentDay !== 'Rest' ? `
        <div class="card" style="margin-top:16px">
          <div class="card-body" style="padding:16px">
            <div style="font-size:12px;color:var(--muted);margin-bottom:8px">Log this session to advance to the next scheduled day.</div>
            <textarea class="venture-notes-input" id="workoutNotes" placeholder="Optional: notes, weight used, how it felt…" style="height:60px"></textarea>
            <button class="phase-btn active" id="logWorkoutBtn" style="margin-top:10px;padding:10px 24px;font-size:14px">✓ Log ${currentDay} Session</button>
          </div>
        </div>` : `
        <div class="card" style="margin-top:16px">
          <div class="card-body" style="padding:16px;text-align:center">
            <div style="font-size:28px;margin-bottom:8px">😴</div>
            <div style="font-size:14px;font-weight:600;margin-bottom:4px">Rest Day</div>
            <div style="font-size:12px;color:var(--muted)">Active recovery only. Walk, stretch, foam roll.</div>
            <button class="day-tab active" id="logRestBtn" style="margin-top:14px;padding:8px 20px">Mark Rest Day Complete →</button>
          </div>
        </div>`}`;

    /* Day tabs */
    renderDayTabs();
    renderDayContent();

    /* Log button */
    inner.querySelector('#logWorkoutBtn, #logRestBtn')?.addEventListener('click', () => {
      const notes = (inner.querySelector('#workoutNotes')?.value || '').trim();
      STATE.logWorkout(currentDay, currentPhaseName, [], notes);
      /* Advance and re-render */
      renderToday();
    });
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
        <div class="ex-num">${i+1}</div>
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
      row.addEventListener('click', () => openExModal(ex, i+1));
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
          ${(ex.swaps||[]).map((s,i)=>`<div class="swap-item"><strong>Option ${i+1}:</strong> ${s}</div>`).join('')}
          ${!ex.swaps?.length ? '<div style="color:var(--muted);font-size:13px">No direct swaps — this exercise is foundational.</div>' : ''}
        </div>
      </div>`;
    exOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeExModal() {
    if (exModal) { exModal.style.transform=''; exModal.style.transition=''; }
    exOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  exOverlay.addEventListener('click', e => { if(e.target===exOverlay) closeExModal(); });
  document.getElementById('exModalClose').addEventListener('click', closeExModal);
  document.addEventListener('keydown', e => { if(e.key==='Escape' && exOverlay.classList.contains('open')) closeExModal(); });
  setupSwipeDismiss(exModal, closeExModal);

  /* ══════════════════════════════════════════════════════════════
     HISTORY TAB
  ══════════════════════════════════════════════════════════════ */
  function renderLog(panel) {
    const log = ws.log;
    panel.innerHTML = `
      <div class="section-label">Workout History</div>
      ${log.length === 0 ? `
        <div class="card">
          <div class="card-body" style="text-align:center;padding:40px;color:var(--muted);font-size:13px">
            No sessions logged yet. Log your first workout on the Today tab.
          </div>
        </div>` :
        log.map((entry, i) => `
          <div class="card" style="margin-bottom:10px">
            <div class="card-body" style="padding:14px 16px">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
                <div>
                  <span style="font-family:'Rajdhani',sans-serif;font-size:16px;font-weight:700">${entry.dayName}</span>
                  <span class="badge badge-muted" style="margin-left:8px">${entry.phase}</span>
                </div>
                <span style="font-size:11px;color:var(--muted)">${new Date(entry.date).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</span>
              </div>
              ${entry.notes ? `<div style="font-size:12px;color:rgba(226,234,242,0.65);line-height:1.5">${entry.notes}</div>` : ''}
            </div>
          </div>`).join('')}`;
  }

  /* ══════════════════════════════════════════════════════════════
     MORNING ROUTINE TAB
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
                <span style="color:var(--accent);margin-right:6px">${i+1}.</span>${step.step}
              </div>
              <div style="font-size:12px;color:rgba(226,234,242,0.72);line-height:1.55">${step.detail}</div>
            </div>
          </div>
        </div>`).join('')}`;
  }

  /* ══════════════════════════════════════════════════════════════
     STRETCHING TAB
  ══════════════════════════════════════════════════════════════ */
  function renderStretching(panel) {
    const sr = APP_DATA.stretchingRoutine || {};
    panel.innerHTML = `
      <!-- Morning stretches -->
      <div class="section-label">Morning Activation Stretches</div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:14px">Do these before your morning activation drills. Takes ~8 minutes.</div>
      <div class="grid-2" id="morningStretches"></div>

      <!-- Post-workout stretches -->
      <div class="section-label" style="margin-top:8px">Post-Workout Cooldown</div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:14px">10 minutes after every training session. Non-negotiable for recovery.</div>
      <div class="grid-2" id="postStretches"></div>`;

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

    const morningEl = panel.querySelector('#morningStretches');
    const postEl    = panel.querySelector('#postStretches');
    (sr.morning || []).forEach(s => { morningEl.innerHTML += stretchCard(s); });
    (sr.postWorkout || []).forEach(s => { postEl.innerHTML += stretchCard(s); });
  }

  /* ══════════════════════════════════════════════════════════════
     PRINCIPLES TAB
  ══════════════════════════════════════════════════════════════ */
  function renderPrinciples(panel) {
    panel.innerHTML = `
      <div class="section-label">Training Principles</div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:14px">Internalize these. They separate people who get results from people who just go through the motions.</div>
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
