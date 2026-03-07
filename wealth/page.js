/**
 * KOLTYN OS — wealth/page.js
 * Income streams, MRR tracker, index fund investing, wealth snapshot.
 */

window.registerPage('wealth', function initWealth() {

  /* ── Wealth data ── */
  const MRR_CURRENT = 0;
  const MRR_TARGET  = 50000;

  const INCOME_STREAMS = [
    { icon:'🏗️', name:'Envosta (SaaS)',        desc:'Primary business — MRR goal $50K',       amount:'$0',     status:'building', color:'var(--accent)' },
    { icon:'📈', name:'Index Funds',            desc:'S&P 500 + broad market — long term DCA',  amount:'$—',     status:'active',   color:'#3ddc6e' },
    { icon:'💎', name:'Crypto',                 desc:'Bitcoin + select alts — long-term holds', amount:'$—',     status:'active',   color:'#f5a623' },
    { icon:'🎸', name:'Music / Performances',   desc:'Bar gigs, tips, session work',            amount:'$—',     status:'side',     color:'#f06292' },
    { icon:'🌐', name:'Future: Content',        desc:'YouTube, newsletter, audience monetisation','$0',           status:'planned',  color:'var(--muted)' },
    { icon:'🏠', name:'Future: Real Estate',    desc:'Rental income — long-term target',        amount:'$0',     status:'planned',  color:'var(--muted)' },
  ];

  const INVESTMENTS = [
    { ticker:'VOO',  name:'Vanguard S&P 500 ETF',       type:'Index',    note:'Core holding — 60% of portfolio' },
    { ticker:'VTI',  name:'Vanguard Total Market ETF',   type:'Index',    note:'Broad US market exposure' },
    { ticker:'VXUS', name:'Vanguard Total International', type:'Index',   note:'International diversification' },
    { ticker:'BTC',  name:'Bitcoin',                     type:'Crypto',   note:'Digital store of value — long hold' },
    { ticker:'ETH',  name:'Ethereum',                    type:'Crypto',   note:'Smart contract infrastructure play' },
  ];

  const PRINCIPLES = [
    { title:'Pay Yourself First',    body:'Automate a fixed % of income to investments before spending. Remove the decision.' },
    { title:'DCA Into Index Funds',  body:'Don\'t time the market. Buy consistently. Time in market beats timing the market.' },
    { title:'MRR is the Engine',     body:'Every $1 of recurring revenue is worth more than $1 of one-time income. Build the recurring base first.' },
    { title:'Multiple Streams',      body:'Envosta → Index Funds → Crypto → Content → Real Estate. Build in sequence, not simultaneously.' },
    { title:'No Lifestyle Inflation', body:'As income grows, increase investments before increasing spending. Delay gratification and compound.' },
  ];

  /* ── Build HTML ── */
  const inner = document.getElementById('wealth-inner');
  inner.innerHTML = `
    ${buildPageHeader('Financial System', 'Wealth', 'Dashboard', 'Build recurring revenue. Invest the surplus. Let time do the rest.',
      `<span class="badge badge-warn">Target: $50K MRR</span>`
    )}

    <!-- MRR Hero -->
    <div class="card">
      <div class="mrr-display">
        <div class="mrr-label">Monthly Recurring Revenue</div>
        <div class="mrr-amount" id="mrrAmount">${formatCurrency(MRR_CURRENT)}</div>
        <div class="mrr-sub">Target: ${formatCurrency(MRR_TARGET)} / mo · ${MRR_CURRENT === 0 ? 'Pre-revenue' : Math.round((MRR_CURRENT/MRR_TARGET)*100)+'% there'}</div>
      </div>
      <div class="mrr-progress-wrap">
        <div class="mrr-progress-labels">
          <span>$0</span>
          <span>$10K</span>
          <span>$25K</span>
          <span>$50K</span>
        </div>
        <div class="progress-track" style="height:10px">
          <div class="progress-fill" style="width:${progressPct(MRR_CURRENT, MRR_TARGET)};background:var(--accent)"></div>
        </div>
      </div>
    </div>

    <!-- MRR Milestones -->
    <div class="card">
      <div class="card-header"><div class="card-title">MRR Milestones</div></div>
      <div class="card-body">
        ${[
          { amount:1000,  label:'$1K MRR — Proof of demand',       pct:2   },
          { amount:5000,  label:'$5K MRR — Covers base expenses',   pct:10  },
          { amount:10000, label:'$10K MRR — Stage 1 graduation',    pct:20  },
          { amount:25000, label:'$25K MRR — Half way',              pct:50  },
          { amount:50000, label:'$50K MRR — North Star 🎯',         pct:100 },
        ].map(m => `
          <div style="margin-bottom:14px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
              <span style="font-size:12.5px;color:rgba(226,234,242,0.82)">${m.label}</span>
              <span style="font-family:'Rajdhani',sans-serif;font-size:12px;font-weight:700;color:${MRR_CURRENT >= m.amount ? 'var(--success)' : 'var(--muted)'}">${MRR_CURRENT >= m.amount ? '✓ Done' : formatCurrency(m.amount)}</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width:${progressPct(MRR_CURRENT, m.amount)}"></div>
            </div>
          </div>`).join('')}
      </div>
    </div>

    <!-- Income Streams Grid -->
    <div>
      <div class="section-label">Income Streams</div>
      <div class="grid-2">
        <div class="card">
          <div class="card-header"><div class="card-title">Active & Building</div></div>
          <div class="card-body">
            ${INCOME_STREAMS.filter(s=>s.status!=='planned').map(s=>`
              <div class="income-stream">
                <div class="income-icon">${s.icon}</div>
                <div class="income-info">
                  <div class="income-name">${s.name}</div>
                  <div class="income-desc">${s.desc}</div>
                </div>
                <div class="income-amount" style="color:${s.color}">${s.amount}</div>
              </div>`).join('')}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">Planned — Future Phases</div></div>
          <div class="card-body">
            ${INCOME_STREAMS.filter(s=>s.status==='planned').map(s=>`
              <div class="income-stream" style="opacity:.6">
                <div class="income-icon">${s.icon}</div>
                <div class="income-info">
                  <div class="income-name">${s.name}</div>
                  <div class="income-desc">${s.desc}</div>
                </div>
                <span class="badge badge-muted">Planned</span>
              </div>`).join('')}
            <div style="margin-top:14px;padding:12px;background:rgba(245,200,66,0.06);border:1px solid rgba(245,200,66,0.15);border-radius:8px;font-size:12px;color:rgba(226,234,242,0.65);line-height:1.6">
              Build streams sequentially. Envosta first — get it to $10K MRR before splitting focus.
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Investments -->
    <div class="grid-2">
      <div class="card">
        <div class="card-header"><div class="card-title">Investment Portfolio</div></div>
        <div class="card-body">
          ${INVESTMENTS.map(inv=>`
            <div class="investment-row">
              <div class="inv-ticker">${inv.ticker}</div>
              <div>
                <div style="font-size:12.5px;font-weight:500">${inv.name}</div>
                <div class="inv-name">${inv.note}</div>
              </div>
              <span class="badge badge-muted">${inv.type}</span>
            </div>`).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">Wealth Principles</div></div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:12px">
          ${PRINCIPLES.map(p=>`
            <div>
              <div style="font-family:'Rajdhani',sans-serif;font-size:12px;font-weight:700;letter-spacing:0.5px;color:var(--accent);margin-bottom:3px">${p.title}</div>
              <div style="font-size:12px;color:rgba(226,234,242,0.7);line-height:1.55">${p.body}</div>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
});
