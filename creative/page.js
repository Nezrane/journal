/**
 * KOLTYN OS — creative/page.js
 * Songs, setlists, guitar practice log, songwriting notes.
 * Country-style acoustic — bar performances.
 *
 * NOTE: This is the last page module loaded. The boot() call at the
 * bottom navigates to the correct page once all modules are registered.
 */

window.registerPage('creative', function initCreative() {

  /* ── Song library ── */
  const SONGS = [
    /* Covers — Ready */
    { title:'Wagon Wheel',            artist:'Old Crow Medicine Show / Darius Rucker', key:'G', status:'ready',    tags:['Crowd Favourite','Opener','Easy Sing-Along'] },
    { title:'Take Me Home, Country Roads', artist:'John Denver',                      key:'G', status:'ready',    tags:['Crowd Favourite','Closer','High Energy'] },
    { title:'Friends in Low Places',  artist:'Garth Brooks',                           key:'Bb',status:'ready',    tags:['Bar Classic','Singalong'] },
    { title:'The House That Built Me', artist:'Miranda Lambert',                       key:'C', status:'ready',    tags:['Emotional','Mid-Set'] },
    { title:'Chicken Fried',          artist:'Zac Brown Band',                         key:'G', status:'ready',    tags:['Feel Good','Mid-Set'] },
    { title:'Tennessee Whiskey',      artist:'Chris Stapleton',                        key:'A', status:'ready',    tags:['Show Stopper','Smooth'] },
    { title:'Fast Car',               artist:'Tracy Chapman',                          key:'C', status:'ready',    tags:['Crossover','Quiet Moment'] },
    { title:'Jolene',                 artist:'Dolly Parton',                           key:'Dm',status:'ready',    tags:['Classic','Emotional'] },
    /* Covers — Learning */
    { title:'Whiskey Glasses',        artist:'Morgan Wallen',                          key:'C', status:'learning', tags:['Modern Country','Up-Beat'] },
    { title:'Buy Dirt',               artist:'Jordan Davis',                           key:'G', status:'learning', tags:['Modern Country','Story'] },
    { title:'Seven Bridges Road',     artist:'Eagles',                                 key:'D', status:'learning', tags:['A Cappella Intro','Harmony'] },
    { title:'When the Stars Go Blue', artist:'Ryan Adams',                             key:'D', status:'learning', tags:['Late Night Vibe','Slow'] },
    /* Originals */
    { title:'Rodeo Bones',            artist:'Original',                               key:'G', status:'original', tags:['Story Song','Verse-Chorus','Demo Ready'] },
    { title:'Sixty Miles of Nothing', artist:'Original',                               key:'Am',status:'original', tags:['Fingerpick','Lyric-Heavy','Work In Progress'] },
    { title:'Four Walls and a Flag',  artist:'Original',                               key:'D', status:'original', tags:['Patriotic','Slow Burn','Needs Bridge'] },
  ];

  /* ── Active setlist (30-min bar set) ── */
  const SETLIST = [
    { song:'Wagon Wheel',                  key:'G',  notes:'Opens strong — get the room warmed up' },
    { song:'Chicken Fried',                key:'G',  notes:'Keep energy up, no key change needed' },
    { song:'Tennessee Whiskey',            key:'A',  notes:'Slow it down — let voice carry' },
    { song:'Fast Car',                     key:'C',  notes:'Crossover appeal — quiet and focused' },
    { song:'Friends in Low Places',        key:'Bb', notes:'Bar singalong — get them involved' },
    { song:'Rodeo Bones (Original)',       key:'G',  notes:'Plug original — "this one\'s mine"' },
    { song:'Take Me Home, Country Roads',  key:'G',  notes:'Closer — everyone sings, end strong' },
  ];

  /* ── Practice log ── */
  const PRACTICE = [
    { icon:'🎸', title:'Fingerpicking Pattern — Travis Pick',  detail:'12 min daily. Start slow (60 BPM), build to 120. Apply to "Sixty Miles of Nothing".', priority:'high' },
    { icon:'🎤', title:'Vocal Warmup Routine',                 detail:'10 min before every session. Lip trills, sirens, 1-3-5 scales. Don\'t skip this.', priority:'high' },
    { icon:'🎵', title:'Capo Chord Transitions — Key of D',    detail:'D → G → A → Bm at 80 BPM clean before adding capo shapes. 15 min.', priority:'medium' },
    { icon:'📝', title:'Lyric Writing — 15 min stream of consciousness', detail:'Write without editing. Mine for phrases, images, lines. One session/day minimum.', priority:'medium' },
    { icon:'🔄', title:'Barre Chord F Shape — Clean Tone',     detail:'5 min mute-and-strum drill. First string must ring clean every time.', priority:'low' },
    { icon:'🎙️', title:'Record a Phone Demo',                  detail:'One rough voice memo per original per week. Listen back after 24 hours.', priority:'low' },
  ];

  /* ── Songwriting goals ── */
  const WRITING_GOALS = [
    { label:'Songs in Library',    current:15, target:50, unit:'songs' },
    { label:'Originals',           current:3,  target:10, unit:'originals' },
    { label:'Demo-Ready Originals',current:1,  target:5,  unit:'demos' },
    { label:'Sets Performed',      current:0,  target:20, unit:'gigs' },
  ];

  /* ── Build HTML ── */
  const inner = document.getElementById('creative-inner');
  inner.innerHTML = `
    ${buildPageHeader('Guitar · Songwriting · Performance', 'Creative', 'Studio',
      'Acoustic country. Bar performances. Write the songs only you can write.',
      `<span class="badge badge-accent">15 Songs · 3 Originals</span>`
    )}

    <!-- Stats row -->
    <div class="grid-4" id="creativeStats"></div>

    <!-- Active Setlist + Practice side by side -->
    <div class="grid-2">
      <div class="card">
        <div class="card-header" style="display:flex;align-items:center;justify-content:space-between">
          <div class="card-title">Active Setlist — 30 Min Bar Set</div>
          <span class="badge badge-accent">${SETLIST.length} songs</span>
        </div>
        <div class="card-body" style="padding:0">
          <div id="setlistContainer"></div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">Practice Routine</div></div>
        <div class="card-body" style="padding:8px 14px">
          <div id="practiceContainer"></div>
        </div>
      </div>
    </div>

    <!-- Song library -->
    <div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <div class="section-label" style="margin-bottom:0">Song Library</div>
        <div style="display:flex;gap:8px">
          <button class="day-tab active" id="filterAll"   onclick="filterSongs('all')">All</button>
          <button class="day-tab"        id="filterReady"    onclick="filterSongs('ready')">Ready</button>
          <button class="day-tab"        id="filterLearning" onclick="filterSongs('learning')">Learning</button>
          <button class="day-tab"        id="filterOriginal" onclick="filterSongs('original')">Originals</button>
        </div>
      </div>
      <div class="grid-3" id="songGrid"></div>
    </div>

    <!-- Songwriting notes -->
    <div class="grid-2">
      <div class="card">
        <div class="card-header"><div class="card-title">Progress Toward Goals</div></div>
        <div class="card-body" id="writingGoals"></div>
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">Performance Notes</div></div>
        <div class="card-body">
          ${[
            ['Stage Presence',   'Move between songs with brief stories. Don\'t just play — connect. 1 sentence per song intro.'],
            ['Tuning',           'Always tune before hitting the stage, even if you just tuned backstage. Audience notices.'],
            ['Set Energy Arc',   'Open with a known crowd song, build to a quiet emotional moment mid-set, finish huge.'],
            ['Originals Strategy','Introduce originals as "a song I wrote" — brief, confident, no apologising. Then play it.'],
            ['Handling Requests', 'Keep a mental list of 3 unplanned songs you can pull out. Confidence matters more than perfection.'],
          ].map(([t,b])=>`
            <div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.04)">
              <div style="font-family:'Rajdhani',sans-serif;font-size:12px;font-weight:700;color:var(--accent);margin-bottom:3px">${t}</div>
              <div style="font-size:12px;color:rgba(226,234,242,0.72);line-height:1.55">${b}</div>
            </div>`).join('')}
        </div>
      </div>
    </div>`;

  /* ── Stats ── */
  const stats = [
    { label:'Songs Ready',   value: SONGS.filter(s=>s.status==='ready').length,    unit:'' },
    { label:'Learning',      value: SONGS.filter(s=>s.status==='learning').length, unit:'' },
    { label:'Originals',     value: SONGS.filter(s=>s.status==='original').length, unit:'' },
    { label:'Set Length',    value:'30',                                             unit:'min' },
  ];
  const statsEl = document.getElementById('creativeStats');
  stats.forEach(s => {
    statsEl.innerHTML += `
      <div class="stat-card">
        <div class="stat-label">${s.label}</div>
        <div style="display:flex;align-items:baseline;gap:3px">
          <span class="stat-value">${s.value}</span>
          ${s.unit ? `<span class="stat-unit">${s.unit}</span>` : ''}
        </div>
      </div>`;
  });

  /* ── Setlist ── */
  const setlistEl = document.getElementById('setlistContainer');
  SETLIST.forEach((slot, i) => {
    setlistEl.innerHTML += `
      <div class="setlist-slot">
        <div class="setlist-num">${i+1}</div>
        <div>
          <div class="setlist-song">${slot.song}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:1px">${slot.notes}</div>
        </div>
        <div class="setlist-key">Key of ${slot.key}</div>
      </div>`;
  });

  /* ── Practice ── */
  const practiceEl = document.getElementById('practiceContainer');
  PRACTICE.forEach(p => {
    practiceEl.innerHTML += `
      <div class="practice-item">
        <div class="practice-icon">${p.icon}</div>
        <div class="practice-content">
          <div class="practice-title">${p.title}
            <span class="badge badge-${p.priority==='high'?'warn':p.priority==='medium'?'accent':'muted'}" style="margin-left:6px">${p.priority}</span>
          </div>
          <div class="practice-detail">${p.detail}</div>
        </div>
      </div>`;
  });

  /* ── Song grid ── */
  let currentFilter = 'all';
  window.filterSongs = function(filter) {
    currentFilter = filter;
    ['All','Ready','Learning','Original'].forEach(f => {
      const btn = document.getElementById('filter' + (f==='All'?'All':f.charAt(0).toUpperCase()+f.slice(1)));
      if (btn) btn.classList.toggle('active', filter === f.toLowerCase() || (filter==='all' && f==='All'));
    });
    renderSongs();
  };

  function renderSongs() {
    const grid = document.getElementById('songGrid');
    const filtered = currentFilter === 'all' ? SONGS : SONGS.filter(s => s.status === currentFilter);
    grid.innerHTML = '';
    filtered.forEach(song => {
      grid.innerHTML += `
        <div class="song-card ${song.status === 'original' ? 'performing' : ''}">
          <div class="song-header">
            <div>
              <div class="song-title">${song.title}</div>
              <div style="font-size:11px;color:var(--muted);margin-top:1px">${song.artist}</div>
            </div>
            <span class="song-status ${song.status}">${song.status === 'original' ? 'Original' : song.status}</span>
          </div>
          <div class="song-meta">
            <span class="song-tag">Key of ${song.key}</span>
            ${song.tags.map(t=>`<span class="song-tag">${t}</span>`).join('')}
          </div>
        </div>`;
    });
  }

  /* ── Writing goals ── */
  const goalsEl = document.getElementById('writingGoals');
  WRITING_GOALS.forEach(g => {
    goalsEl.innerHTML += `
      <div style="margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px">
          <span style="font-size:13px;font-weight:500">${g.label}</span>
          <span style="font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700;color:var(--accent)">${g.current} <span style="color:var(--muted);font-weight:400">/ ${g.target} ${g.unit}</span></span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width:${progressPct(g.current, g.target)}"></div>
        </div>
      </div>`;
  });

  renderSongs();
});

/*
 * BOOT — all page modules are now registered.
 * Read the URL hash and navigate to the right page (or dashboard by default).
 */
(function boot() {
  const hash  = window.location.hash.replace('#', '');
  const valid = ['dashboard','nutrition','workout','business','wealth','creative'];
  navigateTo(valid.includes(hash) ? hash : 'dashboard');
})();
