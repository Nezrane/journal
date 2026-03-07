/**
 * KOLTYN OS — nutrition/page.js
 * Macro planner: 120 meals across bulk / maintain / cut phases.
 * Ported from the standalone nutrition-dashboard with no changes to data.
 */

window.registerPage('nutrition', function initNutrition() {

  /* ── Phase targets ── */
  const PHASES = {
    bulk:     { name:'Bulk',     calories:3850, protein:241, carbs:481, fats:107 },
    maintain: { name:'Maintain', calories:2850, protein:214, carbs:285, fats:95  },
    cut:      { name:'Cut',      calories:2350, protein:206, carbs:176, fats:91  }
  };

  /* ── All 120 meals ── */
  const MEALS = {
    bulk:[
      [{name:"Oat & Egg White Power Bowl",category:"Simple",cuisine:"American",calories:875,protein:55,carbs:109,fats:24},{name:"Banana Greek Yogurt Parfait",category:"Simple",cuisine:"Mediterranean",calories:875,protein:55,carbs:109,fats:24},{name:"Whole Wheat Chicken Breakfast Wrap",category:"Simple",cuisine:"Mexican",calories:875,protein:55,carbs:109,fats:24},{name:"Frozen Breakfast Burrito Batch",category:"Premade",cuisine:"Mexican",calories:875,protein:55,carbs:109,fats:24},{name:"Batch Egg Muffin Cups",category:"Premade",cuisine:"American",calories:875,protein:55,carbs:109,fats:24},{name:"Prepped Overnight Oats with Whey",category:"Premade",cuisine:"American",calories:875,protein:55,carbs:109,fats:24},{name:"Shakshuka with Whole Wheat Pita",category:"Gourmet",cuisine:"Middle Eastern",calories:875,protein:55,carbs:109,fats:24},{name:"Tamagoyaki with Brown Rice",category:"Gourmet",cuisine:"Japanese",calories:875,protein:55,carbs:109,fats:24},{name:"Huevos Rancheros with Black Beans",category:"Gourmet",cuisine:"Mexican",calories:875,protein:55,carbs:109,fats:24},{name:"Greek Egg Scramble with Feta & Pita",category:"Gourmet",cuisine:"Greek",calories:875,protein:55,carbs:109,fats:24}],
      [{name:"Chicken Rice & Avocado Bowl",category:"Simple",cuisine:"American",calories:1100,protein:69,carbs:138,fats:31},{name:"Tuna Whole Wheat Pasta",category:"Simple",cuisine:"Italian",calories:1100,protein:69,carbs:138,fats:31},{name:"Turkey & Sweet Potato Plate",category:"Simple",cuisine:"American",calories:1100,protein:69,carbs:138,fats:31},{name:"Batch Beef & Brown Rice Bowls",category:"Premade",cuisine:"American",calories:1100,protein:69,carbs:138,fats:31},{name:"Frozen Chicken Fried Rice Prep",category:"Premade",cuisine:"Asian",calories:1100,protein:69,carbs:138,fats:31},{name:"Meal-Prep Salmon & Quinoa Boxes",category:"Premade",cuisine:"Mediterranean",calories:1100,protein:69,carbs:138,fats:31},{name:"Bibimbap with Beef & Egg",category:"Gourmet",cuisine:"Korean",calories:1100,protein:69,carbs:138,fats:31},{name:"Chicken Puttanesca over Spaghetti",category:"Gourmet",cuisine:"Italian",calories:1100,protein:69,carbs:138,fats:31},{name:"Lamb Kofta with Bulgur & Tzatziki",category:"Gourmet",cuisine:"Greek",calories:1100,protein:69,carbs:138,fats:31},{name:"Chicken Tikka Masala with Basmati",category:"Gourmet",cuisine:"Indian",calories:1100,protein:69,carbs:138,fats:31}],
      [{name:"Beef & Brown Rice Power Plate",category:"Simple",cuisine:"American",calories:1100,protein:69,carbs:138,fats:31},{name:"Salmon Sweet Potato & Broccoli",category:"Simple",cuisine:"American",calories:1100,protein:69,carbs:138,fats:31},{name:"Cottage Cheese Pasta Bake",category:"Simple",cuisine:"Italian",calories:1100,protein:69,carbs:138,fats:31},{name:"Prepped Turkey Meatball Subs",category:"Premade",cuisine:"Italian",calories:1100,protein:69,carbs:138,fats:31},{name:"Frozen Baked Ziti Prep",category:"Premade",cuisine:"Italian",calories:1100,protein:69,carbs:138,fats:31},{name:"Batch Pulled Chicken & Rice Bowls",category:"Premade",cuisine:"American",calories:1100,protein:69,carbs:138,fats:31},{name:"Pork Bulgogi with Steamed Rice",category:"Gourmet",cuisine:"Korean",calories:1100,protein:69,carbs:138,fats:31},{name:"Chicken Souvlaki with Rice Pilaf",category:"Gourmet",cuisine:"Greek",calories:1100,protein:69,carbs:138,fats:31},{name:"Thai Basil Pork with Jasmine Rice",category:"Gourmet",cuisine:"Thai",calories:1100,protein:69,carbs:138,fats:31},{name:"Grilled Swordfish with Romesco & Potatoes",category:"Gourmet",cuisine:"Spanish",calories:1100,protein:69,carbs:138,fats:31}],
      [{name:"Cottage Cheese Toast & Banana",category:"Simple",cuisine:"American",calories:775,protein:48,carbs:96,fats:21},{name:"Greek Yogurt Protein Bowl",category:"Simple",cuisine:"Greek",calories:775,protein:48,carbs:96,fats:21},{name:"Peanut Butter Oat Protein Smoothie",category:"Simple",cuisine:"American",calories:775,protein:48,carbs:96,fats:21},{name:"Prepped Protein Pancake Stacks",category:"Premade",cuisine:"American",calories:775,protein:48,carbs:96,fats:21},{name:"Batch Lentil & Chicken Soup",category:"Premade",cuisine:"Middle Eastern",calories:775,protein:48,carbs:96,fats:21},{name:"Frozen Beef & Potato Shepherd Prep",category:"Premade",cuisine:"British",calories:775,protein:48,carbs:96,fats:21},{name:"Mushroom Ricotta Crostini",category:"Gourmet",cuisine:"Italian",calories:775,protein:48,carbs:96,fats:21},{name:"Smashed Chickpea Flatbread",category:"Gourmet",cuisine:"Middle Eastern",calories:775,protein:48,carbs:96,fats:21},{name:"Miso Soup with Tofu & Rice Crackers",category:"Gourmet",cuisine:"Japanese",calories:775,protein:48,carbs:96,fats:21},{name:"Patatas Bravas with Aioli & Egg",category:"Gourmet",cuisine:"Spanish",calories:775,protein:48,carbs:96,fats:21}]
    ],
    maintain:[
      [{name:"Egg White Omelette with Whole Toast",category:"Simple",cuisine:"American",calories:600,protein:45,carbs:60,fats:20},{name:"Greek Yogurt & Berry Bowl",category:"Simple",cuisine:"Greek",calories:600,protein:45,carbs:60,fats:20},{name:"Chicken Avocado Rice Cake Stack",category:"Simple",cuisine:"American",calories:600,protein:45,carbs:60,fats:20},{name:"Prepped Spinach Egg Muffins",category:"Premade",cuisine:"Mediterranean",calories:600,protein:45,carbs:60,fats:20},{name:"Batch Overnight Protein Oats",category:"Premade",cuisine:"American",calories:600,protein:45,carbs:60,fats:20},{name:"Frozen Turkey Breakfast Patties & Toast",category:"Premade",cuisine:"American",calories:600,protein:45,carbs:60,fats:20},{name:"Turkish Menemen with Pita",category:"Gourmet",cuisine:"Turkish",calories:600,protein:45,carbs:60,fats:20},{name:"Smoked Salmon Blini",category:"Gourmet",cuisine:"Russian",calories:600,protein:45,carbs:60,fats:20},{name:"Spanish Tortilla with Salad",category:"Gourmet",cuisine:"Spanish",calories:600,protein:45,carbs:60,fats:20},{name:"Japanese Tamago Don",category:"Gourmet",cuisine:"Japanese",calories:600,protein:45,carbs:60,fats:20}],
      [{name:"Grilled Chicken & Quinoa Bowl",category:"Simple",cuisine:"Mediterranean",calories:800,protein:60,carbs:80,fats:27},{name:"Tuna Brown Rice & Edamame Bowl",category:"Simple",cuisine:"Japanese",calories:800,protein:60,carbs:80,fats:27},{name:"Turkey & Sweet Potato Hash",category:"Simple",cuisine:"American",calories:800,protein:60,carbs:80,fats:27},{name:"Batch Grilled Chicken & Farro Boxes",category:"Premade",cuisine:"Mediterranean",calories:800,protein:60,carbs:80,fats:27},{name:"Frozen Salmon Quinoa Prep",category:"Premade",cuisine:"American",calories:800,protein:60,carbs:80,fats:27},{name:"Prepped Chicken & Lentil Stew",category:"Premade",cuisine:"Middle Eastern",calories:800,protein:60,carbs:80,fats:27},{name:"Korean Doenjang Jjigae with Rice",category:"Gourmet",cuisine:"Korean",calories:800,protein:60,carbs:80,fats:27},{name:"Moroccan Chicken Tagine with Couscous",category:"Gourmet",cuisine:"Moroccan",calories:800,protein:60,carbs:80,fats:27},{name:"Pasta e Fagioli with Chicken",category:"Gourmet",cuisine:"Italian",calories:800,protein:60,carbs:80,fats:27},{name:"Thai Green Curry Chicken & Rice",category:"Gourmet",cuisine:"Thai",calories:800,protein:60,carbs:80,fats:27}],
      [{name:"Baked Salmon with Whole Grain Rice",category:"Simple",cuisine:"American",calories:800,protein:60,carbs:80,fats:27},{name:"Steak Strip & Potato Bowl",category:"Simple",cuisine:"American",calories:800,protein:60,carbs:80,fats:27},{name:"Shrimp & Brown Rice Stir-Fry",category:"Simple",cuisine:"Asian",calories:800,protein:60,carbs:80,fats:27},{name:"Batch Turkey Bolognese & Pasta",category:"Premade",cuisine:"Italian",calories:800,protein:60,carbs:80,fats:27},{name:"Frozen Chicken & Vegetable Curry Prep",category:"Premade",cuisine:"Indian",calories:800,protein:60,carbs:80,fats:27},{name:"Prepped Beef & Buckwheat Bowls",category:"Premade",cuisine:"Eastern European",calories:800,protein:60,carbs:80,fats:27},{name:"Chicken Piccata with Orzo",category:"Gourmet",cuisine:"Italian",calories:800,protein:60,carbs:80,fats:27},{name:"Pork Tenderloin with Apple & Lentils",category:"Gourmet",cuisine:"French",calories:800,protein:60,carbs:80,fats:27},{name:"Grilled Branzino with Fregola",category:"Gourmet",cuisine:"Mediterranean",calories:800,protein:60,carbs:80,fats:27},{name:"Adana Kebab with Bulgur Pilaf",category:"Gourmet",cuisine:"Turkish",calories:800,protein:60,carbs:80,fats:27}],
      [{name:"Cottage Cheese & Fruit Bowl",category:"Simple",cuisine:"American",calories:650,protein:49,carbs:65,fats:21},{name:"Protein Smoothie with Oat Base",category:"Simple",cuisine:"American",calories:650,protein:49,carbs:65,fats:21},{name:"Hard Boiled Eggs & Whole Grain Crackers",category:"Simple",cuisine:"American",calories:650,protein:49,carbs:65,fats:21},{name:"Prepped White Bean & Chicken Soup",category:"Premade",cuisine:"Italian",calories:650,protein:49,carbs:65,fats:21},{name:"Frozen Turkey & Barley Casserole",category:"Premade",cuisine:"American",calories:650,protein:49,carbs:65,fats:21},{name:"Batch Tofu & Soba Boxes",category:"Premade",cuisine:"Japanese",calories:650,protein:49,carbs:65,fats:21},{name:"Labneh Flatbread with Za'atar",category:"Gourmet",cuisine:"Middle Eastern",calories:650,protein:49,carbs:65,fats:21},{name:"Catalan Chickpea & Spinach",category:"Gourmet",cuisine:"Spanish",calories:650,protein:49,carbs:65,fats:21},{name:"Tteok-Guk (Rice Cake Soup)",category:"Gourmet",cuisine:"Korean",calories:650,protein:49,carbs:65,fats:21},{name:"Grilled Halloumi & Lentil Plate",category:"Gourmet",cuisine:"Greek",calories:650,protein:49,carbs:65,fats:21}]
    ],
    cut:[
      [{name:"Egg White Scramble with Rye Toast",category:"Simple",cuisine:"American",calories:500,protein:44,carbs:37,fats:19},{name:"Plain Greek Yogurt & Apple Slices",category:"Simple",cuisine:"Greek",calories:500,protein:44,carbs:37,fats:19},{name:"Tuna Rice Cake & Cucumber Stack",category:"Simple",cuisine:"American",calories:500,protein:44,carbs:37,fats:19},{name:"Batch Lean Turkey Egg Muffins",category:"Premade",cuisine:"American",calories:500,protein:44,carbs:37,fats:19},{name:"Prepped Smoked Salmon & Oat Cups",category:"Premade",cuisine:"Scandinavian",calories:500,protein:44,carbs:37,fats:19},{name:"Frozen Egg White Frittata Squares",category:"Premade",cuisine:"Italian",calories:500,protein:44,carbs:37,fats:19},{name:"Steamed Tofu & Edamame Rice Bowl",category:"Gourmet",cuisine:"Japanese",calories:500,protein:44,carbs:37,fats:19},{name:"Lemon Herb Cod with Roasted Veg",category:"Gourmet",cuisine:"Mediterranean",calories:500,protein:44,carbs:37,fats:19},{name:"White Bean Shakshuka",category:"Gourmet",cuisine:"Middle Eastern",calories:500,protein:44,carbs:37,fats:19},{name:"Korean Sundubu Jjigae",category:"Gourmet",cuisine:"Korean",calories:500,protein:44,carbs:37,fats:19}],
      [{name:"Chicken Breast & Roasted Veg",category:"Simple",cuisine:"American",calories:650,protein:57,carbs:48,fats:25},{name:"Shrimp & Cauliflower Rice Bowl",category:"Simple",cuisine:"Asian",calories:650,protein:57,carbs:48,fats:25},{name:"Turkey Lettuce Wraps & Quinoa",category:"Simple",cuisine:"American",calories:650,protein:57,carbs:48,fats:25},{name:"Batch Grilled Chicken & Lentil Prep",category:"Premade",cuisine:"Mediterranean",calories:650,protein:57,carbs:48,fats:25},{name:"Frozen Salmon Patties & Salad",category:"Premade",cuisine:"American",calories:650,protein:57,carbs:48,fats:25},{name:"Prepped Turkey Meatball Zucchini Bowls",category:"Premade",cuisine:"Italian",calories:650,protein:57,carbs:48,fats:25},{name:"Vietnamese Grilled Pork Vermicelli Bowl",category:"Gourmet",cuisine:"Vietnamese",calories:650,protein:57,carbs:48,fats:25},{name:"Grilled Chicken Paillard with Arugula",category:"Gourmet",cuisine:"Italian",calories:650,protein:57,carbs:48,fats:25},{name:"Ceviche with Corn & Sweet Potato",category:"Gourmet",cuisine:"Peruvian",calories:650,protein:57,carbs:48,fats:25},{name:"Chicken Souvlaki with Roasted Cauliflower",category:"Gourmet",cuisine:"Greek",calories:650,protein:57,carbs:48,fats:25}],
      [{name:"Baked Cod & Steamed Broccoli & Rice",category:"Simple",cuisine:"American",calories:650,protein:57,carbs:48,fats:25},{name:"Lean Beef Strip & Veggie Stir-Fry",category:"Simple",cuisine:"Asian",calories:650,protein:57,carbs:48,fats:25},{name:"Egg Whites & Black Bean Burrito",category:"Simple",cuisine:"Mexican",calories:650,protein:57,carbs:48,fats:25},{name:"Prepped Tuna & Chickpea Bowls",category:"Premade",cuisine:"Mediterranean",calories:650,protein:57,carbs:48,fats:25},{name:"Batch Chicken & White Bean Soup",category:"Premade",cuisine:"Italian",calories:650,protein:57,carbs:48,fats:25},{name:"Frozen Turkey Stuffed Pepper Prep",category:"Premade",cuisine:"Mexican",calories:650,protein:57,carbs:48,fats:25},{name:"Chicken Posole Verde",category:"Gourmet",cuisine:"Mexican",calories:650,protein:57,carbs:48,fats:25},{name:"Soy-Ginger Steamed Sea Bass",category:"Gourmet",cuisine:"Chinese",calories:650,protein:57,carbs:48,fats:25},{name:"Turkish Chicken Kofte with Tabbouleh",category:"Gourmet",cuisine:"Turkish",calories:650,protein:57,carbs:48,fats:25},{name:"Branzino a la Plancha with Asparagus",category:"Gourmet",cuisine:"Spanish",calories:650,protein:57,carbs:48,fats:25}],
      [{name:"Cottage Cheese & Cucumber Plate",category:"Simple",cuisine:"American",calories:550,protein:48,carbs:43,fats:22},{name:"Tuna & Whole Grain Crispbread",category:"Simple",cuisine:"Scandinavian",calories:550,protein:48,carbs:43,fats:22},{name:"Chicken Breast & Chickpea Salad",category:"Simple",cuisine:"Mediterranean",calories:550,protein:48,carbs:43,fats:22},{name:"Batch Lean Egg & Veggie Wraps",category:"Premade",cuisine:"American",calories:550,protein:48,carbs:43,fats:22},{name:"Prepped Turkey & Lentil Stuffed Zucchini",category:"Premade",cuisine:"Middle Eastern",calories:550,protein:48,carbs:43,fats:22},{name:"Frozen Edamame & Quinoa Bars",category:"Premade",cuisine:"Japanese",calories:550,protein:48,carbs:43,fats:22},{name:"Nicoise Salad with Tuna",category:"Gourmet",cuisine:"French",calories:550,protein:48,carbs:43,fats:22},{name:"Grilled Prawn & Mango Salsa",category:"Gourmet",cuisine:"Thai",calories:550,protein:48,carbs:43,fats:22},{name:"Acqua Pazza (Italian Poached Fish)",category:"Gourmet",cuisine:"Italian",calories:550,protein:48,carbs:43,fats:22},{name:"Salmon Tataki with Ponzu Salad",category:"Gourmet",cuisine:"Japanese",calories:550,protein:48,carbs:43,fats:22}]
    ]
  };

  const MEAL_TITLES = ['Meal 1 — Breakfast','Meal 2 — Lunch','Meal 3 — Dinner','Meal 4 — Evening'];
  let currentPhase = 'bulk';
  let selectedMeals = [null,null,null,null];
  const recipeCache = {};

  /* ── Build the page HTML ── */
  const inner = document.getElementById('nutrition-inner');
  inner.innerHTML = `
    ${buildPageHeader('Daily Planner', 'Nutrition', 'Dashboard', 'Select one option per meal — all combinations hit your daily target exactly.',
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

    <div class="targets-card" id="targetsCard">
      <div class="targets-info">
        <div class="targets-title">Daily Target</div>
        <div class="targets-phase-name" id="phaseName">Bulk</div>
      </div>
      <div class="targets-divider"></div>
      <div class="targets-macros">
        <div class="macro-target calories"><div class="macro-target-label">Calories</div><div class="macro-target-val" id="tCal">3850<span>kcal</span></div></div>
        <div class="macro-target protein"><div class="macro-target-label">Protein</div><div class="macro-target-val"   id="tPro">241<span>g</span></div></div>
        <div class="macro-target carbs"><div class="macro-target-label">Carbs</div><div class="macro-target-val"       id="tCarb">481<span>g</span></div></div>
        <div class="macro-target fats"><div class="macro-target-label">Fats</div><div class="macro-target-val"         id="tFat">107<span>g</span></div></div>
      </div>
    </div>

    <div>
      <div class="meals-section-title">Select one per meal slot — tap ⓘ for recipe &amp; cultural history</div>
      <div class="meals-grid" id="mealsGrid"></div>
    </div>

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
          <div class="sm-row"><span class="sm-current" id="sCal">0</span><span class="sm-unit">kcal</span><span class="sm-target" id="stCal">/ 3850</span></div>
          <div class="sm-bar-track"><div class="sm-bar-fill" id="bCal" style="width:0%"></div></div>
        </div>
        <div class="summary-macro sm-pro" id="smPro">
          <div class="sm-label">Protein</div>
          <div class="sm-row"><span class="sm-current" id="sPro">0</span><span class="sm-unit">g</span><span class="sm-target" id="stPro">/ 241g</span></div>
          <div class="sm-bar-track"><div class="sm-bar-fill" id="bPro" style="width:0%"></div></div>
        </div>
        <div class="summary-macro sm-carb" id="smCarb">
          <div class="sm-label">Carbs</div>
          <div class="sm-row"><span class="sm-current" id="sCarb">0</span><span class="sm-unit">g</span><span class="sm-target" id="stCarb">/ 481g</span></div>
          <div class="sm-bar-track"><div class="sm-bar-fill" id="bCarb" style="width:0%"></div></div>
        </div>
        <div class="summary-macro sm-fat" id="smFat">
          <div class="sm-label">Fats</div>
          <div class="sm-row"><span class="sm-current" id="sFat">0</span><span class="sm-unit">g</span><span class="sm-target" id="stFat">/ 107g</span></div>
          <div class="sm-bar-track"><div class="sm-bar-fill" id="bFat" style="width:0%"></div></div>
        </div>
      </div>
    </div>`;

  /* ── Modal logic ── */
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

  /* ── Render phase ── */
  function renderPhase() {
    const ph = PHASES[currentPhase];
    selectedMeals = [null,null,null,null];
    document.getElementById('phaseName').textContent  = ph.name;
    document.getElementById('tCal').innerHTML  = ph.calories+'<span>kcal</span>';
    document.getElementById('tPro').innerHTML  = ph.protein +'<span>g</span>';
    document.getElementById('tCarb').innerHTML = ph.carbs   +'<span>g</span>';
    document.getElementById('tFat').innerHTML  = ph.fats    +'<span>g</span>';
    document.getElementById('stCal').textContent  = '/ '+ph.calories;
    document.getElementById('stPro').textContent  = '/ '+ph.protein+'g';
    document.getElementById('stCarb').textContent = '/ '+ph.carbs+'g';
    document.getElementById('stFat').textContent  = '/ '+ph.fats+'g';

    const grid = document.getElementById('mealsGrid');
    grid.innerHTML = '';
    MEALS[currentPhase].forEach((opts,mi) => {
      const card = document.createElement('div');
      card.className = 'meal-card';
      card.innerHTML = `<div class="meal-card-header"><div class="meal-card-number">Slot ${mi+1}</div><div class="meal-card-title">${MEAL_TITLES[mi]}</div></div><div class="meal-options-list" id="nl-${mi}"></div>`;
      grid.appendChild(card);
      const list = card.querySelector(`#nl-${mi}`);
      opts.forEach((opt,oi) => {
        const item = document.createElement('div');
        item.className = 'meal-option';
        item.innerHTML = `
          <div class="meal-option-top"><div class="meal-option-name">${opt.name}</div><div class="category-badge ${catClass(opt.category)}">${opt.category}</div></div>
          <div class="meal-option-bottom">
            <span class="cuisine-tag">${opt.cuisine}</span>
            <div class="meal-macros"><span class="mm mm-cal">${opt.calories}kcal</span><span class="mm mm-p">${opt.protein}P</span><span class="mm mm-c">${opt.carbs}C</span><span class="mm mm-f">${opt.fats}F</span></div>
            <button class="info-btn">i</button>
          </div>`;
        item.addEventListener('click', e => { if(e.target.classList.contains('info-btn')) return; selectMeal(mi,oi,item); });
        item.querySelector('.info-btn').addEventListener('click', e => { e.stopPropagation(); openModal(opt); });
        list.appendChild(item);
      });
    });
    updateSummary();
  }

  function selectMeal(mi,oi,el) {
    document.querySelectorAll(`#nl-${mi} .meal-option`).forEach(o=>o.classList.remove('selected'));
    selectedMeals[mi] = selectedMeals[mi]===oi ? null : oi;
    if(selectedMeals[mi]!==null) el.classList.add('selected');
    updateSummary();
  }

  function updateSummary() {
    let cal=0,pro=0,carb=0,fat=0,cnt=0;
    const meals = MEALS[currentPhase];
    selectedMeals.forEach((oi,mi)=>{ if(oi!==null){const o=meals[mi][oi];cal+=o.calories;pro+=o.protein;carb+=o.carbs;fat+=o.fats;cnt++;} });
    const ph = PHASES[currentPhase];
    document.getElementById('sCal').textContent =cal; document.getElementById('sPro').textContent =pro;
    document.getElementById('sCarb').textContent=carb; document.getElementById('sFat').textContent =fat;
    document.getElementById('bCal').style.width  =Math.min(100,(cal/ph.calories)*100)+'%';
    document.getElementById('bPro').style.width  =Math.min(100,(pro/ph.protein) *100)+'%';
    document.getElementById('bCarb').style.width =Math.min(100,(carb/ph.carbs)  *100)+'%';
    document.getElementById('bFat').style.width  =Math.min(100,(fat/ph.fats)    *100)+'%';
    const badge = document.getElementById('matchBadge');
    badge.className = 'match-badge';
    if(cnt===4){
      if(cal===ph.calories&&pro===ph.protein&&carb===ph.carbs&&fat===ph.fats){
        badge.classList.add('perfect');
        badge.innerHTML=`<div class="checkmark"><svg viewBox="0 0 8 8" fill="none"><polyline points="1,4 3,6 7,2" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg></div> Macros perfectly matched ✓`;
      } else {
        badge.classList.add('mismatch');
        const d=cal-ph.calories;
        badge.innerHTML=`&#9888; ${d>0?'+':''}${d} kcal from target`;
      }
    }
    ['Cal','Pro','Carb','Fat'].forEach(k=>{
      const el=document.getElementById('sm'+k);
      const c=k==='Cal'?cal:k==='Pro'?pro:k==='Carb'?carb:fat;
      const t=k==='Cal'?ph.calories:k==='Pro'?ph.protein:k==='Carb'?ph.carbs:ph.fats;
      el.classList.remove('matched','over');
      if(cnt===4) el.classList.add(c===t?'matched':c>t?'over':'');
    });
  }

  document.getElementById('phaseSelect').addEventListener('change', e => { currentPhase=e.target.value; renderPhase(); });
  renderPhase();
});
