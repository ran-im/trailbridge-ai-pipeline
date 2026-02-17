import { runPipeline, generateSyntheticData, getDataSummary } from './pipeline.js';

let pipelineResults = null;

const stages = {
  data: document.getElementById('stageData'),
  scout: document.getElementById('stageScout'),
  compass: document.getElementById('stageCompass'),
  trailhead: document.getElementById('stageTrailhead'),
  evaluator: document.getElementById('stageEvaluator')
};
const progressBar = document.getElementById('progressBar');
const statusMessage = document.getElementById('statusMessage');
const runBtn = document.getElementById('runBtn');
const exportBtn = document.getElementById('exportBtn');
const apiKeyInput = document.getElementById('api-key-input');
const saveKeyBtn = document.getElementById('save-key-btn');
const keyStatus = document.getElementById('key-status');
const recoverySlider = document.getElementById('recoverySlider');
const recoveryRateValue = document.getElementById('recoveryRateValue');

function updateProgress(stage, percent, message) {
  Object.values(stages).forEach(s => s.classList.remove('active', 'complete'));
  
  const stageOrder = ['data', 'scout', 'compass', 'trailhead', 'evaluator'];
  const currentIndex = stageOrder.indexOf(stage);
  
  stageOrder.forEach((s, i) => {
    if (i < currentIndex) stages[s].classList.add('complete');
    if (i === currentIndex) stages[s].classList.add('active');
  });
  
  progressBar.style.width = `${percent}%`;
  statusMessage.textContent = message;
}

function switchTab(tabName) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  
  document.querySelector(`.tab[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById(`tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`).classList.add('active');
}

function renderOverview(dataSummary, scoutOutput) {
  const tab = document.getElementById('tabOverview');
  const abandonRate = dataSummary.abandonment_rate;
  const avgValue = dataSummary.avg_booking_value;
  const monthlyVisitors = 120000;
  const estimatedCarts = Math.floor(monthlyVisitors * (dataSummary.cart_add_rate / 100));
  const estimatedAbandoned = Math.floor(estimatedCarts * (abandonRate / 100));
  const monthlyLoss = estimatedAbandoned * avgValue;
  
  tab.innerHTML = `
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-value">${dataSummary.total_sessions}</div><div class="stat-label">Sessions Analyzed</div></div>
      <div class="stat-card"><div class="stat-value">${dataSummary.cart_add_rate.toFixed(1)}%</div><div class="stat-label">Cart Add Rate</div></div>
      <div class="stat-card"><div class="stat-value">${abandonRate.toFixed(1)}%</div><div class="stat-label">Abandonment Rate</div></div>
      <div class="stat-card"><div class="stat-value">€${avgValue}</div><div class="stat-label">Avg Booking Value</div></div>
      <div class="stat-card"><div class="stat-value">€${monthlyLoss.toLocaleString()}</div><div class="stat-label">Est. Monthly Loss</div></div>
      <div class="stat-card"><div class="stat-value">${dataSummary.top_referral_source}</div><div class="stat-label">Top Referral</div></div>
    </div>
    <div class="card"><div class="card-header"><h3>Key Insight</h3></div><p>${scoutOutput.key_insight}</p></div>
    <div class="card"><div class="card-header"><h3>Funnel Exit Points</h3></div><ul class="funnel-list">${scoutOutput.funnel_exit_points.map(f => `<li class="funnel-item"><div class="funnel-stage">${f.stage.replace('_', ' ')}</div><div class="funnel-percentage">${f.percentage}% - ${f.primary_reason}</div></li>`).join('')}</ul></div>
  `;
}

function renderPersonas(scoutOutput) {
  const tab = document.getElementById('tabPersonas');
  tab.innerHTML = `<div class="persona-grid">${scoutOutput.personas.map(p => `
    <div class="persona-card">
      <h4>${p.name}</h4>
      <div class="persona-characteristics">${p.characteristics.map(c => `<span class="characteristic-tag">${c}</span>`).join('')}</div>
      <p><strong>Behaviour:</strong> ${p.behaviour_pattern}</p>
      <p style="margin-top:0.75rem"><strong>Pain Points:</strong></p>
      <ul>${p.pain_points.map(pt => `<li style="margin-left:1rem;font-size:0.875rem;color:var(--text-secondary)">${pt}</li>`).join('')}</ul>
      <p style="margin-top:1rem"><span class="badge badge-${p.likelihood_to_convert}">${p.likelihood_to_convert} convert</span></p>
    </div>
  `).join('')}</div>`;
}

function renderStrategies(compassOutput) {
  const tab = document.getElementById('tabStrategies');
  tab.innerHTML = `
    <div class="card"><div class="card-header"><h3>Priority Ranking</h3></div><p>${compassOutput.priority_ranking.join(' → ')}</p></div>
    <div class="card"><div class="card-header"><h3>Design Principle</h3></div><p>${compassOutput.key_design_principle}</p></div>
    ${compassOutput.strategies.map(s => `
      <div class="strategy-card">
        <h4 style="color:var(--accent-orange);margin-bottom:1rem">${s.persona_id}</h4>
        <div class="strategy-section"><div class="strategy-label">On-Site Tactic</div><div class="strategy-content"><strong>${s.on_site.tactic}</strong><p style="margin-top:0.5rem;font-size:0.875rem;color:var(--text-secondary)">${s.on_site.implementation}</p><span class="badge badge-${s.on_site.expected_impact}" style="margin-top:0.5rem">${s.on_site.expected_impact} impact</span></div></div>
        <div class="strategy-section"><div class="strategy-label">Off-Site Tactic</div><div class="strategy-content"><strong>${s.off_site.tactic}</strong><p style="margin-top:0.5rem;font-size:0.875rem;color:var(--text-secondary)">${s.off_site.implementation}</p><span class="badge badge-${s.off_site.expected_impact}" style="margin-top:0.5rem">${s.off_site.expected_impact} impact</span></div></div>
      </div>
    `).join('')}
  `;
}

function renderCampaigns(trailheadOutput) {
  const tab = document.getElementById('tabCampaigns');
  tab.innerHTML = `
    <div class="card"><div class="card-header"><h3>Content Theme</h3></div><p>${trailheadOutput.content_theme}</p></div>
    <div class="campaign-grid">${trailheadOutput.campaigns.map(c => `
      <div class="campaign-card">
        <h4>${c.persona_name}</h4>
        <div class="campaign-item"><div class="campaign-label">Email Subject</div><div class="campaign-content">${c.email.subject}</div></div>
        <div class="campaign-item"><div class="campaign-label">Email Body</div><div class="campaign-content">${c.email.body}</div></div>
        <div class="campaign-item"><div class="campaign-label">Push Notification</div><div class="campaign-content"><strong>${c.push_notification.title}</strong><br>${c.push_notification.body}</div></div>
        <div class="campaign-item"><div class="campaign-label">Homepage</div><div class="campaign-content"><strong>${c.homepage_copy.hero_headline}</strong><br><span style="color:var(--accent-teal)">${c.homepage_copy.cta_button}</span></div></div>
      </div>
    `).join('')}</div>
  `;
}

function renderConfidence(evaluatorOutput) {
  const tab = document.getElementById('tabConfidence');
  const getScoreColor = (score) => score >= 70 ? 'var(--success)' : score >= 50 ? 'var(--accent-orange)' : 'var(--error)';
  
  tab.innerHTML = `
    <div class="confidence-grid">
      <div class="confidence-card"><div class="confidence-score" style="color:${getScoreColor(evaluatorOutput.scout_confidence.score)}">${evaluatorOutput.scout_confidence.score}</div><div class="confidence-label">Scout Confidence</div></div>
      <div class="confidence-card"><div class="confidence-score" style="color:${getScoreColor(evaluatorOutput.compass_confidence.score)}">${evaluatorOutput.compass_confidence.score}</div><div class="confidence-label">Compass Confidence</div></div>
      <div class="confidence-card"><div class="confidence-score" style="color:${getScoreColor(evaluatorOutput.trailhead_confidence.score)}">${evaluatorOutput.trailhead_confidence.score}</div><div class="confidence-label">Trailhead Confidence</div></div>
      <div class="confidence-card"><div class="confidence-score" style="color:${getScoreColor(evaluatorOutput.overall_confidence)}">${evaluatorOutput.overall_confidence}</div><div class="confidence-label">Overall Confidence</div></div>
    </div>
    <div class="card"><h3 style="margin-bottom:1rem">Confidence Rationale</h3>
      <p><strong>Scout:</strong> ${evaluatorOutput.scout_confidence.rationale}</p>
      <p style="margin-top:0.5rem"><strong>Compass:</strong> ${evaluatorOutput.compass_confidence.rationale}</p>
      <p style="margin-top:0.5rem"><strong>Trailhead:</strong> ${evaluatorOutput.trailhead_confidence.rationale}</p>
    </div>
    <div class="card"><h3 style="margin-bottom:1rem">Recommendations</h3><ul class="recommendations-list">${evaluatorOutput.recommendations.map(r => `<li>${r}</li>`).join('')}</ul></div>
  `;
}

function updateRevenueCalculator(dataSummary) {
  const abandonRate = dataSummary.abandonment_rate;
  const avgValue = dataSummary.avg_booking_value;
  const monthlyVisitors = 120000;
  const estimatedCarts = Math.floor(monthlyVisitors * (dataSummary.cart_add_rate / 100));
  const estimatedAbandoned = Math.floor(estimatedCarts * (abandonRate / 100));
  const monthlyLoss = estimatedAbandoned * avgValue;
  
  const updateValues = () => {
    const recoveryRate = parseInt(recoverySlider.value);
    recoveryRateValue.textContent = `${recoveryRate}%`;
    
    const recoverable = Math.floor(monthlyLoss * (recoveryRate / 100));
    const annualGain = recoverable * 12;
    
    document.getElementById('currentLoss').textContent = `€${monthlyLoss.toLocaleString()}`;
    document.getElementById('recoveryAmount').textContent = `€${recoverable.toLocaleString()}`;
    document.getElementById('annualGain').textContent = `€${annualGain.toLocaleString()}`;
  };
  
  recoverySlider.addEventListener('input', updateValues);
  updateValues();
}

function handleError(error) {
  statusMessage.textContent = `Error: ${error.message}`;
  statusMessage.style.color = 'var(--error)';
}

// Save Key button
saveKeyBtn.addEventListener('click', function() {
  const key = apiKeyInput.value.trim();
  if (!key) {
    keyStatus.textContent = '❌ Please enter a key';
    keyStatus.style.color = '#ff4444';
    return;
  }
  sessionStorage.setItem('anthropic_api_key', key);
  keyStatus.textContent = '✅ Key saved!';
  keyStatus.style.color = '#14F5D0';
  apiKeyInput.value = '';
  console.log('Saved key:', key.length, 'chars');
});

// Run Pipeline button
runBtn.addEventListener('click', async () => {
  const apiKey = sessionStorage.getItem('anthropic_api_key');
  if (!apiKey) {
    alert('Please save your API key first.');
    return;
  }
  
  runBtn.disabled = true;
  exportBtn.disabled = true;
  
  try {
    pipelineResults = await runPipeline((progress) => {
      updateProgress(progress.stage, progress.percent, progress.message);
      
      if (progress.stage === 'complete') {
        renderOverview(pipelineResults.dataSummary, pipelineResults.scoutOutput);
        renderPersonas(pipelineResults.scoutOutput);
        renderStrategies(pipelineResults.compassOutput);
        renderCampaigns(pipelineResults.trailheadOutput);
        renderConfidence(pipelineResults.evaluatorOutput);
        updateRevenueCalculator(pipelineResults.dataSummary);
        
        runBtn.disabled = false;
        exportBtn.disabled = false;
        switchTab('overview');
      }
    });
  } catch (error) {
    handleError(error);
    runBtn.disabled = false;
  }
});

// Export button
exportBtn.addEventListener('click', () => {
  window.print();
});

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => switchTab(tab.dataset.tab));
});
