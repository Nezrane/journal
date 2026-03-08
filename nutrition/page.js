/**
 * KOLTYN OS — nutrition/page.js
 *
 * DATA FLOW
 *   APP_DATA.nutrition  → base meal options (read-only templates)
 *   STATE.data.nutrition → live selections + custom meals (persisted to IDB)
 *
 * KEY FEATURES
 *   • Meal slots scroll horizontally on mobile
 *   • Up to 10 custom meals per slot (via "+ Add Meal" modal)
 *   • Whole Foods section — top nutrient-dense options by category
 *   • Health Principles — static principles section
 *   • Phase selection and macro summary all write back to STATE
 */

window.registerPage('nutrition', function initNutrition() {

  /* ── Base data ── */
  const BASE_PHASES     = APP_DATA.nutrition.phases;
  const BASE_MEALS      = APP_DATA.nutrition.meals;
  const MEAL_TITLES     = APP_DATA.nutrition.mealTitles;
  const ns              = STATE.data.nutrition;

  /* Merge: base meals + any custom meals the user has added */
  function getMeals(phase) {
    const base   = BASE_MEALS[phase];
    const custom = ns.customMeals[phase] || [[], [], [], []];
    return base.map((slot, i) => [...slot, ...(custom[i] || [])]);
  }

  let currentPhase  = ns.currentPhase || 'bulk';
  let selectedMeals = ns.selectedMeals[currentPhase] ? [...ns.selectedMeals[currentPhase]] : [null, null, null, null];
  const recipeCache = {};

  /* ── Page shell ── */
  const inner = document.getElementById('nutrition-inner');
  inner.innerHTML = `
    ${buildPageHeader('Daily Planner', 'Nutrition', 'Dashboard',
      'Select one option per meal — all combinations hit your daily target exactly.',
      `<div class="legend">
         <div class="legend-item"><div class="legend-dot" style="background:var(--simple)"></div>Simple</div>
         <div class="legend-item"><div class="legend-dot" style="background:var(--premade)"></div>Premade</div>
         <div class="legend-item"><div class="legend-dot" style="background:var(--gourmet)"></div>Gourmet</div>
       </div>
       <div class="phase-label">Phase</div>
       <select class="app-select" id="phaseSelect">
         <option value="bulk">Bulk</option>
         <option value="maintain">Maintain</option>
         <option value="cut">Cut</option>
       </select>`
    )}

    <!-- Targets card -->
    <div class="targets-card" id="targetsCard">
      <div class="targets-info">
        <div class="targets-title">Daily Target</div>
        <div class="targets-phase-name" id="phaseName">Bulk</div>
      </div>
      <div class="targets-divider"></div>
      <div class="targets-macros">
        <div class="macro-target calories"><div class="macro-target-label">Calories</div><div class="macro-target-val" id="tCal">—<span>kcal</span></div></div>
        <div class="macro-target protein"><div class="macro-target-label">Protein</div><div class="macro-target-val" id="tPro">—<span>g</span></div></div>
        <div class="macro-target carbs"><div class="macro-target-label">Carbs</div><div class="macro-target-val" id="tCarb">—<span>g</span></div></div>
        <div class="macro-target fats"><div class="macro-target-label">Fats</div><div class="macro-target-val" id="tFat">—<span>g</span></div></div>
      </div>
    </div>

    <!-- Meals -->
    <div>
      <div class="meals-section-title">Select one per meal slot — tap ⓘ for recipe &amp; cultural history</div>
      <div class="meals-grid" id="mealsGrid"></div>
    </div>

    <!-- Summary -->
    <div class="summary-card">
      <div class="summary-header">
        <div class="summary-title">Daily Macro Summary</div>
        <div class="match-badge" id="matchBadge">
          <div class="checkmark"><svg viewBox="0 0 8 8" fill="none"><polyline points="1,4 3,6 7,2" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg></div>
          Macros perfectly matched ✓
        </div>
      </div>
      <div class="summary-macros">
        <div class="summary-macro sm-cal" id="smCal">
          <div class="sm-label">Calories</div>
          <div class="sm-row"><span class="sm-current" id="sCal">0</span><span class="sm-unit">kcal</span><span class="sm-target" id="stCal">/ —</span></div>
          <div class="sm-bar-track"><div class="sm-bar-fill" id="bCal" style="width:0%"></div></div>
        </div>
        <div class="summary-macro sm-pro" id="smPro">
          <div class="sm-label">Protein</div>
          <div class="sm-row"><span class="sm-current" id="sPro">0</span><span class="sm-unit">g</span><span class="sm-target" id="stPro">/ —</span></div>
          <div class="sm-bar-track"><div class="sm-bar-fill" id="bPro" style="width:0%"></div></div>
        </div>
        <div class="summary-macro sm-carb" id="smCarb">
          <div class="sm-label">Carbs</div>
          <div class="sm-row"><span class="sm-current" id="sCarb">0</span><span class="sm-unit">g</span><span class="sm-target" id="stCarb">/ —</span></div>
          <div class="sm-bar-track"><div class="sm-bar-fill" id="bCarb" style="width:0%"></div></div>
        </div>
        <div class="summary-macro sm-fat" id="smFat">
          <div class="sm-label">Fats</div>
          <div class="sm-row"><span class="sm-current" id="sFat">0</span><span class="sm-unit">g</span><span class="sm-target" id="stFat">/ —</span></div>
          <div class="sm-bar-track"><div class="sm-bar-fill" id="bFat" style="width:0%"></div></div>
        </div>
      </div>
    </div>

    <!-- Whole Foods section -->
    <div class="section-label">Whole Foods Reference</div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:14px">Top nutrient-dense options. Build meals around these.</div>
    <div id="wholeFoodsGrid"></div>

    <!-- Health Principles -->
    <div class="section-label" style="margin-top:8px">Nutrition Principles</div>
    <div class="grid-2" id="nutritionPrinciples"></div>`;

  /* ── Set saved phase on select ── */
  document.getElementById('phaseSelect').value = currentPhase;

  /* ── Recipe modal ── */
  const overlay   = document.getElementById('modalOverlay');
  const modalBody = document.getElementById('modalBody');
  const modalEl   = document.querySelector('#page-nutrition .modal');

  function catClass(c) { return c==='Simple'?'cat-simple':c==='Premade'?'cat-premade':'cat-gourmet'; }

  function openModal(opt) {
    document.getElementById('modalEyebrow').textContent    = opt.cuisine + ' · ' + opt.category;
    document.getElementById('modalTitle').textContent      = opt.name;
    document.getElementById('modalCuisineTag').textContent = opt.cuisine;
    document.getElementById('mCalChip').textContent        = opt.calories + ' kcal';
    document.getElementById('mProChip').textContent        = opt.protein  + 'g Protein';
    document.getElementById('mCarbChip').textContent       = opt.carbs    + 'g Carbs';
    document.getElementById('mFatChip').textContent        = opt.fats     + 'g Fat';
    const cb = document.getElementById('modalCatBadge');
    cb.textContent = opt.category;
    cb.className   = 'category-badge ' + catClass(opt.category);
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    fetchRecipe(opt);
  }

  function closeModal() {
    if (modalEl) { modalEl.style.transform=''; modalEl.style.transition=''; }
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  overlay.addEventListener('click', e => { if(e.target===overlay) closeModal(); });
  document.addEventListener('keydown', e => { if(e.key==='Escape') closeModal(); });
  document.getElementById('modalClose').addEventListener('click', closeModal);
  setupSwipeDismiss(modalEl, closeModal);

  async function fetchRecipe(opt) {
    const key = opt.name + '||' + opt.cuisine;
    if (recipeCache[key]) { renderRecipe(recipeCache[key]); return; }
    modalBody.innerHTML = `<div class="modal-loading"><div class="spinner"></div><div class="loading-text">Fetching Recipe</div><div class="loading-sub">Ingredients, directions &amp; cultural history…</div></div>`;
    const prompt = `You are an expert chef and food historian. Generate a detailed recipe card for: "${opt.name}" (${opt.cuisine} cuisine, ${opt.category}, ${opt.calories} kcal, ${opt.protein}g protein, ${opt.carbs}g carbs, ${opt.fats}g fat). Return ONLY valid JSON, no markdown: {"description":"2-3 vivid sentences","history":"3-4 sentences on cultural origin","ingredients":[{"name":"","amount":""}],"directions":["step"]}. 7-11 ingredients, 4-6 steps.`;
    try {
      const res  = await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,messages:[{role:'user',content:prompt}]})});
      if(!res.ok) throw new Error('API '+res.status);
      const data = await res.json();
      const raw  = data.content.map(b=>b.text||'').join('').trim().replace(/^```[a-z]*\n?/,'').replace(/\n?```$/,'').trim();
      const recipe = JSON.parse(raw);
      recipeCache[key] = recipe;
      renderRecipe(recipe);
    } catch(err) {
      modalBody.innerHTML = `<div class="modal-error"><span class="err-icon">⚠</span>Could not load recipe details.<br><small style="opacity:.4;font-size:11px">${err.message}</small></div>`;
    }
  }

  function renderRecipe(r) {
    const ing   = (r.ingredients||[]).map(i=>`<div class="ingredient-item"><div class="ingredient-dot"></div><div class="ingredient-name">${i.name}</div><div class="ingredient-amount">${i.amount}</div></div>`).join('');
    const steps = (r.directions||[]).map((s,i)=>`<div class="direction-step"><div class="step-num">${i+1}</div><div class="step-text">${s}</div></div>`).join('');
    modalBody.innerHTML = `
      <div class="modal-section"><div class="modal-section-label">About This Dish</div><div class="description-text">${r.description||'—'}</div></div>
      <div class="modal-section"><div class="modal-section-label">Cultural History</div><div class="history-text">${r.history||'—'}</div></div>
      <div class="modal-section"><div class="modal-section-label">Ingredients</div><div class="ingredients-grid">${ing}</div></div>
      <div class="modal-section"><div class="modal-section-label">Directions</div><div class="directions-list">${steps}</div></div>`;
  }

  /* ── Add custom meal modal ── */
  let addingMealSlot = null;

  function openAddMealModal(slotIdx) {
    addingMealSlot = slotIdx;
    /* Reuse existing modal structure with a form */
    document.getElementById('modalEyebrow').textContent    = 'Custom Meal';
    document.getElementById('modalTitle').textContent      = MEAL_TITLES[slotIdx];
    document.getElementById('modalCuisineTag').textContent = '';
    document.getElementById('mCalChip').textContent        = '';
    document.getElementById('mProChip').textContent        = '';
    document.getElementById('mCarbChip').textContent       = '';
    document.getElementById('mFatChip').textContent        = '';
    document.getElementById('modalCatBadge').textContent   = 'Custom';
    document.getElementById('modalCatBadge').className     = 'category-badge cat-gourmet';
    modalBody.innerHTML = `
      <div class="modal-section">
        <div class="modal-section-label">Add a Custom Meal Option</div>
        <div style="display:flex;flex-direction:column;gap:10px;margin-top:8px">
          <input class="form-input" id="cmName"     placeholder="Meal name" />
          <input class="form-input" id="cmCuisine"  placeholder="Cuisine (e.g. American)" />
          <select class="app-select" id="cmCat">
            <option value="Simple">Simple</option>
            <option value="Premade">Premade</option>
            <option value="Gourmet">Gourmet</option>
          </select>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <input class="form-input" id="cmCal"  type="number" placeholder="Calories" style="flex:1;min-width:80px" />
            <input class="form-input" id="cmPro"  type="number" placeholder="Protein g" style="flex:1;min-width:80px" />
            <input class="form-input" id="cmCarb" type="number" placeholder="Carbs g" style="flex:1;min-width:80px" />
            <input class="form-input" id="cmFat"  type="number" placeholder="Fat g" style="flex:1;min-width:80px" />
          </div>
          <button class="day-tab active" id="saveCm" style="padding:10px">Add Meal Option</button>
          <div id="cmError" style="color:var(--danger);font-size:12px;display:none"></div>
        </div>
      </div>`;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    document.getElementById('saveCm').addEventListener('click', () => {
      const name = document.getElementById('cmName').value.trim();
      const cal  = parseInt(document.getElementById('cmCal').value) || 0;
      const pro  = parseInt(document.getElementById('cmPro').value) || 0;
      const carb = parseInt(document.getElementById('cmCarb').value) || 0;
      const fat  = parseInt(document.getElementById('cmFat').value) || 0;
      const errEl = document.getElementById('cmError');
      if (!name || !cal) { errEl.textContent = 'Name and calories are required.'; errEl.style.display='block'; return; }
      STATE.addCustomMeal(currentPhase, addingMealSlot, {
        name,
        category: document.getElementById('cmCat').value,
        cuisine:  document.getElementById('cmCuisine').value.trim() || 'Custom',
        calories: cal, protein: pro, carbs: carb, fats: fat,
      });
      closeModal();
      renderPhase();
    });
  }

  /* ── Render phase ── */
  function renderPhase() {
    const ph = BASE_PHASES[currentPhase];
    selectedMeals = ns.selectedMeals[currentPhase] ? [...ns.selectedMeals[currentPhase]] : [null, null, null, null];

    document.getElementById('phaseName').textContent   = ph.name;
    document.getElementById('tCal').innerHTML  = ph.calories+'<span>kcal</span>';
    document.getElementById('tPro').innerHTML  = ph.protein +'<span>g</span>';
    document.getElementById('tCarb').innerHTML = ph.carbs   +'<span>g</span>';
    document.getElementById('tFat').innerHTML  = ph.fats    +'<span>g</span>';
    document.getElementById('stCal').textContent  = '/ '+ph.calories;
    document.getElementById('stPro').textContent  = '/ '+ph.protein+'g';
    document.getElementById('stCarb').textContent = '/ '+ph.carbs+'g';
    document.getElementById('stFat').textContent  = '/ '+ph.fats+'g';

    const allMeals = getMeals(currentPhase);
    const grid = document.getElementById('mealsGrid');
    grid.innerHTML = '';

    allMeals.forEach((opts, mi) => {
      /* Cap at 10 visible options */
      const visible = opts.slice(0, 10);
      const card = document.createElement('div');
      card.className = 'meal-card';
      card.innerHTML = `
        <div class="meal-card-header">
          <div class="meal-card-number">Slot ${mi+1}</div>
          <div class="meal-card-title">${MEAL_TITLES[mi]}</div>
          <button class="day-tab add-meal-btn" data-slot="${mi}" style="margin-left:auto;font-size:11px;padding:4px 10px">+ Custom</button>
        </div>
        <!-- Horizontal scroll on mobile, wrap on desktop -->
        <div class="meal-options-scroll" id="nl-${mi}"></div>`;
      grid.appendChild(card);

      const list = card.querySelector(`#nl-${mi}`);
      visible.forEach((opt, oi) => {
        const item = document.createElement('div');
        item.className = 'meal-option';
        if (selectedMeals[mi] === oi) item.classList.add('selected');
        item.innerHTML = `
          <div class="meal-option-top">
            <div class="meal-option-name">${opt.name}</div>
            <div class="category-badge ${catClass(opt.category)}">${opt.category}</div>
          </div>
          <div class="meal-option-bottom">
            <span class="cuisine-tag">${opt.cuisine}</span>
            <div class="meal-macros">
              <span class="mm mm-cal">${opt.calories}kcal</span>
              <span class="mm mm-p">${opt.protein}P</span>
              <span class="mm mm-c">${opt.carbs}C</span>
              <span class="mm mm-f">${opt.fats}F</span>
            </div>
            <button class="info-btn">i</button>
          </div>`;
        item.addEventListener('click', e => { if(e.target.classList.contains('info-btn')) return; selectMeal(mi, oi, item); });
        item.querySelector('.info-btn').addEventListener('click', e => { e.stopPropagation(); openModal(opt); });
        list.appendChild(item);
      });

      /* + Custom button */
      card.querySelector('.add-meal-btn').addEventListener('click', () => {
        if (opts.length >= 10) { alert('Maximum 10 meal options per slot reached.'); return; }
        openAddMealModal(mi);
      });
    });

    updateSummary();
  }

  function selectMeal(mi, oi, el) {
    document.querySelectorAll(`#nl-${mi} .meal-option`).forEach(o => o.classList.remove('selected'));
    selectedMeals[mi] = selectedMeals[mi] === oi ? null : oi;
    if (selectedMeals[mi] !== null) el.classList.add('selected');
    STATE.selectMeal(currentPhase, mi, selectedMeals[mi]);
    updateSummary();
  }

  function updateSummary() {
    let cal=0, pro=0, carb=0, fat=0, cnt=0;
    const allMeals = getMeals(currentPhase);
    const ph = BASE_PHASES[currentPhase];
    selectedMeals.forEach((oi, mi) => {
      if (oi !== null) { const o = allMeals[mi][oi]; cal+=o.calories; pro+=o.protein; carb+=o.carbs; fat+=o.fats; cnt++; }
    });
    document.getElementById('sCal').textContent  = cal;
    document.getElementById('sPro').textContent  = pro;
    document.getElementById('sCarb').textContent = carb;
    document.getElementById('sFat').textContent  = fat;
    document.getElementById('bCal').style.width  = Math.min(100,(cal/ph.calories)*100)+'%';
    document.getElementById('bPro').style.width  = Math.min(100,(pro/ph.protein) *100)+'%';
    document.getElementById('bCarb').style.width = Math.min(100,(carb/ph.carbs)  *100)+'%';
    document.getElementById('bFat').style.width  = Math.min(100,(fat/ph.fats)    *100)+'%';
    const badge = document.getElementById('matchBadge');
    badge.className = 'match-badge';
    if (cnt === 4) {
      if (cal===ph.calories && pro===ph.protein && carb===ph.carbs && fat===ph.fats) {
        badge.classList.add('perfect');
        badge.innerHTML = `<div class="checkmark"><svg viewBox="0 0 8 8" fill="none"><polyline points="1,4 3,6 7,2" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg></div> Macros perfectly matched ✓`;
      } else {
        badge.classList.add('mismatch');
        const d = cal - ph.calories;
        badge.innerHTML = `&#9888; ${d>0?'+':''}${d} kcal from target`;
      }
    }
    ['Cal','Pro','Carb','Fat'].forEach(k => {
      const el = document.getElementById('sm'+k);
      const c  = k==='Cal'?cal:k==='Pro'?pro:k==='Carb'?carb:fat;
      const t  = k==='Cal'?ph.calories:k==='Pro'?ph.protein:k==='Carb'?ph.carbs:ph.fats;
      el.classList.remove('matched','over');
      if (cnt === 4) el.classList.add(c===t?'matched':c>t?'over':'');
    });
  }

  /* ── Phase selector ── */
  document.getElementById('phaseSelect').addEventListener('change', e => {
    currentPhase = e.target.value;
    STATE.setNutritionPhase(currentPhase);
    renderPhase();
  });

  /* ── Whole Foods section ── */
  const wfGrid = document.getElementById('wholeFoodsGrid');
  (APP_DATA.wholeFoods || []).forEach(cat => {
    const topItems  = cat.items.filter(i => i.top);
    const restItems = cat.items.filter(i => !i.top);
    wfGrid.innerHTML += `
      <div class="card" style="margin-bottom:14px">
        <div class="card-header" style="display:flex;align-items:center;gap:10px">
          <span style="font-size:20px">${cat.icon}</span>
          <div class="card-title">${cat.category}</div>
        </div>
        <div class="card-body" style="padding:8px 16px">
          ${topItems.length ? `
            <div style="font-family:'Rajdhani',sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--warn);margin-bottom:6px">⭐ Top Picks</div>
            ${topItems.map(item => wfItemHTML(item, true)).join('')}
            ${restItems.length ? '<div style="height:1px;background:var(--border);margin:10px 0"></div>' : ''}` : ''}
          ${restItems.map(item => wfItemHTML(item, false)).join('')}
        </div>
      </div>`;
  });

  function wfItemHTML(item, isTop) {
    return `
      <div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
        <div style="flex:1">
          <div style="font-size:13px;font-weight:${isTop?'600':'400'};color:${isTop?'var(--text)':'rgba(226,234,242,0.8)'};">${item.name}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:2px">${item.highlight}</div>
          <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">
            ${item.tags.map(t=>`<span style="font-size:10px;padding:2px 7px;border-radius:10px;background:rgba(255,255,255,0.05);color:var(--muted)">${t}</span>`).join('')}
          </div>
        </div>
      </div>`;
  }

  /* ── Health Principles ── */
  const prEl = document.getElementById('nutritionPrinciples');
  (APP_DATA.healthPrinciples?.nutrition || []).forEach(p => {
    prEl.innerHTML += `
      <div style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
        <div style="font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700;color:var(--accent);margin-bottom:4px">${p.title}</div>
        <div style="font-size:12px;color:rgba(226,234,242,0.72);line-height:1.6">${p.body}</div>
      </div>`;
  });

  renderPhase();
});
