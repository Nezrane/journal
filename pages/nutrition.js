/**
 * KOLTYN OS — pages/nutrition.js
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

  let currentPhase  = ns.calcGoal || ns.currentPhase || 'maintain';
  let selectedMeals = ns.selectedMeals[currentPhase]
    ? [...ns.selectedMeals[currentPhase]]
    : [null, null, null, null];

  let activeTab = 'plan';

  const NUTRITION_TABS = [
    { id: 'plan',      label: 'Meal Plan' },
    { id: 'customize', label: 'Customize' },
  ];

  /* ── Page shell ── */
  const inner = document.getElementById('nutrition-inner');
  inner.innerHTML = `
    ${buildPageHeader('Whole Food Influenced', 'Nutrition', 'Dashboard',
      'Select one per meal slot — tap a meal to select, tap again to expand details.'
    )}

    <!-- ── Meal Plan tab ── -->
    <div id="nt-section-plan">

      <!-- Phase + macro progress -->
      <div class="card" id="mealPlanProgress" style="margin-bottom:14px;overflow:hidden">
        <div class="card-header" style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
          <div>
            <div class="card-title" style="flex-shrink:0">Daily Macro Summary</div>
            <div id="planPhaseLabel" style="font-family:'Rajdhani',sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-top:2px"></div>
          </div>
          <div class="match-badge" id="matchBadge" style="flex-shrink:0">
            <div class="checkmark"><svg viewBox="0 0 8 8" fill="none"><polyline points="1,4 3,6 7,2" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg></div>
            On target ✓
          </div>
        </div>
        <div class="card-body" style="padding:12px 16px">
          <div class="macro-summary-grid" id="macroSummaryGrid"></div>
          <div class="legend" style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border)">
            <div class="legend-item"><div class="legend-dot" style="background:var(--simple)"></div>Simple</div>
            <div class="legend-item"><div class="legend-dot" style="background:var(--premade)"></div>Premade</div>
            <div class="legend-item"><div class="legend-dot" style="background:var(--gourmet)"></div>Gourmet</div>
          </div>
        </div>
      </div>

      <!-- Meal slots -->
      <div class="meals-grid" id="mealsGrid"></div>

      <!-- Nutrition Principles -->
      <div class="section-label" style="margin-top:8px">Nutrition Principles</div>
      <div class="grid-2" id="nutritionPrinciplesPlan"></div>

    </div>

    <!-- ── Customize tab ── -->
    <div id="nt-section-customize" style="display:none">

      <!-- Macro Calculator -->
      <div class="card" style="margin-bottom:16px;overflow:hidden" id="ntMacroCalcCard">
        <div style="padding:14px 20px;border-bottom:1px solid var(--border)">
          <div style="font-family:'Rajdhani',sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--muted)">Macro Calculator</div>
        </div>
        <div style="padding:18px 20px">

          <!-- Weight + Height + Body Fat -->
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:24px">
            <div>
              <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px">
                <span style="font-family:'Rajdhani',sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted)">Weight</span>
                <span style="font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:700;color:var(--accent)" id="ntCalcWeightDisplay">175 lbs</span>
              </div>
              <input type="range" id="ntCalcWeight" min="100" max="350" value="175" step="1" class="macro-slider" />
            </div>
            <div>
              <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px">
                <span style="font-family:'Rajdhani',sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted)">Height</span>
                <span style="font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:700;color:var(--accent)" id="ntCalcHeightDisplay">5'10"</span>
              </div>
              <input type="range" id="ntCalcHeight" min="54" max="84" value="70" step="1" class="macro-slider" />
            </div>
            <div>
              <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px">
                <span style="font-family:'Rajdhani',sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted)">Body Fat %</span>
                <span style="font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:700;color:var(--accent)" id="ntCurrentBodyFatDisplay">18%</span>
              </div>
              <input type="range" id="ntCurrentBodyFat" min="4" max="45" value="18" step="0.5" class="macro-slider" />
            </div>
          </div>

          <!-- Active Phase -->
          <div style="font-family:'Rajdhani',sans-serif;font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--muted);margin-bottom:10px">Active Phase</div>
          <div id="ntPhaseSuggestion" style="display:none;font-size:11px;padding:7px 10px;border-radius:6px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);color:var(--muted);margin-bottom:10px;line-height:1.4"></div>
          <div class="phase-toggle" id="ntCalcGoalToggle" style="margin-bottom:22px">
            <button class="phase-btn" data-goal="cut">Cut</button>
            <button class="phase-btn active" data-goal="maintain">Maintain</button>
            <button class="phase-btn" data-goal="bulk">Bulk</button>
          </div>

          <!-- Activity Level -->
          <div style="font-family:'Rajdhani',sans-serif;font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--muted);margin-bottom:10px">Activity Level</div>
          <div class="phase-toggle" id="ntCalcActivityToggle" style="margin-bottom:22px">
            <button class="phase-btn" data-activity="12">Sedentary</button>
            <button class="phase-btn active" data-activity="14">Light</button>
            <button class="phase-btn" data-activity="15.5">Moderate</button>
            <button class="phase-btn" data-activity="17">Active</button>
          </div>

          <div class="macro-calc-results" id="ntCalcResults"></div>
        </div>
      </div>

      <!-- Whole Foods reference -->
      <div class="section-label">Whole Foods Reference</div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:12px">Top nutrient-dense options. Build meals around these.</div>
      <div class="card">
        <div class="card-body" style="padding:12px 16px">
          <div class="whole-foods-compact-grid" id="wholeFoodsCompact"></div>
        </div>
      </div>

      <!-- Nutrition Principles -->
      <div class="section-label" style="margin-top:8px">Nutrition Principles</div>
      <div class="grid-2" id="nutritionPrinciples"></div>

    </div>
  `;

  /* ── Sub-page tabs ── */
  function showTab(id) {
    activeTab = id;
    document.getElementById('nt-section-plan').style.display      = id === 'plan'      ? '' : 'none';
    document.getElementById('nt-section-customize').style.display = id === 'customize' ? '' : 'none';
    setPageTabs(inner, NUTRITION_TABS, id, showTab);
  }
  setPageTabs(inner, NUTRITION_TABS, activeTab, showTab);

  function catClass(c) {
    return c === 'Simple' ? 'cat-simple' : c === 'Premade' ? 'cat-premade' : 'cat-gourmet';
  }

  /* ── Inline add-custom-meal panel ── */
  let addingMealSlot = null;

  function openAddMealModal(slotIdx) {
    addingMealSlot = slotIdx;
    const slotName = MEAL_TITLES[slotIdx] || `Slot ${slotIdx + 1}`;
    document.getElementById('addMealEyebrow').textContent = slotName;
    document.getElementById('addMealBody').innerHTML = `
      <div style="padding:16px;display:flex;flex-direction:column;gap:10px">
        <input class="form-input" id="cmName"    placeholder="Meal name (e.g. Chicken Rice Bowl)" />
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <input class="form-input" id="cmCuisine" placeholder="Cuisine (e.g. American)" />
          <select class="app-select" id="cmCat">
            <option value="Simple">Simple</option>
            <option value="Premade">Premade</option>
            <option value="Gourmet">Gourmet</option>
          </select>
        </div>
        <div style="font-family:'Rajdhani',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-top:4px">Macros</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <input class="form-input" id="cmCal"  type="number" placeholder="Calories (kcal)" />
          <input class="form-input" id="cmPro"  type="number" placeholder="Protein (g)" />
          <input class="form-input" id="cmCarb" type="number" placeholder="Carbs (g)" />
          <input class="form-input" id="cmFat"  type="number" placeholder="Fat (g)" />
        </div>
        <div id="cmError" style="color:var(--danger);font-size:12px;display:none"></div>
        <button class="day-tab active" id="saveCm" style="width:100%;padding:11px;font-size:13px;margin-top:4px">Save & Select Meal</button>
      </div>`;

    const overlay = document.getElementById('addMealOverlay');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    overlay.querySelector('#saveCm').addEventListener('click', () => {
      const name  = overlay.querySelector('#cmName').value.trim();
      const cal   = parseInt(overlay.querySelector('#cmCal').value)  || 0;
      const pro   = parseInt(overlay.querySelector('#cmPro').value)  || 0;
      const carb  = parseInt(overlay.querySelector('#cmCarb').value) || 0;
      const fat   = parseInt(overlay.querySelector('#cmFat').value)  || 0;
      const errEl = overlay.querySelector('#cmError');
      if (!name || !cal) { errEl.textContent = 'Name and calories are required.'; errEl.style.display = 'block'; return; }
      STATE.addCustomMeal(currentPhase, addingMealSlot, {
        name,
        category: overlay.querySelector('#cmCat').value,
        cuisine:  overlay.querySelector('#cmCuisine').value.trim() || 'Custom',
        calories: cal, protein: pro, carbs: carb, fats: fat,
      });
      /* Auto-select the new custom meal (it lands at the end of the slot) */
      const newIdx = getMeals(currentPhase)[addingMealSlot].length - 1;
      STATE.selectMeal(currentPhase, addingMealSlot, newIdx);
      closeAddMealModal();
      renderPhase();
    });
  }

  function closeAddMealModal() {
    const overlay = document.getElementById('addMealOverlay');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.getElementById('addMealClose').addEventListener('click', closeAddMealModal);
  document.getElementById('addMealOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('addMealOverlay')) closeAddMealModal();
  });

  /* ── Meal description generator ── */
  function getMealDesc(opt) {
    const n = opt.name.toLowerCase();
    const c = opt.cuisine;
    const p = opt.protein;
    const cal = opt.calories;

    if (opt.category === 'Premade') {
      if (n.includes('batch') || n.includes('frozen') || n.includes('prep'))
        return `A ${c} meal-prep staple built for consistency. Cook it in bulk on Sunday and you'll have a high-protein, macro-precise option ready to reheat all week — no thinking required on busy days. Great for hitting ${p}g protein without any mid-week cooking.`;
      return `Designed to be made ahead and portioned into containers. This ${c.toLowerCase()} option delivers ${cal} kcal in a format that travels well and reheats cleanly, making it one of the most efficient ways to stay on plan through a busy schedule.`;
    }

    if (opt.category === 'Simple') {
      if (n.includes('bowl') || n.includes('plate'))
        return `A straightforward ${c.toLowerCase()} bowl that comes together in under 20 minutes with minimal equipment. Built around whole-food sources of protein and complex carbs, it's easy to scale, hard to mess up, and delivers a clean ${cal} kcal with ${p}g of protein per serving.`;
      if (n.includes('smoothie') || n.includes('yogurt') || n.includes('cottage'))
        return `A no-cook ${c.toLowerCase()} option that's as fast as it gets. Measure, combine, done — ideal for mornings when time is tight or after a session when you need fast fuel. Packs ${p}g protein into a light, digestible format.`;
      return `A clean, no-fuss ${c.toLowerCase()} meal ready in 15–20 minutes. Built around familiar ingredients and a simple cook method, it keeps prep stress low while still hitting ${p}g protein and staying well within your ${cal} kcal target for this slot.`;
    }

    /* Gourmet */
    if (n.includes('korean') || n.includes('japanese') || n.includes('thai') || n.includes('vietnamese'))
      return `An elevated ${c.toLowerCase()} dish worth the extra effort. The flavour profile runs deep — aromatic bases, layered seasoning, and contrasting textures make this one of the most satisfying meals in the rotation. At ${cal} kcal and ${p}g protein, it delivers on every level: flavour, macros, and satisfaction.`;
    if (n.includes('italian') || n.includes('mediterranean') || n.includes('greek') || n.includes('spanish'))
      return `A refined ${c.toLowerCase()} dish that rewards patience and fresh ingredients. Built on classic technique, it's rich in flavour without being heavy — balanced macros of ${p}g protein and ${cal} kcal make it a gourmet option that still serves your performance goals.`;
    return `A chef-level ${c.toLowerCase()} preparation that elevates the ordinary into something memorable. Takes more active time to prepare but the result — ${cal} kcal, ${p}g protein, genuine flavour — is worth every minute. Best reserved for days when cooking is part of the ritual.`;
  }

  /* ── Ingredient list generator (derived from macro targets + name) ── */
  function getMealIngredients(opt) {
    const n = opt.name.toLowerCase();
    const items = [];

    /* Protein */
    if      (n.includes('chicken'))                            items.push(['Chicken breast', `${Math.round(opt.protein * 4)}g`]);
    else if (n.includes('salmon'))                             items.push(['Salmon fillet', `${Math.round(opt.protein * 4.2)}g`]);
    else if (n.includes('tuna'))                               items.push(['Tuna', `${Math.round(opt.protein * 4.3)}g`]);
    else if (n.includes('turkey'))                             items.push(['Ground turkey', `${Math.round(opt.protein * 4.5)}g`]);
    else if (n.includes('beef') || n.includes('steak'))        items.push(['Lean beef', `${Math.round(opt.protein * 4)}g`]);
    else if (n.includes('pork'))                               items.push(['Pork', `${Math.round(opt.protein * 4)}g`]);
    else if (n.includes('lamb'))                               items.push(['Lamb', `${Math.round(opt.protein * 4)}g`]);
    else if (n.includes('shrimp') || n.includes('prawn'))      items.push(['Shrimp', `${Math.round(opt.protein * 4)}g`]);
    else if (n.includes('cod') || n.includes('sea bass') || n.includes('branzino') || n.includes('swordfish') || n.includes('fish')) items.push(['Fish fillet', `${Math.round(opt.protein * 4.3)}g`]);
    else if (n.includes('tofu'))                               items.push(['Firm tofu', `${Math.round(opt.protein * 11)}g`]);
    else if (n.includes('egg'))                                items.push(['Eggs / egg whites', `${Math.ceil(opt.protein / 6)} large`]);
    else if (n.includes('greek yogurt') || n.includes('yogurt')) items.push(['Greek yogurt', `${Math.round(opt.protein * 10)}g`]);
    else if (n.includes('cottage cheese'))                     items.push(['Cottage cheese', `${Math.round(opt.protein * 9)}g`]);
    else                                                       items.push(['Lean protein source', `${opt.protein}g protein`]);

    /* Carbs */
    if      (n.includes('rice'))                               items.push(['Rice (cooked)', `${Math.round(opt.carbs * 3.5)}g`]);
    else if (n.includes('pasta') || n.includes('spaghetti') || n.includes('ziti') || n.includes('orzo') || n.includes('fregola')) items.push(['Pasta (cooked)', `${Math.round(opt.carbs * 3.8)}g`]);
    else if (n.includes('oat'))                                items.push(['Rolled oats', `${Math.round(opt.carbs / 0.67)}g dry`]);
    else if (n.includes('potato') || n.includes('patata'))     items.push(['Potato', `${Math.round(opt.carbs * 5.5)}g`]);
    else if (n.includes('quinoa'))                             items.push(['Quinoa (cooked)', `${Math.round(opt.carbs * 5)}g`]);
    else if (n.includes('lentil'))                             items.push(['Lentils (cooked)', `${Math.round(opt.carbs * 4.5)}g`]);
    else if (n.includes('bean') || n.includes('chickpea'))     items.push(['Legumes (cooked)', `${Math.round(opt.carbs * 5)}g`]);
    else if (n.includes('bulgur'))                             items.push(['Bulgur (cooked)', `${Math.round(opt.carbs * 4.5)}g`]);
    else if (n.includes('couscous'))                           items.push(['Couscous (cooked)', `${Math.round(opt.carbs * 4.5)}g`]);
    else if (n.includes('pita') || n.includes('bread') || n.includes('toast') || n.includes('wrap') || n.includes('flatbread') || n.includes('crostini') || n.includes('blini')) items.push(['Bread / pita', `${Math.round(opt.carbs * 2.5)}g`]);
    else if (n.includes('noodle') || n.includes('vermicelli') || n.includes('soba')) items.push(['Noodles (cooked)', `${Math.round(opt.carbs * 3.5)}g`]);
    else                                                       items.push(['Carb source', `${opt.carbs}g carbs`]);

    /* Veg + fats */
    items.push(['Mixed vegetables', '150–200g']);
    if (opt.fats > 15) items.push(['Healthy fats (oil / avocado)', `${Math.round(opt.fats * 0.45)}g`]);
    items.push(['Seasoning & spices', 'to taste']);
    return items;
  }

  /* ── Directions generator (category-based) ── */
  function getMealDirections(opt) {
    if (opt.category === 'Premade') return [
      'Batch-cook proteins and carbs in bulk at the start of the week.',
      'Portion into meal-prep containers alongside veggies.',
      'Refrigerate for up to 4 days or freeze for longer storage.',
      'Reheat in microwave 2–3 min or in a skillet over medium heat.',
      'Season fresh before eating for best flavour.',
    ];
    if (opt.category === 'Simple') return [
      'Weigh and prep all ingredients before cooking.',
      'Cook protein using your preferred method (pan-sear, grill, or oven at 200 °C / 400 °F for 20–25 min).',
      'Cook carb source according to package instructions.',
      'Steam or sauté vegetables until just tender.',
      'Combine, season to taste, and serve immediately.',
    ];
    /* Gourmet */
    return [
      'Gather and weigh all fresh ingredients precisely.',
      'Marinate or season protein at least 15–30 min before cooking.',
      'Cook each component separately using the appropriate technique (sear, braise, steam, or roast).',
      'Build the dish — layer components, adjust seasoning, and plate thoughtfully.',
      'Rest any meat 5 min before serving for optimal texture.',
    ];
  }

  /* ══════════════════════════════════════════════════════════════
     MEAL DETAIL MODAL
  ══════════════════════════════════════════════════════════════ */
  const mealOverlay = document.getElementById('modalOverlay');

  function openMealModal(opt) {
    const totalCal = opt.calories || 1;
    const pCal = (opt.protein * 4 / totalCal * 100).toFixed(0);
    const cCal = (opt.carbs   * 4 / totalCal * 100).toFixed(0);
    const fCal = (opt.fats    * 9 / totalCal * 100).toFixed(0);
    const ingredients = getMealIngredients(opt);
    const directions  = getMealDirections(opt);

    document.getElementById('modalEyebrow').textContent  = opt.cuisine;
    document.getElementById('modalTitle').textContent    = opt.name;
    document.getElementById('modalCatBadge').textContent = opt.category;
    document.getElementById('modalCatBadge').className   = `category-badge ${catClass(opt.category)}`;
    document.getElementById('modalCuisineTag').textContent = opt.cuisine;
    document.getElementById('mCalChip').textContent = `${opt.calories} kcal`;
    document.getElementById('mProChip').textContent = `${opt.protein}g P`;
    document.getElementById('mCarbChip').textContent = `${opt.carbs}g C`;
    document.getElementById('mFatChip').textContent  = `${opt.fats}g F`;

    document.getElementById('modalBody').innerHTML = `
      <div style="padding:16px">
        <p style="font-size:13px;color:rgba(226,234,242,0.72);line-height:1.6;margin:0 0 16px">${getMealDesc(opt)}</p>

        <div style="font-family:'Rajdhani',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:8px">Macro Breakdown</div>
        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:18px;font-size:12px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="color:#f5a623;min-width:52px">Protein</span>
            <div style="flex:1;height:5px;background:rgba(255,255,255,0.08);border-radius:3px"><div style="height:100%;width:${pCal}%;background:#f5a623;border-radius:3px"></div></div>
            <span style="color:var(--fg)">${opt.protein}g <span style="color:var(--muted)">(${pCal}%)</span></span>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="color:#42c4f5;min-width:52px">Carbs</span>
            <div style="flex:1;height:5px;background:rgba(255,255,255,0.08);border-radius:3px"><div style="height:100%;width:${cCal}%;background:#42c4f5;border-radius:3px"></div></div>
            <span style="color:var(--fg)">${opt.carbs}g <span style="color:var(--muted)">(${cCal}%)</span></span>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="color:#c97bff;min-width:52px">Fats</span>
            <div style="flex:1;height:5px;background:rgba(255,255,255,0.08);border-radius:3px"><div style="height:100%;width:${fCal}%;background:#c97bff;border-radius:3px"></div></div>
            <span style="color:var(--fg)">${opt.fats}g <span style="color:var(--muted)">(${fCal}%)</span></span>
          </div>
        </div>

        <div style="font-family:'Rajdhani',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:8px">Ingredients</div>
        <ul class="meal-ingredient-list" style="margin-bottom:18px">
          ${ingredients.map(([name, amt]) => `<li><span>${name}</span><span style="color:var(--muted)">${amt}</span></li>`).join('')}
        </ul>

        <div style="font-family:'Rajdhani',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:8px">Directions</div>
        <ol class="meal-directions-list">
          ${directions.map(d => `<li>${d}</li>`).join('')}
        </ol>
      </div>`;

    mealOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeMealModal() {
    mealOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  mealOverlay.addEventListener('click', e => { if (e.target === mealOverlay) closeMealModal(); });
  document.getElementById('modalClose').addEventListener('click', closeMealModal);

  /* ══════════════════════════════════════════════════════════════
     RENDER PHASE — rebuilds meal grid + updates summary
  ══════════════════════════════════════════════════════════════ */
  function renderPhase() {
    selectedMeals = ns.selectedMeals[currentPhase]
      ? [...ns.selectedMeals[currentPhase]]
      : [null, null, null, null];

    /* Update macro summary */
    updateSummary();

    const allMeals = getMeals(currentPhase);
    const grid     = document.getElementById('mealsGrid');
    grid.innerHTML = '';

    allMeals.forEach((opts, mi) => {
      const visible  = opts;
      const baseLen  = baseCount(currentPhase, mi);
      const card     = document.createElement('div');
      card.className = 'meal-card';
      card.dataset.slotCard = mi;
      card.innerHTML = `
        <div class="meal-card-header" style="display:flex;align-items:center;justify-content:space-between">
          <div>
            <div class="meal-card-number">Slot ${mi + 1}</div>
            <div class="meal-card-title">${MEAL_TITLES[mi]}</div>
          </div>
          <button class="day-tab add-meal-btn" data-slot="${mi}" style="font-size:11px;padding:4px 12px;white-space:nowrap">+ Custom</button>
        </div>
        <div class="meal-options-scroll" id="nl-${mi}"></div>`;
      grid.appendChild(card);

      const list = card.querySelector(`#nl-${mi}`);
      /* Horizontal drag-scroll track */
      list.style.cssText = 'display:flex;flex-direction:row;gap:8px;overflow-x:scroll;padding:8px 12px 10px;cursor:grab;user-select:none;-webkit-overflow-scrolling:touch;scrollbar-width:none';
      (function initDragScroll(el) {
        let startX = 0, startSL = 0, active = false;
        el.addEventListener('mousedown', e => {
          active = true; startX = e.pageX; startSL = el.scrollLeft;
          el.style.cursor = 'grabbing';
        });
        el.addEventListener('mousemove', e => {
          if (!active) return;
          el.scrollLeft = startSL - (e.pageX - startX);
        });
        ['mouseup', 'mouseleave'].forEach(evt => el.addEventListener(evt, () => {
          active = false; el.style.cursor = 'grab';
        }));
        el.addEventListener('touchstart', e => {
          startX = e.touches[0].pageX; startSL = el.scrollLeft;
        }, { passive: true });
        el.addEventListener('touchmove', e => {
          el.scrollLeft = startSL - (e.touches[0].pageX - startX);
        }, { passive: true });
      }(list));

      visible.forEach((opt, oi) => {
        const isCustom   = oi >= baseLen;
        const customIdx  = oi - baseLen;
        const isSelected = selectedMeals[mi] === oi;

        const item = document.createElement('div');
        item.className = 'meal-option' + (isSelected ? ' selected' : '');
        const catBgColor = opt.category === 'Simple' ? 'rgba(76,175,158,0.13)' : opt.category === 'Premade' ? 'rgba(124,106,247,0.13)' : 'rgba(240,156,58,0.13)';
        item.style.cssText = `flex:0 0 280px;min-height:160px;display:flex;flex-direction:column;justify-content:space-between`;
        item.innerHTML = `
          <div class="meal-option-top" style="background:${catBgColor};margin:-14px -14px 8px;padding:10px 14px;border-radius:10px 10px 0 0;min-height:58px;align-items:flex-start">
            <div class="meal-option-name">${opt.name}</div>
            <div style="display:flex;gap:4px;align-items:center">
              <div class="category-badge ${catClass(opt.category)}">${opt.category}</div>
              ${isCustom ? `<button class="meal-delete-btn" title="Remove this custom meal">×</button>` : ''}
            </div>
          </div>
          <div class="meal-option-desc">${getMealDesc(opt)}</div>
          <div class="meal-option-bottom">
            <span class="cuisine-tag">${opt.cuisine}</span>
            <div class="meal-macros">
              <span class="mm mm-cal">${opt.calories}kcal</span>
              <span class="mm mm-p">${opt.protein}P</span>
              <span class="mm mm-c">${opt.carbs}C</span>
              <span class="mm mm-f">${opt.fats}F</span>
            </div>
          </div>`;

        /* Tap card body → select/deselect (ignore if parent was dragged) */
        let pointerDownX = 0;
        item.addEventListener('pointerdown', e => { pointerDownX = e.clientX; });
        item.addEventListener('click', e => {
          if (Math.abs(e.clientX - pointerDownX) > 6) return; /* dragged, not tapped */
          if (e.target.classList.contains('meal-delete-btn')) return;
          selectMeal(mi, oi, item);
          openMealModal(opt);
        });

        /* Delete custom meal */
        const delBtn = item.querySelector('.meal-delete-btn');
        if (delBtn) {
          delBtn.addEventListener('click', e => {
            e.stopPropagation();
            if (selectedMeals[mi] === oi) STATE.selectMeal(currentPhase, mi, null);
            STATE.removeCustomMeal(currentPhase, mi, customIdx);
            renderPhase();
          });
        }

        list.appendChild(item);
      });

      /* + Custom button */
      card.querySelector('.add-meal-btn').addEventListener('click', () => {
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
    selectedMeals.forEach((oi, mi) => {
      if (oi !== null && allMeals[mi][oi]) {
        const o = allMeals[mi][oi];
        cal += o.calories; pro += o.protein; carb += o.carbs; fat += o.fats;
        cnt++;
      }
    });

    /* Targets come from the macro calculator (saved in Settings) */
    const targets = computeMacros(ns.calcWeight, ns.calcGoal, ns.calcActivity);

    /* Update plan tab phase label */
    const phaseLabel = document.getElementById('planPhaseLabel');
    if (phaseLabel) {
      const phaseColor = ns.calcGoal === 'bulk' ? 'var(--accent3)' : ns.calcGoal === 'cut' ? 'var(--danger)' : 'var(--accent)';
      const phaseStr   = (ns.calcGoal || 'maintain').charAt(0).toUpperCase() + (ns.calcGoal || 'maintain').slice(1);
      phaseLabel.innerHTML = `Active Phase · <span style="color:${phaseColor}">${phaseStr}</span>`;
    }

    const grid = document.getElementById('macroSummaryGrid');
    if (!grid) return;

    const macros = [
      { label:'Calories', eaten:cal,  target:targets.calories, unit:'kcal', color:'var(--accent3)' },
      { label:'Protein',  eaten:pro,  target:targets.protein,  unit:'g',    color:'#f5a623' },
      { label:'Carbs',    eaten:carb, target:targets.carbs,    unit:'g',    color:'#42c4f5' },
      { label:'Fats',     eaten:fat,  target:targets.fats,     unit:'g',    color:'#c97bff' },
    ];

    grid.innerHTML = macros.map(m => {
      const pct  = m.target > 0 ? Math.min(100, (m.eaten / m.target) * 100) : 0;
      const over = m.eaten > m.target;
      return `
        <div class="macro-summary-item">
          <div class="macro-summary-header">
            <span class="macro-summary-label">${m.label}</span>
            <span class="macro-summary-values">
              <span style="color:${m.color};font-family:'Rajdhani',sans-serif;font-size:16px;font-weight:700">${m.eaten}</span>
              <span class="macro-summary-sep">/</span>
              <span class="macro-summary-target">${m.target}${m.unit}</span>
            </span>
          </div>
          <div class="macro-bar-track">
            <div class="macro-bar-fill" style="width:${pct}%;background:${m.color};${over ? 'opacity:1' : ''}"></div>
          </div>
          <div class="macro-summary-sub">${Math.round(pct)}% of daily target</div>
        </div>`;
    }).join('');

    /* Match badge */
    const badge = document.getElementById('matchBadge');
    badge.className = 'match-badge';
    if (cnt === 4) {
      const diff = cal - targets.calories;
      if (Math.abs(diff) <= 50) {
        badge.classList.add('perfect');
        badge.innerHTML = `<div class="checkmark"><svg viewBox="0 0 8 8" fill="none"><polyline points="1,4 3,6 7,2" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg></div> On target ✓`;
      } else {
        badge.classList.add('mismatch');
        badge.innerHTML = `&#9888; ${diff > 0 ? '+' : ''}${diff} kcal from target`;
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════
     MACRO CALCULATOR (Customize tab)
  ══════════════════════════════════════════════════════════════ */
  let ntCalcWeight     = ns.calcWeight     || 175;
  let ntCalcHeight     = ns.calcHeight     || 70;
  let ntCalcGoal       = ns.calcGoal       || 'maintain';
  let ntCalcActivity   = ns.calcActivity   || 14;
  let ntCurrentBodyFat = ns.currentBodyFat || 18;

  function fmtHeight(inches) {
    return `${Math.floor(inches / 12)}'${inches % 12}"`;
  }
  function calcBMI(weightLbs, heightIn) {
    return heightIn > 0 ? (weightLbs / (heightIn * heightIn)) * 703 : 0;
  }

  /* Pre-populate sliders */
  inner.querySelector('#ntCalcWeight').value = ntCalcWeight;
  inner.querySelector('#ntCalcWeightDisplay').textContent = ntCalcWeight + ' lbs';
  inner.querySelector('#ntCalcHeight').value = ntCalcHeight;
  inner.querySelector('#ntCalcHeightDisplay').textContent = fmtHeight(ntCalcHeight);
  inner.querySelector('#ntCurrentBodyFat').value = ntCurrentBodyFat;
  inner.querySelector('#ntCurrentBodyFatDisplay').textContent = ntCurrentBodyFat + '%';
  inner.querySelectorAll('#ntCalcGoalToggle [data-goal]').forEach(b => {
    b.classList.toggle('active', b.dataset.goal === ntCalcGoal);
  });
  inner.querySelectorAll('#ntCalcActivityToggle [data-activity]').forEach(b => {
    b.classList.toggle('active', parseFloat(b.dataset.activity) === ntCalcActivity);
  });

  function renderPhaseSuggestion() {
    const el  = document.getElementById('ntPhaseSuggestion');
    if (!el) return;
    const bmi = calcBMI(ntCalcWeight, ntCalcHeight);
    const bf  = ntCurrentBodyFat;
    let phase = null, reason = '';

    if (bmi >= 25 && bf <= 15) {
      /* Upper BMI but lean — likely muscular, don't cut */
      phase  = 'maintain';
      reason = `BMI ${bmi.toFixed(1)} but ${bf}% body fat — you're likely muscular. Maintain to preserve mass.`;
    } else if (bf >= 20 || bmi >= 27) {
      phase  = 'cut';
      reason = bmi >= 27
        ? `BMI ${bmi.toFixed(1)} and ${bf}% body fat — a cut phase will help reduce excess fat.`
        : `${bf}% body fat — a cut is recommended to get back into a leaner range.`;
    } else if (bmi < 18.5 || bf <= 10) {
      phase  = 'bulk';
      reason = bmi < 18.5
        ? `BMI ${bmi.toFixed(1)} — you're underweight. A bulk phase will help you build size and strength.`
        : `${bf}% body fat — you're very lean and in a great position to bulk effectively.`;
    }

    if (!phase) { el.style.display = 'none'; return; }
    const isCurrent  = ntCalcGoal === phase;
    const phaseColor = phase === 'cut' ? 'var(--danger)' : phase === 'bulk' ? 'var(--accent3)' : 'var(--accent)';
    el.style.display = 'block';
    el.innerHTML = `<span style="color:${phaseColor};font-weight:700">${phase.charAt(0).toUpperCase() + phase.slice(1)} suggested</span>${isCurrent ? ' ✓' : ''} — ${reason}`;
  }

  function renderNtCalcResults() {
    const m = computeMacros(ntCalcWeight, ntCalcGoal, ntCalcActivity);
    const pPct = Math.round((m.protein * 4 / m.calories) * 100);
    const cPct = Math.round((m.carbs   * 4 / m.calories) * 100);
    const fPct = Math.round((m.fats    * 9 / m.calories) * 100);
    inner.querySelector('#ntCalcResults').innerHTML = `
      <div class="macro-calc-main">
        <div class="macro-calc-calories">
          <span class="macro-calc-cal-val">${m.calories.toLocaleString()}</span>
          <span class="macro-calc-cal-unit">kcal/day</span>
        </div>
      </div>
      <div class="macro-calc-breakdown">
        <div class="macro-calc-macro" style="--mc:${pPct}%;--col:#f5a623">
          <div class="macro-calc-bar"><div class="macro-calc-bar-fill"></div></div>
          <div class="macro-calc-val">${m.protein}g</div>
          <div class="macro-calc-lbl">Protein (${pPct}%)</div>
        </div>
        <div class="macro-calc-macro" style="--mc:${cPct}%;--col:#42c4f5">
          <div class="macro-calc-bar"><div class="macro-calc-bar-fill"></div></div>
          <div class="macro-calc-val">${m.carbs}g</div>
          <div class="macro-calc-lbl">Carbs (${cPct}%)</div>
        </div>
        <div class="macro-calc-macro" style="--mc:${fPct}%;--col:#c97bff">
          <div class="macro-calc-bar"><div class="macro-calc-bar-fill"></div></div>
          <div class="macro-calc-val">${m.fats}g</div>
          <div class="macro-calc-lbl">Fats (${fPct}%)</div>
        </div>
      </div>
      <div style="font-size:11px;color:var(--muted);margin-top:12px;line-height:1.5">
        TDEE ≈ ${m.tdee.toLocaleString()} kcal · ${ntCalcGoal === 'bulk' ? '+300 surplus' : ntCalcGoal === 'cut' ? '−500 deficit' : 'maintenance'}
        · BMI ${calcBMI(ntCalcWeight, ntCalcHeight).toFixed(1)}
      </div>`;
  }

  function ntSaveAndRender() {
    currentPhase = ntCalcGoal;
    STATE.setNutritionPhase(currentPhase);
    STATE.setCalcInputs(ntCalcWeight, ntCalcGoal, ntCalcActivity,
      undefined, undefined, ntCurrentBodyFat, undefined, ntCalcHeight);
    renderNtCalcResults();
    renderPhaseSuggestion();
    updateSummary();
    if (document.getElementById('mealsGrid')) renderPhase();
  }

  inner.querySelector('#ntCalcWeight').addEventListener('input', e => {
    ntCalcWeight = parseInt(e.target.value);
    inner.querySelector('#ntCalcWeightDisplay').textContent = ntCalcWeight + ' lbs';
    ntSaveAndRender();
  });
  inner.querySelector('#ntCalcHeight').addEventListener('input', e => {
    ntCalcHeight = parseInt(e.target.value);
    inner.querySelector('#ntCalcHeightDisplay').textContent = fmtHeight(ntCalcHeight);
    ntSaveAndRender();
  });
  inner.querySelector('#ntCurrentBodyFat').addEventListener('input', e => {
    ntCurrentBodyFat = parseFloat(e.target.value);
    inner.querySelector('#ntCurrentBodyFatDisplay').textContent = ntCurrentBodyFat + '%';
    ntSaveAndRender();
  });

  inner.querySelectorAll('#ntCalcGoalToggle [data-goal]').forEach(btn => {
    btn.addEventListener('click', () => {
      inner.querySelectorAll('#ntCalcGoalToggle [data-goal]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      ntCalcGoal = btn.dataset.goal;
      ntSaveAndRender();
    });
  });
  inner.querySelectorAll('#ntCalcActivityToggle [data-activity]').forEach(btn => {
    btn.addEventListener('click', () => {
      inner.querySelectorAll('#ntCalcActivityToggle [data-activity]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      ntCalcActivity = parseFloat(btn.dataset.activity);
      ntSaveAndRender();
    });
  });
  renderNtCalcResults();
  renderPhaseSuggestion();

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
  const principleHTML = (APP_DATA.healthPrinciples?.nutrition || []).map(p => `
    <div style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
      <div style="font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700;color:var(--accent);margin-bottom:4px">${p.title}</div>
      <div style="font-size:12px;color:rgba(226,234,242,0.72);line-height:1.6">${p.body}</div>
    </div>`).join('');
  document.getElementById('nutritionPrinciples').innerHTML     = principleHTML;
  document.getElementById('nutritionPrinciplesPlan').innerHTML = principleHTML;

  renderPhase();
});
