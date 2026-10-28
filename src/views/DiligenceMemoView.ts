import { store } from '../framework/store';
import { calculateRiskAssessment } from '../engine/scorer';

export function renderDiligenceMemoView(): HTMLElement {
  const state = store.getState();
  const startup = store.getSelectedStartup();
  const assessment = calculateRiskAssessment(startup, state.stressScenario);
  const report = state.aiReports[startup.id];

  const root = document.createElement('div');
  root.className = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6';

  // Header Block
  const header = document.createElement('div');
  header.className = 'flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-5';

  header.innerHTML = `
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-slate-100">AI Investment Committee & CBT Diligence Memo</h1>
      <div class="flex items-center gap-2 text-xs text-slate-400 mt-1">
        <span>Target: <strong class="text-slate-200">${startup.name}</strong></span>
        <span aria-hidden="true">·</span>
        <span>${startup.stage} ${startup.sector}</span>
        <span aria-hidden="true">·</span>
        <span>Asking: $${(startup.askingValuation / 1000000).toFixed(1)}M</span>
        <span aria-hidden="true">·</span>
        <span>Engine: Gemini 3.8 Flash</span>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <select id="memo-startup-select" class="bg-[#0f172a] border border-slate-700 text-slate-200 text-xs rounded-md px-3 py-1.5 focus:outline-none">
        ${state.startups
          .map((s) => `<option value="${s.id}" ${s.id === startup.id ? 'selected' : ''}>${s.name}</option>`)
          .join('')}
      </select>
      <button id="generate-ai-memo-btn" class="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-md transition-colors whitespace-nowrap cursor-pointer shadow-sm flex items-center gap-2 ${
        state.isAiLoading ? 'opacity-70 cursor-not-allowed' : ''
      }">
        ${state.isAiLoading ? 'Auditing with Gemini...' : report ? 'Regenerate Diligence Memo' : 'Generate Partner Memo'}
      </button>
    </div>
  `;

  header.querySelector('#memo-startup-select')?.addEventListener('change', (e: any) => {
    store.setSelectedStartup(e.target.value);
  });

  header.querySelector('#generate-ai-memo-btn')?.addEventListener('click', () => {
    if (!state.isAiLoading) {
      store.requestAIDiligence(startup.id);
    }
  });

  // Main Content Area
  const content = document.createElement('div');

  if (state.isAiLoading) {
    // Clean skeleton matching layout
    content.className = 'bg-[#0f172a] border border-slate-800 rounded-lg p-8 space-y-6 animate-pulse';
    content.innerHTML = `
      <div class="h-6 bg-slate-800 rounded w-1/3"></div>
      <div class="h-4 bg-slate-800/60 rounded w-3/4"></div>
      <div class="grid grid-cols-2 gap-4 pt-4">
        <div class="h-28 bg-slate-800/40 rounded"></div>
        <div class="h-28 bg-slate-800/40 rounded"></div>
      </div>
      <div class="space-y-3 pt-4">
        <div class="h-4 bg-slate-800/40 rounded w-full"></div>
        <div class="h-4 bg-slate-800/40 rounded w-5/6"></div>
        <div class="h-4 bg-slate-800/40 rounded w-4/6"></div>
      </div>
      <div class="text-center text-xs text-sky-400 font-mono pt-4">
        Running Gemini 3.8 Flash Cognitive & Financial Diligence synthesis...
      </div>
    `;
  } else if (!report) {
    // Empty state with explanation and direct action
    content.className = 'bg-[#0f172a] border border-slate-800 rounded-lg p-12 text-center space-y-4';
    content.innerHTML = `
      <div class="max-w-md mx-auto space-y-2">
        <div class="w-12 h-12 mx-auto rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-sky-400 text-lg font-bold">
          IC
        </div>
        <h3 class="text-base font-bold text-slate-200">No Diligence Memo Generated Yet</h3>
        <p class="text-xs text-slate-400 leading-relaxed">
          Generate an institutional-grade investment committee memo synthesized by Gemini 3.8 Flash.
          The analysis cross-examines ${startup.name}'s ${startup.burnMultiple}x burn multiple, $${(startup.arr / 1000000).toFixed(2)}M ARR, and cognitive behavioral traits to surface hidden downside risks.
        </p>
        <div class="pt-2">
          <button id="run-first-memo-btn" class="px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-md transition-colors cursor-pointer shadow-sm">
            Generate AI Investment Memo
          </button>
        </div>
      </div>
    `;
    content.querySelector('#run-first-memo-btn')?.addEventListener('click', () => {
      store.requestAIDiligence(startup.id);
    });
  } else {
    // Populated state with rich structured analysis
    content.className = 'bg-[#0f172a] border border-slate-800 rounded-lg p-6 sm:p-8 space-y-6';

    const isPass = report.investmentVerdict.includes('PASS');
    const isConviction = report.investmentVerdict.includes('CONVICTION');

    let verdictColor = 'text-amber-400 border-amber-500/30 bg-amber-950/20';
    if (isConviction) {
      verdictColor = 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20';
    } else if (isPass) {
      verdictColor = 'text-rose-400 border-rose-500/30 bg-rose-950/20';
    }

    content.innerHTML = `
      <!-- Verdict & Header Banner -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border ${verdictColor}">
        <div>
          <div class="text-[11px] uppercase tracking-wider font-semibold opacity-80">Investment Committee Verdict</div>
          <div class="text-xl font-extrabold tracking-tight mt-0.5">${report.investmentVerdict}</div>
        </div>
        <div class="text-right sm:text-right">
          <div class="text-[11px] text-slate-400">Recommended Valuation Boundary</div>
          <div class="text-base font-mono tabular-nums font-bold text-slate-200 mt-0.5">${report.recommendedValuationCap}</div>
        </div>
      </div>

      <!-- Executive Thesis -->
      <div class="space-y-1.5">
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Executive Synthesis</h3>
        <p class="text-sm text-slate-300 leading-relaxed font-normal">${report.executiveSummary}</p>
      </div>

      <!-- CBT Behavioral Trait Audit -->
      <div class="space-y-3 pt-4 border-t border-slate-800">
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">CBT Cognitive Bias Diagnostic</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div class="bg-[#090d16] p-4 rounded border border-slate-800/80 space-y-1">
            <div class="font-semibold text-slate-200">Founder Bias Diagnosis</div>
            <p class="text-slate-400 leading-relaxed">${report.cbtBehavioralAudit.founderBiasDiagnosis}</p>
          </div>
          <div class="bg-[#090d16] p-4 rounded border border-slate-800/80 space-y-1">
            <div class="font-semibold text-slate-200">Execution Bandwidth</div>
            <p class="text-slate-400 leading-relaxed">${report.cbtBehavioralAudit.executionResilience}</p>
          </div>
          <div class="bg-[#090d16] p-4 rounded border border-slate-800/80 space-y-1">
            <div class="font-semibold text-slate-200">Credibility Gap</div>
            <p class="text-slate-400 leading-relaxed">${report.cbtBehavioralAudit.credibilityGap}</p>
          </div>
        </div>
      </div>

      <!-- 4 Contrarian Partner Questions -->
      <div class="space-y-3 pt-4 border-t border-slate-800">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Contrarian Partner Inquiries (For Monday Meeting)</h3>
          <span class="text-[11px] text-slate-500 font-mono">4 Diligence Probes</span>
        </div>
        <div class="space-y-2 text-xs">
          ${report.contrarianPartnerQuestions
            .map(
              (q, idx) => `
              <div class="bg-[#090d16] p-3 rounded border border-slate-800/80 flex items-start gap-3">
                <span class="font-mono text-sky-400 font-bold shrink-0">0${idx + 1}.</span>
                <span class="text-slate-300 leading-relaxed">${q}</span>
              </div>
            `
            )
            .join('')}
        </div>
      </div>

      <!-- Critical Failure Modes -->
      <div class="space-y-3 pt-4 border-t border-slate-800">
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Critical Failure Modes & Downside Triggers</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border border-slate-800 rounded">
            <thead class="bg-[#090d16] text-slate-400 border-b border-slate-800">
              <tr>
                <th class="py-2.5 px-3">Trigger Event</th>
                <th class="py-2.5 px-3">Downside Fallout</th>
                <th class="py-2.5 px-3 text-right">Probability</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 bg-[#090d16]/40">
              ${report.criticalFailureModes
                .map(
                  (fm) => `
                <tr>
                  <td class="py-2.5 px-3 text-slate-200 font-medium">${fm.trigger}</td>
                  <td class="py-2.5 px-3 text-slate-400">${fm.impact}</td>
                  <td class="py-2.5 px-3 text-right font-mono font-semibold ${
                    fm.probability.toLowerCase().includes('high') ? 'text-rose-400' : 'text-amber-400'
                  }">${fm.probability}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Syndicate Terms & Protective Covenants -->
      <div class="space-y-2 pt-4 border-t border-slate-800 text-xs">
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Mandatory Term Sheet Covenants</h3>
        <div class="bg-[#090d16] p-4 rounded border border-slate-800/80 text-slate-300 leading-relaxed font-mono text-[11px]">
          ${report.syndicateTermsRecommendation}
        </div>
      </div>

      <!-- Action Bar: Copy to Clipboard -->
      <div class="pt-4 border-t border-slate-800 flex justify-end">
        <button id="copy-markdown-btn" class="px-3.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors flex items-center gap-2 cursor-pointer">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
          </svg>
          Copy Investment Memo to Clipboard
        </button>
      </div>
    `;

    // Hook up copy to clipboard
    content.querySelector('#copy-markdown-btn')?.addEventListener('click', () => {
      const markdown = `
# Venture Capital Investment Committee Memo: ${startup.name}
**Verdict:** ${report.investmentVerdict}
**Recommended Valuation Boundary:** ${report.recommendedValuationCap}
**Date:** ${new Date().toLocaleDateString()}

## Executive Summary
${report.executiveSummary}

## CBT Cognitive Bias Diagnostic
- **Founder Bias Diagnosis:** ${report.cbtBehavioralAudit.founderBiasDiagnosis}
- **Execution Resilience:** ${report.cbtBehavioralAudit.executionResilience}
- **Credibility Gap:** ${report.cbtBehavioralAudit.credibilityGap}

## Contrarian Partner Inquiries
${report.contrarianPartnerQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

## Critical Failure Modes
${report.criticalFailureModes.map((fm) => `- **${fm.trigger}:** ${fm.impact} (Probability: ${fm.probability})`).join('\n')}

## Mandatory Term Sheet Covenants
${report.syndicateTermsRecommendation}
      `.trim();

      navigator.clipboard.writeText(markdown).then(() => {
        store.showNotification('Copied Investment Committee memo to clipboard', 'success');
      });
    });
  }

  root.appendChild(header);
  root.appendChild(content);

  return root;
}
