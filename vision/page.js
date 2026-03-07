/**
 * KOLTYN OS — vision/page.js
 * 7 Life Areas — Dream Big / 1-Year Goal / 90-Day Focus
 */

window.registerPage('vision', function initVision() {

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

  /* ── Summary stats ── */
  const totalDreams = VISION_AREAS.reduce((acc, a) => acc + a.dream.length, 0);
  const totalGoals  = VISION_AREAS.reduce((acc, a) => acc + a.oneYear.length, 0);
  const totalFocus  = VISION_AREAS.reduce((acc, a) => acc + a.focus.length, 0);

  /* ── Build HTML ── */
  const inner = document.getElementById('vision-inner');
  inner.innerHTML = `
    ${buildPageHeader('Life Operating System', 'Vision', 'Board',
      'Dream Big → 1-Year Goals → 90-Day Focus. All seven areas. All at once.',
      `<span class="badge badge-accent">7 Life Areas</span>`
    )}

    <!-- Summary stats -->
    <div class="vision-summary">
      <div class="vision-summary-card">
        <div class="vision-summary-num">${totalDreams}</div>
        <div class="vision-summary-label">Dream Big Items</div>
      </div>
      <div class="vision-summary-card">
        <div class="vision-summary-num">${totalGoals}</div>
        <div class="vision-summary-label">1-Year Goals</div>
      </div>
      <div class="vision-summary-card">
        <div class="vision-summary-num">${totalFocus}</div>
        <div class="vision-summary-label">90-Day Actions</div>
      </div>
    </div>

    <!-- North Star -->
    <div style="background:linear-gradient(135deg,rgba(38,198,218,0.1) 0%,rgba(0,131,143,0.05) 100%);border:1px solid rgba(38,198,218,0.25);border-radius:var(--radius);padding:18px 22px">
      <div style="font-family:'Rajdhani',sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--accent);margin-bottom:8px">Overarching Goal</div>
      <div style="font-family:'Rajdhani',sans-serif;font-size:20px;font-weight:700;line-height:1.4;margin-bottom:12px">Build Envosta to $50K MRR · Get to 200 lbs and 15% body fat · Unlock Press to Handstand and Muscle Up</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${['$50K MRR','200 lbs','15% BF','Press to Handstand','Muscle Up'].map(p=>`<span style="font-family:'Rajdhani',sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;padding:4px 12px;border-radius:20px;border:1px solid rgba(38,198,218,0.3);color:var(--accent);background:rgba(38,198,218,0.08)">${p}</span>`).join('')}
      </div>
    </div>

    <!-- Vision areas -->
    <div id="visionAreas"></div>`;

  /* ── Render areas ── */
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

/*
 * BOOT — all page modules are now registered.
 * Read the URL hash and navigate to the right page (or dashboard by default).
 * This must run AFTER all registerPage() calls, which is why it lives here
 * at the bottom of the last script tag loaded by index.html.
 */
(function boot() {
  const hash = window.location.hash.replace('#', '');
  const valid = ['dashboard','nutrition','workout','business','wealth','creative','vision'];
  navigateTo(valid.includes(hash) ? hash : 'dashboard');
})();
