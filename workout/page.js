/**
 * KOLTYN OS — workout/page.js
 * Jeff Nippard PPL — Recovery Phase (Weeks 1-5) + Ramping Phase (Week 6+)
 * Click any exercise to see full notes + swap options.
 */

window.registerPage('workout', function initWorkout() {

  /* ── Data from data.js ── */
  const RECOVERY  = APP_DATA.workout.recovery;
  const RAMPING   = APP_DATA.workout.ramping;
  const REST_DAY  = APP_DATA.workout.restDay;

  /* ── State ── */
  let currentPhaseData = RECOVERY;
  let currentPhaseName = 'recovery';
  let currentDay = 'Pull';

  const DAYS = ['Upper','Lower','Pull','Push','Legs'];

  /* ── Build page HTML ── */
  const inner = document.getElementById('workout-inner');
  inner.innerHTML = `
    ${buildPageHeader('Jeff Nippard PPL', 'Workout', 'Program', 'Recovery Phase (Weeks 1–5) → Ramping Phase (Week 6+). Tap any exercise for full notes & swaps.',
      `<div class="phase-toggle">
         <button class="phase-btn active" id="btnRecovery">Recovery</button>
         <button class="phase-btn" id="btnRamping">Ramping</button>
       </div>`
    )}

    <div class="card">
      <div class="card-header" style="display:flex;align-items:center;justify-content:space-between">
        <div class="card-title" id="phaseLabel">Recovery Phase — Weeks 1–5</div>
        <span class="badge badge-warn" id="phaseSubtitle">Technique Focus</span>
      </div>
      <div class="card-body" style="padding:14px 16px">
        <div class="day-tabs" id="dayTabs"></div>
      </div>
    </div>

    <div id="workoutContent"></div>`;

  /* ── Day tabs ── */
  function renderDayTabs() {
    const tabs = document.getElementById('dayTabs');
    tabs.innerHTML = '';
    [...DAYS, 'Rest'].forEach(day => {
      const btn = document.createElement('button');
      btn.className = 'day-tab' + (day === currentDay ? ' active' : '');
      btn.textContent = day;
      btn.addEventListener('click', () => { currentDay = day; renderDayTabs(); renderDay(); });
      tabs.appendChild(btn);
    });
  }

  /* ── Render exercises for current day ── */
  function renderDay() {
    const content = document.getElementById('workoutContent');
    const dayData = currentDay === 'Rest' ? REST_DAY : (currentPhaseData[currentDay] || { focus:'', exercises:[] });
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

  /* ── Phase toggle ── */
  document.getElementById('btnRecovery').addEventListener('click', () => {
    currentPhaseName = 'recovery';
    currentPhaseData = RECOVERY;
    document.getElementById('btnRecovery').classList.add('active');
    document.getElementById('btnRamping').classList.remove('active');
    document.getElementById('phaseLabel').textContent    = 'Recovery Phase — Weeks 1–5';
    document.getElementById('phaseSubtitle').textContent = 'Technique Focus';
    renderDayTabs();
    renderDay();
  });

  document.getElementById('btnRamping').addEventListener('click', () => {
    currentPhaseName = 'ramping';
    currentPhaseData = RAMPING;
    document.getElementById('btnRamping').classList.add('active');
    document.getElementById('btnRecovery').classList.remove('active');
    document.getElementById('phaseLabel').textContent    = 'Ramping Phase — Week 6+';
    document.getElementById('phaseSubtitle').textContent = 'Progressive Overload';
    renderDayTabs();
    renderDay();
  });

  /* ── Init ── */
  renderDayTabs();
  renderDay();
});
