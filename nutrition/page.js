/**
 * KOLTYN OS — nutrition/page.js
 *
 * DATA FLOW
 *   APP_DATA.nutrition  → base meal options per phase (read-only)
 *   APP_DATA.wholeFoods → whole foods reference categories (read-only)
 *   APP_DATA.healthPrinciples.nutrition → static principles (read-only)
 *
 *   STATE.data.nutrition → currentPhase, selectedMeals, customMeals (read + write)
 *
 * WRITES TO STATE → IDB
 *   STATE.setNutritionPhase(phase)              → nutrition.currentPhase
 *   STATE.selectMeal(phase, slotIdx, mealIdx)   → nutrition.selectedMeals
 *   STATE.addCustomMeal(phase, slotIdx, mealObj) → nutrition.customMeals
 *   STATE.removeCustomMeal(phase, slotIdx, idx)  → nutrition.customMeals
 *   All mutators call save() which writes to IndexedDB asynchronously.
 *
 * REMOVE BUTTONS
 *   Base meals: clicking a selected meal deselects it (toggle already in place).
 *   Custom meals: a permanent × delete button removes the meal from STATE/IDB.
 *
 * WHOLE FOODS
 *   All categories shown in one compact multi-column grid (not separate cards).
 */

window.registerPage('nutrition', function initNutrition() {

  /* ── Base data (read-only) ── */
  const BASE_PHASES = APP_DATA.nutrition.phases;
  const BASE_MEALS  = APP_DATA.nutrition.meals;
  const MEAL_TITLES = APP_DATA.nutrition.mealTitles;
  const ns          = STATE.data.nutrition;

  /* Merge base meals + user-added custom meals for the given phase.
     Base meals are always first; custom meals append at the end.
     The combined index is used for selectedMeals[phase][slotIdx]. */
  function getMeals(phase) {
    const base   = BASE_MEALS[phase];
    const custom = ns.customMeals[phase] || [[], [], [], []];
    return base.map((slot, i) => [...slot, ...(custom[i] || [])]);
  }

  /* Index at which custom meals start for a given phase + slot */
  function baseCount(phase, slotIdx) {
    return BASE_MEALS[phase][slotIdx].length;
  }

  let currentPhase  = ns.currentPhase || 'bulk';
  let selectedMeals = ns.selectedMeals[currentPhase]
    ? [...ns.selectedMeals[currentPhase]]
    : [null, null, null, null];

  const recipeCache = {};

  /* ── Page shell ── */
  const inner = document.getElementById('nutrition-inner');
  inner.innerHTML = `
    ${buildPageHeader('Daily Planner', 'Nutrition', 'Dashboard',
      'Select one option per meal slot — all combinations hit your daily target.',
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

    <!-- ── Macro summary pinned at top — targets + currently selected side by side ── -->
    <div class="card" id="macroSummaryCard">
      <div class="card-header" style="display:flex;align-items:center;justify-content:space-between">
        <div class="card-title">Daily Macro Summary</div>
        <div class="match-badge" id="matchBadge">
          <div class="checkmark"><svg viewBox="0 0 8 8" fill="none"><polyline points="1,4 3,6 7,2" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg></div>
          On target ✓
        </div>
      </div>
      <div class="card-body" style="padding:12px 16px">
        <div class="macro-summary-grid" id="macroSummaryGrid"></div>
      </div>
    </div>

    <!-- ── Meal slots ── -->
    <div>
      <div class="meals-section-title">Select one per meal slot — tap ⓘ for recipe &amp; cultural history</div>
      <div class="meals-grid" id="mealsGrid"></div>
    </div>

    <!-- ── Whole Foods reference — compact multi-column layout ── -->
    <div class="section-label">Whole Foods Reference</div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:12px">Top nutrient-dense options. Build meals around these.</div>
    <div class="card">
      <div class="card-body" style="padding:12px 16px">
        <div class="whole-foods-compact-grid" id="wholeFoodsCompact"></div>
      </div>
    </div>

    <!-- ── Nutrition Principles ── -->
    <div class="section-label" style="margin-top:8px">Nutrition Principles</div>
    <div class="grid-2" id="nutritionPrinciples"></div>`;

  /* ── Set saved phase ── */
  document.getElementById('phaseSelect').value = currentPhase;

  /* ── Recipe modal ── */
  const overlay   = document.getElementById('modalOverlay');
  const modalBody = document.getElementById('modalBody');
  const modalEl   = document.querySelector('#page-nutrition .modal');

  function catClass(c) {
    return c === 'Simple' ? 'cat-simple' : c === 'Premade' ? 'cat-premade' : 'cat-gourmet';
  }

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
    if (modalEl) { modalEl.style.transform = ''; modalEl.style.transition = ''; }
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  document.getElementById('modalClose').addEventListener('click', closeModal);
  setupSwipeDismiss(modalEl, closeModal);

  async function fetchRecipe(opt) {
    const key = opt.name + '||' + opt.cuisine;
    if (recipeCache[key]) { renderRecipe(recipeCache[key]); return; }
    modalBody.innerHTML = `<div class="modal-loading"><div class="spinner"></div><div class="loading-text">Fetching Recipe</div><div class="loading-sub">Ingredients, directions &amp; cultural history…</div></div>`;
    const prompt = `You are an expert chef and food historian. Generate a detailed recipe card for: "${opt.name}" (${opt.cuisine} cuisine, ${opt.category}, ${opt.calories} kcal, ${opt.protein}g protein, ${opt.carbs}g carbs, ${opt.fats}g fat). Return ONLY valid JSON, no markdown: {"description":"2-3 vivid sentences","history":"3-4 sentences on cultural origin","ingredients":[{"name":"","amount":""}],"directions":["step"]}. 7-11 ingredients, 4-6 steps.`;
    try {
      const res    = await fetch('https://api.anthropic.com/v1/messages', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:1000, messages:[{ role:'user', content:prompt }] }) });
      if (!res.ok) throw new Error('API ' + res.status);
      const data   = await res.json();
      const raw    = data.content.map(b => b.text || '').join('').trim().replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim();
      const recipe = JSON.parse(raw);
      recipeCache[key] = recipe;
      renderRecipe(recipe);
    } catch (err) {
      modalBody.innerHTML = `<div class="modal-error"><span class="err-icon">⚠</span>Could not load recipe details.<br><small style="opacity:.4;font-size:11px">${err.message}</small></div>`;
    }
  }

  function renderRecipe(r) {
    const ing   = (r.ingredients || []).map(i => `<div class="ingredient-item"><div class="ingredient-dot"></div><div class="ingredient-name">${i.name}</div><div class="ingredient-amount">${i.amount}</div></div>`).join('');
    const steps = (r.directions  || []).map((s, i) => `<div class="direction-step"><div class="step-num">${i+1}</div><div class="step-text">${s}</div></div>`).join('');
    modalBody.innerHTML = `
      <div class="modal-section"><div class="modal-section-label">About This Dish</div><div class="description-text">${r.description || '—'}</div></div>
      <div class="modal-section"><div class="modal-section-label">Cultural History</div><div class="history-text">${r.history || '—'}</div></div>
      <div class="modal-section"><div class="modal-section-label">Ingredients</div><div class="ingredients-grid">${ing}</div></div>
      <div class="modal-section"><div class="modal-section-label">Directions</div><div class="directions-list">${steps}</div></div>`;
  }

  /* ── Add custom meal modal ── */
  let addingMealSlot = null;

  function openAddMealModal(slotIdx) {
    addingMealSlot = slotIdx;
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
          <input class="form-input" id="cmName"    placeholder="Meal name" />
          <input class="form-input" id="cmCuisine" placeholder="Cuisine (e.g. American)" />
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
      const name  = document.getElementById('cmName').value.trim();
      const cal   = parseInt(document.getElementById('cmCal').value)  || 0;
      const pro   = parseInt(document.getElementById('cmPro').value)  || 0;
      const carb  = parseInt(document.getElementById('cmCarb').value) || 0;
      const fat   = parseInt(document.getElementById('cmFat').value)  || 0;
      const errEl = document.getElementById('cmError');
      if (!name || !cal) { errEl.textContent = 'Name and calories are required.'; errEl.style.display = 'block'; return; }
      /* STATE.addCustomMeal writes to STATE.data.nutrition.customMeals and saves to IDB */
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

  /* ══════════════════════════════════════════════════════════════
     RENDER PHASE — rebuilds meal grid + updates summary
  ══════════════════════════════════════════════════════════════ */
  function renderPhase() {
    const ph = BASE_PHASES[currentPhase];
    selectedMeals = ns.selectedMeals[currentPhase]
      ? [...ns.selectedMeals[currentPhase]]
      : [null, null, null, null];

    /* Update macro summary at top */
    updateSummary();

    const allMeals = getMeals(currentPhase);
    const grid     = document.getElementById('mealsGrid');
    grid.innerHTML = '';

    allMeals.forEach((opts, mi) => {
      const visible  = opts.slice(0, 10);
      const baseLen  = baseCount(currentPhase, mi);
      const card     = document.createElement('div');
      card.className = 'meal-card';
      card.innerHTML = `
        <div class="meal-card-header">
          <div class="meal-card-number">Slot ${mi + 1}</div>
          <div class="meal-card-title">${MEAL_TITLES[mi]}</div>
          <button class="day-tab add-meal-btn" data-slot="${mi}" style="margin-left:auto;font-size:11px;padding:4px 10px">+ Custom</button>
        </div>
        <div class="meal-options-scroll" id="nl-${mi}"></div>`;
      grid.appendChild(card);

      const list = card.querySelector(`#nl-${mi}`);
      visible.forEach((opt, oi) => {
        const isCustom   = oi >= baseLen;
        const customIdx  = oi - baseLen; /* index within customMeals[phase][mi] */
        const isSelected = selectedMeals[mi] === oi;

        const item = document.createElement('div');
        item.className = 'meal-option' + (isSelected ? ' selected' : '');
        item.innerHTML = `
          <div class="meal-option-top">
            <div class="meal-option-name">${opt.name}</div>
            <div style="display:flex;gap:4px;align-items:center">
              <div class="category-badge ${catClass(opt.category)}">${opt.category}</div>
              ${isCustom ? `<button class="meal-delete-btn" title="Remove this custom meal">×</button>` : ''}
            </div>
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

        /* Select / deselect by clicking the card (toggle) */
        item.addEventListener('click', e => {
          if (e.target.classList.contains('info-btn') ||
              e.target.classList.contains('meal-delete-btn')) return;
          selectMeal(mi, oi, item);
        });

        /* Recipe info button */
        item.querySelector('.info-btn').addEventListener('click', e => {
          e.stopPropagation();
          openModal(opt);
        });

        /* Delete custom meal — removes from STATE and re-renders */
        const delBtn = item.querySelector('.meal-delete-btn');
        if (delBtn) {
          delBtn.addEventListener('click', e => {
            e.stopPropagation();
            /* If this custom meal was selected, deselect first */
            if (selectedMeals[mi] === oi) {
              STATE.selectMeal(currentPhase, mi, null);
            }
            /* STATE.removeCustomMeal splices the array and saves to IDB */
            STATE.removeCustomMeal(currentPhase, mi, customIdx);
            renderPhase();
          });
        }

        list.appendChild(item);
      });

      /* + Custom button */
      card.querySelector('.add-meal-btn').addEventListener('click', () => {
        if (opts.length >= 10) { alert('Maximum 10 meal options per slot reached.'); return; }
        openAddMealModal(mi);
      });
    });
  }

  function selectMeal(mi, oi, el) {
    document.querySelectorAll(`#nl-${mi} .meal-option`).forEach(o => o.classList.remove('selected'));
    /* Toggle: clicking selected meal deselects it */
    selectedMeals[mi] = selectedMeals[mi] === oi ? null : oi;
    if (selectedMeals[mi] !== null) el.classList.add('selected');
    /* STATE.selectMeal writes to nutrition.selectedMeals[phase][slotIdx] and saves to IDB */
    STATE.selectMeal(currentPhase, mi, selectedMeals[mi]);
    updateSummary();
  }

  /* ══════════════════════════════════════════════════════════════
     MACRO SUMMARY — two-column layout: targets | selected
     Shown at the top of the page (always visible).
  ══════════════════════════════════════════════════════════════ */
  function updateSummary() {
    let cal = 0, pro = 0, carb = 0, fat = 0, cnt = 0;
    const allMeals = getMeals(currentPhase);
    const ph       = BASE_PHASES[currentPhase];
    selectedMeals.forEach((oi, mi) => {
      if (oi !== null && allMeals[mi][oi]) {
        const o = allMeals[mi][oi];
        cal += o.calories; pro += o.protein; carb += o.carbs; fat += o.fats;
        cnt++;
      }
    });

    const grid = document.getElementById('macroSummaryGrid');
    if (!grid) return;

    /* Two-column per macro: target | selected with fill bar */
    const macros = [
      { key:'cal',  label:'Calories', selected:cal,  target:ph.calories, unit:'kcal', color:'var(--accent3)' },
      { key:'pro',  label:'Protein',  selected:pro,  target:ph.protein,  unit:'g',    color:'#f5a623' },
      { key:'carb', label:'Carbs',    selected:carb, target:ph.carbs,    unit:'g',    color:'#42c4f5' },
      { key:'fat',  label:'Fats',     selected:fat,  target:ph.fats,     unit:'g',    color:'#c97bff' },
    ];

    grid.innerHTML = macros.map(m => {
      const pct   = m.target > 0 ? Math.min(100, (m.selected / m.target) * 100) : 0;
      const over  = m.selected > m.target;
      const exact = m.selected === m.target && cnt === 4;
      return `
        <div class="macro-summary-item">
          <div class="macro-summary-label">${m.label}</div>
          <div class="macro-summary-row">
            <span class="macro-summary-sel" style="color:${m.color}">${m.selected}<span class="macro-summary-unit">${m.unit}</span></span>
            <span class="macro-summary-target">/ ${m.target}${m.unit}</span>
          </div>
          <div class="macro-bar-track">
            <div class="macro-bar-fill" style="width:${pct}%;background:${m.color};opacity:${over ? '1' : '0.7'}"></div>
          </div>
        </div>`;
    }).join('');

    /* Match badge */
    const badge = document.getElementById('matchBadge');
    badge.className = 'match-badge';
    if (cnt === 4) {
      if (cal === ph.calories && pro === ph.protein && carb === ph.carbs && fat === ph.fats) {
        badge.classList.add('perfect');
        badge.innerHTML = `<div class="checkmark"><svg viewBox="0 0 8 8" fill="none"><polyline points="1,4 3,6 7,2" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg></div> Macros perfectly matched ✓`;
      } else {
        badge.classList.add('mismatch');
        const d = cal - ph.calories;
        badge.innerHTML = `&#9888; ${d > 0 ? '+' : ''}${d} kcal from target`;
      }
    }
  }

  /* ── Phase selector ── */
  document.getElementById('phaseSelect').addEventListener('change', e => {
    currentPhase = e.target.value;
    /* STATE.setNutritionPhase writes to nutrition.currentPhase and saves to IDB */
    STATE.setNutritionPhase(currentPhase);
    renderPhase();
  });

  /* ══════════════════════════════════════════════════════════════
     WHOLE FOODS — compact multi-column grid (all categories in one card)
  ══════════════════════════════════════════════════════════════ */
  const wfCompact = document.getElementById('wholeFoodsCompact');
  (APP_DATA.wholeFoods || []).forEach(cat => {
    const col = document.createElement('div');
    col.className = 'wf-col';
    col.innerHTML = `
      <div class="wf-col-header">
        <span style="font-size:16px">${cat.icon}</span>
        <span>${cat.category}</span>
      </div>
      ${cat.items.map(item => `
        <div class="wf-item${item.top ? ' wf-top' : ''}">
          <div class="wf-item-name">${item.name}${item.top ? ' ⭐' : ''}</div>
          <div class="wf-item-highlight">${item.highlight}</div>
        </div>`).join('')}`;
    wfCompact.appendChild(col);
  });

  /* ── Nutrition principles ── */
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
