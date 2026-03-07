/**
 * KOLTYN OS — dashboard page
 * Morning routine, daily overview, and vision board (7 life areas).
 */

window.registerPage('dashboard', function initDashboard() {

  const MORNING_HABITS = [
    'Wake up before 9am',
    'Rinse mouth + drink water / tea',
    '15 minutes of sunlight',
    'Review Daily Journal',
    'Review Investments (crypto, stocks)',
    'Check emails & messages',
    'Quick stretch & maintenance (10 pull-ups, 30 push-ups, 30s L-sit, hip + shoulder + hamstring stretch)',
    'Eat Meal 1 (Breakfast)',
    '2 hours focused work on Envosta',
    '1 hour workout',
  ];

  const QUICK_NAV = [
    { page:'nutrition', icon:'◈', label:'Nutrition',  color:'#3ddc6e' },
    { page:'workout',   icon:'◉', label:'Workout',    color:'#ff6b35' },
    { page:'business',  icon:'◧', label:'Business',   color:'#7c6af7' },
    { page:'wealth',    icon:'◈', label:'Wealth',     color:'#f5c842' },
    { page:'creative',  icon:'♫', label:'Creative',   color:'#f06292' },
  ];

  const DAILY_STATS = [
    { label:'Body Weight', value:'176', unit:'lbs',  note:'Goal: 200 lbs' },
    { label:'Body Fat',    value:'16',  unit:'%',    note:'Goal: 15%' },
    { label:'Envosta MRR', value:'$0',  unit:'',     note:'Goal: $50K/mo' },
    { label:'Songs Ready', value:'8',   unit:'',     note:'Setlist: 7 songs' },
  ];

  const VISION_AREAS = [
    {
      icon:'💼', name:'Career & Business',
      dream:  ['Envosta is a $50K MRR SaaS company running mostly without me','Known as the founder who built something real from scratch','Multiple successful ventures — not just one'],
      oneYear:['Envosta at $10K MRR (Stage 1 graduation)','First 50 paying customers','Repeatable sales process in place'],
      focus:  ['Build and ship v1 of Envosta','Talk to 10 target users','Close first 3 paying customers manually']
    },
    {
      icon:'💰', name:'Finance & Wealth',
      dream:  ['Financially free — money works for me, not the other way','Index fund portfolio generating meaningful passive income','Never worry about money again — abundance mindset fully embodied'],
      oneYear:['Envosta paying all personal expenses','Consistent monthly investment into index funds','Emergency fund fully stocked (6 months expenses)'],
      focus:  ['Separate business and personal finances','Set up automatic index fund DCA','Track MRR and net worth weekly']
    },
    {
      icon:'💪', name:'Health & Fitness',
      dream:  ['200 lbs, 15% body fat — athletic, powerful, lean','Press to handstand and muscle up achieved','Feel the best I\'ve ever felt — energy, strength, mobility'],
      oneYear:['190 lbs, 16% body fat — clear visual progress','Handstand holds for 10 seconds','Consistent Jeff Nippard PPL — no missed weeks'],
      focus:  ['Current: 176 lbs, 16% BF — add clean bulk calories','Complete full Recovery Phase (Weeks 1–5) with no skipped sessions','Nail morning routine: stretch + 10 pull-ups + 30 push-ups daily']
    },
    {
      icon:'❤️', name:'Relationships & Family',
      dream:  ['Deep, authentic relationships — a small circle of people who truly know me','The kind of partner you don\'t settle for — when it\'s right it\'s obvious','Strong family bonds — present and intentional'],
      oneYear:['Invest in existing friendships deliberately — plan something quarterly','Be fully present when with family — phone down, eyes up','Know what I actually value in a partner (write it out)'],
      focus:  ['Schedule one intentional social thing per week','Call family member each week','Be more present — notice when I\'m distracted and course-correct']
    },
    {
      icon:'🧠', name:'Personal Growth',
      dream:  ['Think clearly, decide quickly, execute consistently — uncommon self-mastery','Identity: builder, performer, athlete — not just one thing','Read 50+ books — ideas compound just like money'],
      oneYear:['Read 12 books — one per month','Daily journalling habit — 5 min minimum','Meditation practice — 10 min daily'],
      focus:  ['Morning review: journal + vision review + priorities for the day','Read 15 pages before bed every night','Write down 3 things I\'m grateful for each morning']
    },
    {
      icon:'🎸', name:'Music & Creativity',
      dream:  ['Original songs that make people feel something real','Known locally as the guy worth watching — packed rooms','Album recorded — even if just for me'],
      oneYear:['10 songs ready to perform — covers + originals','5 original songs with demos recorded','Regular bar gig rotation — monthly at minimum'],
      focus:  ['Daily practice: 30 min minimum — fingerpicking + vocals + writing','Add one new song to setlist per month','Record a voice memo demo of "Rodeo Bones" this month']
    },
    {
      icon:'✈️', name:'Lifestyle & Adventure',
      dream:  ['Surf good waves in multiple countries — Indo, Portugal, Central America','Horses as part of life — riding regularly, maybe own one day','Motorcycle trip across a country — no plan, just ride'],
      oneYear:['One surf trip — even a domestic one counts','Ride a horse at least once','Plan the motorcycle route even if not executing yet'],
      focus:  ['Research one surf destination — cost, season, flights','Find a local spot to ride horses — one session this quarter','Take the motorcycle out more — rides, not just errands']
    }
  ];

  /* ── Build HTML ── */
  const inner = document.getElementById('dashboard-inner');
  inner.innerHTML = `
    ${buildPageHeader('Personal OS', 'Morning', 'Dashboard', new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'}))}

    <!-- Stats row -->
    <div class="grid-4" id="dashStats"></div>

    <!-- North Star goal -->
    <div class="goal-card">
      <div style="font-family:'Rajdhani',sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#4fc3f7;margin-bottom:6px">North Star Goal</div>
      <div class="goal-main">Build Envosta to $50K MRR · Get to 200 lbs and 15% body fat · Unlock Press to Handstand and Muscle Up</div>
      <div class="goal-pillars">
        <span class="goal-pillar">$50K MRR</span>
        <span class="goal-pillar">200 lbs · 15% BF</span>
        <span class="goal-pillar">Press to Handstand</span>
        <span class="goal-pillar">Muscle Up</span>
      </div>
    </div>

    <!-- Morning routine + Quick nav -->
    <div class="dashboard-grid">
      <div class="card">
        <div class="card-header" style="display:flex;align-items:center;justify-content:space-between">
          <div class="card-title">Morning Routine</div>
          <span class="badge badge-muted" id="habitCount">0 / ${MORNING_HABITS.length}</span>
        </div>
        <div class="card-body" style="padding:10px 16px">
          <div id="habitList"></div>
        </div>
      </div>

      <div>
        <div class="card" style="margin-bottom:16px">
          <div class="card-header"><div class="card-title">Navigate</div></div>
          <div class="card-body">
            <div class="quick-nav" id="quickNav"></div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><div class="card-title">Today's Focus</div></div>
          <div class="card-body">
            ${[
              ['🏗️ Business', 'Build Envosta — talk to users, ship something'],
              ['💪 Workout',  'Recovery Phase — check workout page for today\'s day'],
              ['🎸 Creative', '30 min practice — fingerpicking + vocals'],
              ['📚 Growth',   '15 pages before bed'],
            ].map(([t,d])=>`
              <div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
                <div style="font-family:'Rajdhani',sans-serif;font-size:12px;font-weight:700;color:var(--accent);margin-bottom:2px">${t}</div>
                <div style="font-size:12px;color:rgba(226,234,242,0.72)">${d}</div>
              </div>`).join('')}
          </div>
        </div>
      </div>
    </div>

    <!-- Vision Board -->
    <div class="section-label">Vision Board</div>

    <div style="background:linear-gradient(135deg,rgba(79,195,247,0.08) 0%,rgba(2,136,209,0.04) 100%);border:1px solid rgba(79,195,247,0.2);border-radius:var(--radius);padding:18px 22px">
      <div style="font-family:'Rajdhani',sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#4fc3f7;margin-bottom:8px">Overarching Goal</div>
      <div style="font-family:'Rajdhani',sans-serif;font-size:18px;font-weight:700;line-height:1.4;margin-bottom:12px">Build Envosta to $50K MRR · Get to 200 lbs and 15% body fat · Unlock Press to Handstand and Muscle Up</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${['$50K MRR','200 lbs','15% BF','Press to Handstand','Muscle Up'].map(p=>`<span style="font-family:'Rajdhani',sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;padding:4px 12px;border-radius:20px;border:1px solid rgba(79,195,247,0.3);color:#4fc3f7;background:rgba(79,195,247,0.08)">${p}</span>`).join('')}
      </div>
    </div>

    <div id="visionAreas"></div>`;

  /* ── Stats ── */
  const statsEl = document.getElementById('dashStats');
  DAILY_STATS.forEach(s => {
    statsEl.innerHTML += `
      <div class="stat-card">
        <div class="stat-label">${s.label}</div>
        <div style="display:flex;align-items:baseline;gap:2px">
          <span class="stat-value" style="font-size:24px">${s.value}</span>
          ${s.unit ? `<span class="stat-unit">${s.unit}</span>` : ''}
        </div>
        <div class="stat-delta flat">${s.note}</div>
      </div>`;
  });

  /* ── Habits with checkboxes ── */
  let checkedCount = 0;
  const habitList = document.getElementById('habitList');

  MORNING_HABITS.forEach((habit, i) => {
    const item = document.createElement('div');
    item.className = 'habit-item';
    item.innerHTML = `<div class="habit-check" id="hc-${i}"></div><span>${habit}</span>`;
    const check = item.querySelector(`#hc-${i}`);
    check.addEventListener('click', () => {
      const done = !check.classList.contains('done');
      check.classList.toggle('done', done);
      checkedCount = document.querySelectorAll('.habit-check.done').length;
      document.getElementById('habitCount').textContent = `${checkedCount} / ${MORNING_HABITS.length}`;
    });
    habitList.appendChild(item);
  });

  /* ── Quick nav ── */
  const quickNav = document.getElementById('quickNav');
  QUICK_NAV.forEach(item => {
    const el = document.createElement('div');
    el.className = 'quick-nav-item';
    el.innerHTML = `
      <div class="quick-nav-icon" style="color:${item.color}">${item.icon}</div>
      <div class="quick-nav-label">${item.label}</div>`;
    el.addEventListener('click', () => navigateTo(item.page));
    quickNav.appendChild(el);
  });

  /* ── Vision areas ── */
  const areasEl = document.getElementById('visionAreas');
  VISION_AREAS.forEach(area => {
    areasEl.innerHTML += `
      <div class="vision-area" style="margin-bottom:14px">
        <div class="vision-area-header">
          <div class="vision-area-icon">${area.icon}</div>
          <div class="vision-area-title">${area.name}</div>
        </div>
        <div class="vision-columns">
          <div class="vision-col">
            <div class="vision-col-label">Dream Big</div>
            ${area.dream.map(d=>`<div class="vision-item">${d}</div>`).join('')}
          </div>
          <div class="vision-col">
            <div class="vision-col-label">1-Year Goal</div>
            ${area.oneYear.map(g=>`<div class="vision-item">${g}</div>`).join('')}
          </div>
          <div class="vision-col">
            <div class="vision-col-label">90-Day Focus</div>
            ${area.focus.map(f=>`<div class="vision-item">${f}</div>`).join('')}
          </div>
        </div>
      </div>`;
  });
});
