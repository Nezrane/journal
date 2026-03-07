/**
 * KOLTYN OS — workout/page.js
 * Jeff Nippard PPL — Recovery Phase (Weeks 1-5) + Ramping Phase (Week 6+)
 * Click any exercise to see full notes + swap options.
 */

window.registerPage('workout', function initWorkout() {

  /* ── Exercise data — Recovery Phase ── */
  const RECOVERY = {
    Upper: {
      focus: 'Strength Focused',
      exercises: [
        { name:'Barbell Bench Press', muscle:'Chest', rest:'3-5 min', rpe:'~6', reps:'3×5', notes:'Control the negative. Small arch, feet flat. Bar should touch lower chest. 1-second pause option.', swaps:['DB Bench Press','Smith Machine Bench Press'] },
        { name:'Barbell Row (Overhand)', muscle:'Back', rest:'3-5 min', rpe:'~6', reps:'3×5', notes:'Pull to your belly button, not your chest. Hinge to ~45°. Keep lower back tight throughout.', swaps:['Cable Row','Chest-Supported Row'] },
        { name:'Overhead Press', muscle:'Shoulders', rest:'3-5 min', rpe:'~6', reps:'3×5', notes:'Brace your core like you\'re about to get punched. Press the bar back slightly over your head.', swaps:['DB Shoulder Press','Machine Shoulder Press'] },
        { name:'Lat Pulldown', muscle:'Back', rest:'2-3 min', rpe:'~6', reps:'3×8-10', notes:'Full stretch at top. Pull elbows down and back. Don\'t lean back excessively.', swaps:['Cable Pulldown','Assisted Pull-Up'] },
        { name:'Incline DB Curl', muscle:'Biceps', rest:'1-2 min', rpe:'~7', reps:'3×10-12', notes:'Sit on 45° incline. Full stretch at bottom. No swinging. Squeeze at top.', swaps:['Preacher Curl','Cable Curl'] },
        { name:'Overhead Triceps Extension', muscle:'Triceps', rest:'1-2 min', rpe:'~7', reps:'3×10-12', notes:'Keep elbows pointing straight up. Full stretch, controlled negative.', swaps:['Cable Overhead Extension','DB Skull Crusher'] }
      ]
    },
    Lower: {
      focus: 'Strength Focused',
      exercises: [
        { name:'Barbell Squat', muscle:'Quads', rest:'3-5 min', rpe:'~6', reps:'3×5', notes:'Brace hard, hips back slightly, depth to parallel minimum. Keep knees tracking over toes.', swaps:['Goblet Squat','Leg Press'] },
        { name:'Romanian Deadlift', muscle:'Hamstrings', rest:'3-5 min', rpe:'~6', reps:'3×8', notes:'Push hips back, soft knee bend. Feel hamstring stretch. Bar stays close to legs throughout.', swaps:['Single-Leg RDL','Cable Pull-Through'] },
        { name:'Leg Press', muscle:'Quads', rest:'2-3 min', rpe:'~6', reps:'3×10-12', notes:'Feet shoulder-width, moderate height. Full ROM — don\'t let hips round at bottom.', swaps:['Hack Squat','Smith Machine Squat'] },
        { name:'Lying Leg Curl', muscle:'Hamstrings', rest:'1-2 min', rpe:'~7', reps:'3×12-15', notes:'Lean forward over machine for extra stretch. Pause and squeeze at top.', swaps:['Seated Leg Curl','Nordic Ham Curl'] },
        { name:'Leg Extension', muscle:'Quads', rest:'1-2 min', rpe:'~7', reps:'3×12-15', notes:'Squeeze quad at top. Control the negative. Avoid locking out aggressively.', swaps:['Terminal Knee Extension','Spanish Squat'] },
        { name:'Standing Calf Raise', muscle:'Calves', rest:'1-2 min', rpe:'~7', reps:'4×12-15', notes:'Full ROM — deep stretch at bottom, full contraction at top. 1-2 second pause at bottom.', swaps:['Seated Calf Raise','Leg Press Calf Raise'] }
      ]
    },
    Pull: {
      focus: 'Hypertrophy Focused',
      exercises: [
        { name:'Pull-Up / Chin-Up', muscle:'Back', rest:'2-3 min', rpe:'~6', reps:'3×6-8', notes:'Full dead hang at bottom. Think about driving elbows to hips. Add weight if bodyweight is easy.', swaps:['Lat Pulldown','Assisted Pull-Up'] },
        { name:'Cable Row (Close Grip)', muscle:'Back', rest:'2-3 min', rpe:'~7', reps:'3×10-12', notes:'Sit tall, pull to navel, squeeze shoulder blades together at end range. Full stretch at front.', swaps:['DB Row','Machine Row'] },
        { name:'Face Pull', muscle:'Rear Delts', rest:'1-2 min', rpe:'~7', reps:'3×15-20', notes:'Pull to forehead, external rotate at end. Great for shoulder health — don\'t neglect it.', swaps:['Rear Delt Fly','Band Pull-Apart'] },
        { name:'Incline DB Curl', muscle:'Biceps', rest:'1-2 min', rpe:'~7', reps:'3×12-15', notes:'Full stretch at bottom. No momentum. Alternate arms or both together — your choice.', swaps:['Cable Curl','Hammer Curl'] },
        { name:'Hammer Curl', muscle:'Biceps', rest:'1-2 min', rpe:'~7', reps:'3×12-15', notes:'Neutral grip targets brachialis and brachioradialis. Helps build that bicep peak thickness.', swaps:['Cross-Body Curl','Reverse Curl'] },
        { name:'Rear Delt Fly', muscle:'Rear Delts', rest:'1-2 min', rpe:'~7', reps:'3×15-20', notes:'Hinge over or use cable. Slight bend in elbows, lead with your elbows not your hands.', swaps:['Reverse Pec Deck','Cable Rear Delt Fly'] }
      ]
    },
    Push: {
      focus: 'Hypertrophy Focused',
      exercises: [
        { name:'DB Bench Press', muscle:'Chest', rest:'2-3 min', rpe:'~6', reps:'3×10-12', notes:'1 second pause at the bottom of each rep while maintaining tension on the pecs.', swaps:['Barbell Bench Press','Machine Chest Press'] },
        { name:'Machine Shoulder Press', muscle:'Shoulders', rest:'2-3 min', rpe:'~6', reps:'3×10-12', notes:'Ensure elbows break at least 90°. Mind-muscle connection with delts. Smooth, controlled reps.', swaps:['Cable Shoulder Press','Seated DB Shoulder Press'] },
        { name:'Low-to-High Cable Crossover', muscle:'Chest', rest:'1-2 min', rpe:'~7', reps:'3×12-15', notes:'All reps in the bottom half of ROM. Focus on deep stretch in pecs at bottom of each rep.', swaps:['DB Fly (Bottom Half)','Seated Cable Fly'] },
        { name:'Lean-In Lateral Raise', muscle:'Shoulders', rest:'1-2 min', rpe:'~7', reps:'3×12-15', notes:'Focus on squeezing lateral delt to move the weight. Control both up and down.', swaps:['Cable Lateral Raise','Machine Lateral Raise'] },
        { name:'Katana Triceps Extension', muscle:'Triceps', rest:'1-2 min', rpe:'~7', reps:'3×12-15', notes:'Optionally pause 0.5-1 sec in stretched position. Full ROM.', swaps:['DB Skull Crusher','EZ-Bar Skull Crusher'] },
        { name:'DB Triceps Kickback', muscle:'Triceps', rest:'1-2 min', rpe:'~7', reps:'3×15-20', notes:'Focus on squeezing triceps to move the weight. No swinging.', swaps:['Triceps Pressdown (Rope)','Triceps Pressdown (Bar)'] },
        { name:'Long-Lever Plank', muscle:'Core', rest:'1-2 min', rpe:'~7', reps:'3×30-45s', notes:'Use abs to lower and pull back up. Progressively increase ROM week to week.', swaps:['Ab Wheel Rollout','Swiss Ball Rollout'] }
      ]
    },
    Legs: {
      focus: 'Hypertrophy Focused',
      exercises: [
        { name:'DB Walking Lunge', muscle:'Quads', rest:'2-3 min', rpe:'~6', reps:'3×10-12', notes:'Controlled negative, explode on the positive. Minimise contribution from rear leg.', swaps:['Leg Press','Hack Squat'] },
        { name:'Nordic Ham Curl', muscle:'Hamstrings', rest:'1-2 min', rpe:'~7', reps:'3×6-10', notes:'Lean forward to maximise stretch. This is hard — scale appropriately. Explosive negative is fine.', swaps:['Lying Leg Curl','Seated Leg Curl'] },
        { name:'DB Static Lunge', muscle:'Quads/Glutes', rest:'2-3 min', rpe:'~6', reps:'3×10-12', notes:'Medium strides. Minimise contribution from back leg. Chest up throughout.', swaps:['Smith Machine Lunge','Bulgarian Split Squat'] },
        { name:'Lateral Band Walk', muscle:'Glutes', rest:'1-2 min', rpe:'~7', reps:'3×15-20/side', notes:'If possible use pads for more ROM. Lean forward and grab rails to stretch glutes further.', swaps:['Cable Hip Abduction','Machine Hip Abduction'] },
        { name:'Leg Press Calf Press', muscle:'Calves', rest:'1-2 min', rpe:'~7', reps:'4×15-20', notes:'1-2 second pause at the bottom. Roll ankle back and forth on balls of feet.', swaps:['Seated Calf Raise','Standing Calf Raise'] }
      ]
    }
  };

  /* ── Ramping Phase (Week 6+) — heavier, more volume ── */
  const RAMPING = {
    Upper: {
      focus: 'Strength Focused',
      exercises: [
        { name:'Barbell Bench Press', muscle:'Chest', rest:'3-5 min', rpe:'~7', reps:'4×4', notes:'Progressive overload from recovery phase. Add weight when you can complete all reps cleanly.', swaps:['DB Bench Press','Smith Machine Bench Press'] },
        { name:'Weighted Pull-Up', muscle:'Back', rest:'3-5 min', rpe:'~7', reps:'4×4-6', notes:'Add weight via belt or vest. Full dead hang. Think elbows to hips.', swaps:['Lat Pulldown (Heavy)','Assisted Weighted Pull-Up'] },
        { name:'Overhead Press', muscle:'Shoulders', rest:'3-5 min', rpe:'~7', reps:'4×4', notes:'Progress from recovery. Focus on leg drive and full lockout at top.', swaps:['DB Shoulder Press','Push Press'] },
        { name:'Cable Row (Heavy)', muscle:'Back', rest:'2-3 min', rpe:'~7', reps:'4×8', notes:'Heavier load from recovery. Full stretch, squeeze at contraction.', swaps:['DB Row','Machine Row'] },
        { name:'Incline DB Curl', muscle:'Biceps', rest:'1-2 min', rpe:'~8', reps:'4×10-12', notes:'Increase weight from recovery phase. Still full ROM and controlled.', swaps:['Preacher Curl','Cable Curl'] },
        { name:'Close-Grip Bench Press', muscle:'Triceps', rest:'2-3 min', rpe:'~7', reps:'3×8-10', notes:'Elbows in, wrists straight. Great compound triceps builder.', swaps:['Dips (Weighted)','Triceps Pressdown (Heavy)'] }
      ]
    },
    Lower: {
      focus: 'Strength Focused',
      exercises: [
        { name:'Barbell Squat', muscle:'Quads', rest:'3-5 min', rpe:'~7', reps:'4×4', notes:'Progressive overload. Brace harder, stay tighter. Belt optional at heavier weights.', swaps:['Safety Bar Squat','Hack Squat'] },
        { name:'Conventional Deadlift', muscle:'Posterior Chain', rest:'4-5 min', rpe:'~7', reps:'3×4-5', notes:'Now introducing deadlifts in ramping. Flat back, bar close, leg drive into floor.', swaps:['Trap Bar Deadlift','Sumo Deadlift'] },
        { name:'Bulgarian Split Squat', muscle:'Quads/Glutes', rest:'2-3 min', rpe:'~7', reps:'3×8-10', notes:'Rear foot elevated. Front foot far enough forward. Deep stretch in hip flexor.', swaps:['Walking Lunge','Step-Up'] },
        { name:'Leg Curl (Heavy)', muscle:'Hamstrings', rest:'2-3 min', rpe:'~7', reps:'3×10-12', notes:'Increase load from recovery phase. Lean forward for extra stretch.', swaps:['Nordic Ham Curl','Romanian Deadlift'] },
        { name:'Leg Extension (Heavy)', muscle:'Quads', rest:'1-2 min', rpe:'~7', reps:'3×10-12', notes:'Controlled squeeze at top. Increase load progressively week over week.', swaps:['TKE','Spanish Squat'] },
        { name:'Seated Calf Raise', muscle:'Calves', rest:'1-2 min', rpe:'~7', reps:'4×15', notes:'Full ROM. Soleus-focused in seated position. Deep stretch every rep.', swaps:['Standing Calf Raise','Smith Machine Calf Raise'] }
      ]
    },
    Pull: {
      focus: 'Hypertrophy Focused',
      exercises: [
        { name:'Weighted Pull-Up', muscle:'Back', rest:'3 min', rpe:'~7', reps:'4×6-8', notes:'Add 5-10% load from recovery. Still full ROM. Elbows drive to hips.', swaps:['Lat Pulldown','Chest-Supported Row'] },
        { name:'Incline DB Row', muscle:'Back', rest:'2-3 min', rpe:'~7', reps:'4×10-12', notes:'Chest on 30-45° pad. Elbow drives back and up. Great for upper back thickness.', swaps:['Cable Row','T-Bar Row'] },
        { name:'Face Pull (Heavy)', muscle:'Rear Delts', rest:'1-2 min', rpe:'~7', reps:'3×15-20', notes:'Increase load. Still focusing on external rotation at end. Don\'t rush the reps.', swaps:['Rear Delt Fly','Reverse Pec Deck'] },
        { name:'Bayesian Cable Curl', muscle:'Biceps', rest:'1-2 min', rpe:'~8', reps:'3×12-15', notes:'Stand in front of cable, cable pulls arm back. Great peak contraction and stretch.', swaps:['Incline DB Curl','Preacher Curl'] },
        { name:'Hammer Curl (Heavy)', muscle:'Biceps', rest:'1-2 min', rpe:'~7', reps:'3×10-12', notes:'Increase load from recovery. Still no swinging.', swaps:['Cross-Body Curl','Reverse Curl'] },
        { name:'Straight-Arm Pulldown', muscle:'Lats', rest:'1-2 min', rpe:'~7', reps:'3×15', notes:'Great lat isolation. Arms stay straight. Think about pulling the bar to your hips.', swaps:['Pullover','Cable Pullover'] }
      ]
    },
    Push: {
      focus: 'Hypertrophy Focused',
      exercises: [
        { name:'Barbell Bench Press (Hypertrophy)', muscle:'Chest', rest:'2-3 min', rpe:'~7', reps:'4×8-10', notes:'Higher reps than lower day. Still controlled, pause optional. Focus on feel.', swaps:['DB Bench Press','Machine Chest Press'] },
        { name:'DB Shoulder Press (Heavy)', muscle:'Shoulders', rest:'2-3 min', rpe:'~7', reps:'4×8-10', notes:'Increase load from recovery. Full ROM — elbows below parallel at bottom.', swaps:['Machine Shoulder Press','Push Press'] },
        { name:'Cable Fly (Mid)', muscle:'Chest', rest:'1-2 min', rpe:'~7', reps:'3×12-15', notes:'Mid-cable position. Focus on peak chest contraction. Slight forward lean.', swaps:['DB Fly','Machine Fly'] },
        { name:'Cable Lateral Raise', muscle:'Shoulders', rest:'1-2 min', rpe:'~7', reps:'3×15-20', notes:'More constant tension than DB version. Control the negative.', swaps:['Lean-In Lateral Raise','Machine Lateral Raise'] },
        { name:'Triceps Pressdown (Heavy)', muscle:'Triceps', rest:'1-2 min', rpe:'~7', reps:'3×10-12', notes:'Use bar for maximum load. Elbows stay pinned to sides. Full lockout.', swaps:['Close-Grip Bench Press','Dips'] },
        { name:'Overhead Triceps Extension (Cable)', muscle:'Triceps', rest:'1-2 min', rpe:'~7', reps:'3×12-15', notes:'Full stretch at bottom. Rope or bar — both work. Keep elbows tight.', swaps:['DB Overhead Extension','EZ Overhead Extension'] },
        { name:'Weighted Plank / Ab Wheel', muscle:'Core', rest:'1-2 min', rpe:'~7', reps:'3×12-15', notes:'Progress from recovery plank to ab wheel. Full extension if able.', swaps:['Long-Lever Plank','Cable Crunch'] }
      ]
    },
    Legs: {
      focus: 'Hypertrophy Focused',
      exercises: [
        { name:'Hack Squat', muscle:'Quads', rest:'2-3 min', rpe:'~7', reps:'4×8-10', notes:'Feet lower and narrower for more quad focus. Deep ROM. Control the negative.', swaps:['Leg Press','V-Squat'] },
        { name:'Romanian Deadlift (Heavy)', muscle:'Hamstrings', rest:'2-3 min', rpe:'~7', reps:'3×8-10', notes:'More load than recovery. Feel the hamstring stretch. Slow negative.', swaps:['Single-Leg RDL','Good Morning'] },
        { name:'Bulgarian Split Squat', muscle:'Quads/Glutes', rest:'2-3 min', rpe:'~7', reps:'3×10-12', notes:'Progress from lunges. More stable platform for loading. Deep stretch in hip flexor.', swaps:['Leg Press','Walking Lunge'] },
        { name:'Glute-Ham Raise', muscle:'Hamstrings', rest:'1-2 min', rpe:'~7', reps:'3×8-12', notes:'Advanced hamstring exercise. Use a machine or anchor feet. Control on the way down.', swaps:['Lying Leg Curl','Nordic Ham Curl'] },
        { name:'Seated Calf Raise (Heavy)', muscle:'Calves', rest:'1-2 min', rpe:'~7', reps:'4×12-15', notes:'Deep stretch every rep. Add load from recovery phase.', swaps:['Standing Calf Raise','Leg Press Calf Raise'] }
      ]
    }
  };

  /* ── State ── */
  let currentPhaseData = RECOVERY;
  let currentPhaseName = 'recovery';
  let currentDay = 'Pull';

  const DAYS = ['Upper','Lower','Pull','Push','Legs'];
  const REST_DAY = { focus:'Active Recovery', exercises:[
    { name:'Light Walk (20-30 min)', muscle:'Cardio', rest:'—', rpe:'~3', reps:'1 session', notes:'Low intensity — keep heart rate conversational. Good for blood flow and recovery.', swaps:['Cycling','Swimming'] },
    { name:'Hip 90/90 Stretch', muscle:'Mobility', rest:'—', rpe:'1', reps:'2 min/side', notes:'Sit on floor with both legs at 90°. Lean into front hip. Great for hip mobility.', swaps:['Pigeon Pose','Hip Flexor Stretch'] },
    { name:'Shoulder Circle + Pass-Through', muscle:'Mobility', rest:'—', rpe:'1', reps:'2-3 sets', notes:'Use band or dowel. Helps maintain shoulder health on heavy upper days.', swaps:['Dislocates','Wall Slides'] },
    { name:'Foam Roll (Full Body)', muscle:'Recovery', rest:'—', rpe:'1', reps:'10 min', notes:'Focus on lats, quads, calves. Slow, steady pressure on tight spots.', swaps:['Massage Gun','Stretching'] }
  ]};

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
