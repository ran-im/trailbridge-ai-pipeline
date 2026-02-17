import { generateSyntheticData, getDataSummary } from './data.js';
import { MODEL, buildScoutPrompt, buildCompassPrompt, buildTrailheadPrompt, buildEvaluatorPrompt } from './agents.js';

const API_URL = 'https://api.anthropic.com/v1/messages';

function getApiKey() {
  const apiKey = sessionStorage.getItem('anthropic_api_key');
  if (!apiKey) throw new Error('No API key set. Please enter your key first.');
  return apiKey;
}

function parseAgentJSON(rawResponse) {
  try {
    const raw = rawResponse.content[0].text;
    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('JSON parse failed. Raw response:', rawResponse);
    throw new Error(`Agent response was not valid JSON: ${err.message}`);
  }
}

async function callAgent(systemPrompt, userPrompt, onProgress) {
  const apiKey = getApiKey();
  
  const messages = [
    { role: 'user', content: userPrompt }
  ];

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: messages
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error: ${response.status} - ${error}`);
  }

  return response.json();
}

async function runPipeline(onProgress = () => {}) {
  onProgress({ stage: 'data', message: 'Generating synthetic session data...', percent: 5 });
  
  const sessions = generateSyntheticData();
  const dataSummary = getDataSummary(sessions);
  
  onProgress({ stage: 'scout', message: 'Running Scout (Researcher)...', percent: 20 });
  
  const scoutPrompt = buildScoutPrompt(sessions, dataSummary);
  const scoutResponse = await callAgent(
    'You are Scout, the Researcher archetype. Output valid JSON only.', 
    scoutPrompt
  );
  const scoutOutput = parseAgentJSON(scoutResponse);
  
  onProgress({ stage: 'compass', message: 'Running Compass (Designer)...', percent: 45 });
  
  const compassPrompt = buildCompassPrompt(scoutOutput);
  const compassResponse = await callAgent(
    'You are Compass, the Designer archetype. Output valid JSON only.', 
    compassPrompt
  );
  const compassOutput = parseAgentJSON(compassResponse);
  
  onProgress({ stage: 'trailhead', message: 'Running Trailhead (Communicator)...', percent: 70 });
  
  const trailheadPrompt = buildTrailheadPrompt(compassOutput);
  const trailheadResponse = await callAgent(
    'You are Trailhead, the Communicator archetype. Output valid JSON only.', 
    trailheadPrompt
  );
  const trailheadOutput = parseAgentJSON(trailheadResponse);
  
  onProgress({ stage: 'evaluator', message: 'Evaluating pipeline results...', percent: 85 });
  
  const evaluatorPrompt = buildEvaluatorPrompt(scoutOutput, compassOutput, trailheadOutput);
  const evaluatorResponse = await callAgent(
    'You are the Evaluator. Output valid JSON only.', 
    evaluatorPrompt
  );
  const evaluatorOutput = parseAgentJSON(evaluatorResponse);
  
  onProgress({ stage: 'complete', message: 'Pipeline complete!', percent: 100 });
  
  return {
    sessions,
    dataSummary,
    scoutOutput,
    compassOutput,
    trailheadOutput,
    evaluatorOutput
  };
}

export { runPipeline, generateSyntheticData, getDataSummary };
