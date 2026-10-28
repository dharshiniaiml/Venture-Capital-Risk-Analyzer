import {
  Startup,
  RiskAssessment,
  RiskTier,
  StressTestScenario,
  RadarAxis,
  TornadoItem,
  MonteCarloSimulation,
} from './types';

// Baseline Cohort Benchmarks (Median and Top Decile for Venture-backed Startups)
export const COHORT_BENCHMARKS = {
  burnMultiple: { median: 1.6, topDecile: 0.9 },
  cacPaybackMonths: { median: 14, topDecile: 8 },
  netDollarRetention: { median: 108, topDecile: 125 },
  grossMargin: { median: 72, topDecile: 82 },
  runwayMonths: { median: 15, topDecile: 22 },
  cbtBiasComposite: { median: 45, topDecile: 22 },
};

/**
 * Computes pure composite risk score without triggering recursive simulations
 */
export function calculateCompositeScoreOnly(
  startup: Startup,
  scen: StressTestScenario = {
    marketDownturn: 0,
    cacInflation: 0,
    churnSpike: 0,
    roundDelayMonths: 0,
    founderFriction: 0,
  }
): number {
  const cbtRaw =
    startup.cbtTraits.tamDelusion * 0.22 +
    startup.cbtTraits.sunkCostAnchor * 0.20 +
    startup.cbtTraits.founderOmniscience * 0.18 +
    startup.cbtTraits.churnBlindspot * 0.18 +
    startup.cbtTraits.burnApathy * 0.12 +
    startup.cbtTraits.keyManDependency * 0.10;

  const cbtCognitiveScore = Math.min(
    100,
    Math.round(cbtRaw * (1 + scen.founderFriction / 100))
  );

  const burnMultipleRisk = Math.min(100, Math.max(0, (startup.burnMultiple - 0.8) * 35));
  const effectiveCacPayback = startup.cacPaybackMonths * (1 + scen.cacInflation / 100);
  const cacPaybackRisk = Math.min(100, Math.max(0, (effectiveCacPayback - 6) * 4.5));
  const effectiveNdr = startup.netDollarRetention - scen.churnSpike;
  const ndrRisk = Math.min(100, Math.max(0, (130 - effectiveNdr) * 2.2));
  const marginRisk = Math.min(100, Math.max(0, (85 - startup.grossMargin) * 2.5));

  const unitEconomicsScore = Math.min(
    100,
    Math.round(
      burnMultipleRisk * 0.35 +
      cacPaybackRisk * 0.25 +
      ndrRisk * 0.25 +
      marginRisk * 0.15
    )
  );

  const effectiveMonthlyBurn = startup.monthlyBurn * (1 + scen.cacInflation * 0.25 / 100);
  const effectiveRunway = Math.max(
    1,
    (startup.cashBalance / effectiveMonthlyBurn) - scen.roundDelayMonths
  );
  let runwayStressScore = 0;
  if (effectiveRunway <= 6) {
    runwayStressScore = 95 - (effectiveRunway * 4);
  } else if (effectiveRunway <= 12) {
    runwayStressScore = 75 - ((effectiveRunway - 6) * 5);
  } else if (effectiveRunway <= 18) {
    runwayStressScore = 45 - ((effectiveRunway - 12) * 3.5);
  } else {
    runwayStressScore = Math.max(8, 25 - ((effectiveRunway - 18) * 1.5));
  }
  runwayStressScore = Math.min(100, Math.round(runwayStressScore));

  const effectiveGrowth = Math.max(0, startup.growthRate * (1 - scen.marketDownturn / 100));
  const growthRisk = Math.min(100, Math.max(0, (120 - effectiveGrowth) * 0.8));
  const tamMoatRisk = startup.cbtTraits.tamDelusion * 0.5 + startup.cbtTraits.churnBlindspot * 0.5;
  const marketMoatScore = Math.min(100, Math.round(growthRisk * 0.5 + tamMoatRisk * 0.5));

  let govScore = 15;
  if (startup.deadEquityPercent > 10) {
    govScore += (startup.deadEquityPercent - 10) * 3;
  }
  if (startup.founderEquityPercent < 55) {
    govScore += (55 - startup.founderEquityPercent) * 1.8;
  }
  govScore += startup.cbtTraits.founderOmniscience * 0.3;
  const governanceScore = Math.min(100, Math.round(govScore));

  return Math.min(
    100,
    Math.round(
      cbtCognitiveScore * 0.28 +
      unitEconomicsScore * 0.26 +
      runwayStressScore * 0.22 +
      marketMoatScore * 0.14 +
      governanceScore * 0.10
    )
  );
}

/**
 * Calculates the comprehensive CBT & Quantitative Risk Assessment for a startup
 */
export function calculateRiskAssessment(
  startup: Startup,
  scenario?: StressTestScenario
): RiskAssessment {
  const scen = scenario || {
    marketDownturn: 0,
    cacInflation: 0,
    churnSpike: 0,
    roundDelayMonths: 0,
    founderFriction: 0,
  };

  // 1. CBT Cognitive Behavioral Risk Score (0-100, higher = higher risk)
  const cbtRaw =
    startup.cbtTraits.tamDelusion * 0.22 +
    startup.cbtTraits.sunkCostAnchor * 0.20 +
    startup.cbtTraits.founderOmniscience * 0.18 +
    startup.cbtTraits.churnBlindspot * 0.18 +
    startup.cbtTraits.burnApathy * 0.12 +
    startup.cbtTraits.keyManDependency * 0.10;

  const cbtCognitiveScore = Math.min(
    100,
    Math.round(cbtRaw * (1 + scen.founderFriction / 100))
  );

  // 2. Unit Economics Risk Score (0-100)
  const burnMultipleRisk = Math.min(100, Math.max(0, (startup.burnMultiple - 0.8) * 35));
  const effectiveCacPayback = startup.cacPaybackMonths * (1 + scen.cacInflation / 100);
  const cacPaybackRisk = Math.min(100, Math.max(0, (effectiveCacPayback - 6) * 4.5));
  const effectiveNdr = startup.netDollarRetention - scen.churnSpike;
  const ndrRisk = Math.min(100, Math.max(0, (130 - effectiveNdr) * 2.2));
  const marginRisk = Math.min(100, Math.max(0, (85 - startup.grossMargin) * 2.5));

  const unitEconomicsScore = Math.min(
    100,
    Math.round(
      burnMultipleRisk * 0.35 +
      cacPaybackRisk * 0.25 +
      ndrRisk * 0.25 +
      marginRisk * 0.15
    )
  );

  // 3. Runway & Liquidity Buffer Risk (0-100)
  const effectiveMonthlyBurn = startup.monthlyBurn * (1 + scen.cacInflation * 0.25 / 100);
  const effectiveRunway = Math.max(
    1,
    (startup.cashBalance / effectiveMonthlyBurn) - scen.roundDelayMonths
  );
  let runwayStressScore = 0;
  if (effectiveRunway <= 6) {
    runwayStressScore = 95 - (effectiveRunway * 4);
  } else if (effectiveRunway <= 12) {
    runwayStressScore = 75 - ((effectiveRunway - 6) * 5);
  } else if (effectiveRunway <= 18) {
    runwayStressScore = 45 - ((effectiveRunway - 12) * 3.5);
  } else {
    runwayStressScore = Math.max(8, 25 - ((effectiveRunway - 18) * 1.5));
  }
  runwayStressScore = Math.min(100, Math.round(runwayStressScore));

  // 4. Market & Defensibility Moat Risk (0-100)
  const effectiveGrowth = Math.max(0, startup.growthRate * (1 - scen.marketDownturn / 100));
  const growthRisk = Math.min(100, Math.max(0, (120 - effectiveGrowth) * 0.8));
  const tamMoatRisk = startup.cbtTraits.tamDelusion * 0.5 + startup.cbtTraits.churnBlindspot * 0.5;
  const marketMoatScore = Math.min(100, Math.round(growthRisk * 0.5 + tamMoatRisk * 0.5));

  // 5. Governance & Cap Table Dilution Risk (0-100)
  let govScore = 15;
  if (startup.deadEquityPercent > 10) {
    govScore += (startup.deadEquityPercent - 10) * 3;
  }
  if (startup.founderEquityPercent < 55) {
    govScore += (55 - startup.founderEquityPercent) * 1.8;
  }
  govScore += startup.cbtTraits.founderOmniscience * 0.3;
  const governanceScore = Math.min(100, Math.round(govScore));

  // Composite Weighted Risk Index
  const composite = Math.min(
    100,
    Math.round(
      cbtCognitiveScore * 0.28 +
      unitEconomicsScore * 0.26 +
      runwayStressScore * 0.22 +
      marketMoatScore * 0.14 +
      governanceScore * 0.10
    )
  );

  // Letter Grade and Tier
  let letterGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  let riskTier: RiskTier;

  if (composite < 25) {
    letterGrade = 'A+';
    riskTier = 'Low Risk';
  } else if (composite < 40) {
    letterGrade = 'A';
    riskTier = 'Low Risk';
  } else if (composite < 58) {
    letterGrade = 'B';
    riskTier = 'Moderate Risk';
  } else if (composite < 75) {
    letterGrade = 'C';
    riskTier = 'High Risk';
  } else if (composite < 88) {
    letterGrade = 'D';
    riskTier = 'Critical Risk';
  } else {
    letterGrade = 'F';
    riskTier = 'Critical Risk';
  }

  // Radar Axes (0-100 scale of risk)
  const radarAxes: RadarAxis[] = [
    {
      label: 'CBT Cognitive Bias',
      key: 'cbt',
      score: cbtCognitiveScore,
      benchmarkMedian: 45,
      topDecile: 22,
    },
    {
      label: 'Burn Multiple Risk',
      key: 'burn',
      score: Math.round(burnMultipleRisk),
      benchmarkMedian: 48,
      topDecile: 20,
    },
    {
      label: 'Runway Depletion',
      key: 'runway',
      score: runwayStressScore,
      benchmarkMedian: 42,
      topDecile: 18,
    },
    {
      label: 'Net Churn / NDR',
      key: 'ndr',
      score: Math.round(ndrRisk),
      benchmarkMedian: 46,
      topDecile: 15,
    },
    {
      label: 'CAC Payback Friction',
      key: 'cac',
      score: Math.round(cacPaybackRisk),
      benchmarkMedian: 50,
      topDecile: 25,
    },
    {
      label: 'Cap Table Governance',
      key: 'gov',
      score: governanceScore,
      benchmarkMedian: 35,
      topDecile: 15,
    },
  ];

  // Identify Key Risk Driver
  let keyRiskDriver = 'Founder Cognitive Sunk Cost Overhang';
  if (runwayStressScore >= 70) {
    keyRiskDriver = `Critical Runway Shortfall (${effectiveRunway.toFixed(1)} mo. buffer)`;
  } else if (cbtCognitiveScore >= 65) {
    keyRiskDriver = 'Founder Omniscience & Sunk Cost Bias';
  } else if (burnMultipleRisk >= 65) {
    keyRiskDriver = `Severe Capital Inefficiency (${startup.burnMultiple}x Burn Multiple)`;
  } else if (ndrRisk >= 60) {
    keyRiskDriver = `Cohort Retention Deterioration (${effectiveNdr}% NDR)`;
  }

  // Top Mitigation Strategy
  let topMitigation = 'Implement strict milestone-based capital tranches';
  if (runwayStressScore >= 65) {
    topMitigation = 'Immediate 25% non-headcount expense curtailment to stretch runway beyond 18 months.';
  } else if (cbtCognitiveScore >= 60) {
    topMitigation = 'Board mandate for independent VP Operations hire and structured kill-criteria for non-core R&D.';
  } else if (startup.deadEquityPercent > 8) {
    topMitigation = 'Recapitalization restructuring to reclaim dead equity into unallocated employee option pool.';
  }

  // Monte Carlo Simulation
  const simulation = runMonteCarloSimulation(startup, effectiveMonthlyBurn, effectiveRunway, scen);

  // Tornado Sensitivity Calculation
  const tornado = calculateTornadoSensitivity(startup, composite, scen);

  return {
    compositeRiskScore: composite,
    riskTier,
    letterGrade,
    cbtCognitiveScore,
    unitEconomicsScore,
    runwayStressScore,
    marketMoatScore,
    governanceScore,
    radarAxes,
    tornado,
    simulation,
    keyRiskDriver,
    topMitigation,
  };
}

/**
 * Monte Carlo Simulation: 1,000 iterations over 24 months
 * Incorporates Gaussian noise, churn shocks, and cash balance evolution.
 */
function runMonteCarloSimulation(
  startup: Startup,
  initialMonthlyBurn: number,
  baseRunwayMonths: number,
  scenario: StressTestScenario
): MonteCarloSimulation {
  const iterations = 1000;
  let failuresAt12Mo = 0;
  let failuresAt24Mo = 0;
  const simulatedRunways: number[] = [];
  const trajectoryPaths: number[][] = [];

  const startingCash = Math.max(100000, startup.cashBalance);

  for (let i = 0; i < iterations; i++) {
    let currentCash = startingCash;
    let monthlyBurn = initialMonthlyBurn;
    let failedMonth = -1;
    const path: number[] = [startingCash];

    // Simulate 24 months
    for (let m = 1; m <= 24; m++) {
      // Stochastic macroeconomic & execution variance (Box-Muller gaussian)
      const u1 = Math.max(0.0001, Math.random());
      const u2 = Math.random();
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

      // Churn shock possibility (10% chance per quarter of a contract loss)
      const churnShock = Math.random() < 0.08 ? 1.25 : 1.0;

      // Burn drift
      const burnVariance = 1 + z * 0.08 + (scenario.cacInflation / 200);
      monthlyBurn = Math.max(10000, monthlyBurn * burnVariance * churnShock);

      currentCash -= monthlyBurn;

      if (currentCash <= 0 && failedMonth === -1) {
        failedMonth = m;
        currentCash = 0;
      }

      if (i < 30) {
        // Collect sampled paths for canvas visualization
        path.push(Math.max(0, currentCash));
      }
    }

    if (i < 30) {
      trajectoryPaths.push(path);
    }

    if (failedMonth > 0 && failedMonth <= 12) {
      failuresAt12Mo++;
    }
    if (failedMonth > 0 && failedMonth <= 24) {
      failuresAt24Mo++;
    }

    const calculatedRunway = failedMonth > 0 ? failedMonth : 24 + (currentCash / (monthlyBurn || 1));
    simulatedRunways.push(calculatedRunway);
  }

  simulatedRunways.sort((a, b) => a - b);
  const p10 = simulatedRunways[Math.floor(iterations * 0.10)];
  const median = simulatedRunways[Math.floor(iterations * 0.50)];
  const p90 = simulatedRunways[Math.floor(iterations * 0.90)];

  return {
    failureProbability12Mo: Math.round((failuresAt12Mo / iterations) * 100),
    failureProbability24Mo: Math.round((failuresAt24Mo / iterations) * 100),
    medianRunwayRemaining: Number(median.toFixed(1)),
    p10Runway: Number(p10.toFixed(1)),
    p90Runway: Number(p90.toFixed(1)),
    trajectoryPaths,
  };
}

/**
 * Calculates sensitivity of composite risk to single parameter swings (+/- 25%)
 */
function calculateTornadoSensitivity(
  startup: Startup,
  baseRisk: number,
  scenario?: StressTestScenario
): TornadoItem[] {
  const variables: Array<{
    name: string;
    modify: (s: Startup, dir: 'up' | 'down') => Startup;
  }> = [
    {
      name: 'Burn Multiple (+/- 30%)',
      modify: (s, dir) => ({
        ...s,
        burnMultiple: dir === 'up' ? s.burnMultiple * 1.3 : s.burnMultiple * 0.7,
      }),
    },
    {
      name: 'CBT Founder Omniscience',
      modify: (s, dir) => ({
        ...s,
        cbtTraits: {
          ...s.cbtTraits,
          founderOmniscience:
            dir === 'up'
              ? Math.min(100, s.cbtTraits.founderOmniscience + 30)
              : Math.max(0, s.cbtTraits.founderOmniscience - 30),
        },
      }),
    },
    {
      name: 'Net Dollar Retention (+/- 15%)',
      modify: (s, dir) => ({
        ...s,
        netDollarRetention: dir === 'up' ? s.netDollarRetention - 15 : s.netDollarRetention + 15,
      }),
    },
    {
      name: 'CAC Payback (+/- 6 mo)',
      modify: (s, dir) => ({
        ...s,
        cacPaybackMonths: dir === 'up' ? s.cacPaybackMonths + 6 : Math.max(3, s.cacPaybackMonths - 6),
      }),
    },
    {
      name: 'Sunk Cost Anchor Bias',
      modify: (s, dir) => ({
        ...s,
        cbtTraits: {
          ...s.cbtTraits,
          sunkCostAnchor:
            dir === 'up'
              ? Math.min(100, s.cbtTraits.sunkCostAnchor + 30)
              : Math.max(0, s.cbtTraits.sunkCostAnchor - 30),
        },
      }),
    },
  ];

  const results: TornadoItem[] = variables.map((v) => {
    const startupUp = v.modify({ ...startup, cbtTraits: { ...startup.cbtTraits } }, 'up');
    const startupDown = v.modify({ ...startup, cbtTraits: { ...startup.cbtTraits } }, 'down');

    const riskUp = calculateCompositeScoreOnly(startupUp, scenario);
    const riskDown = calculateCompositeScoreOnly(startupDown, scenario);

    const swing = Math.abs(riskUp - riskDown);

    return {
      variable: v.name,
      swingImpact: swing,
      baseRisk,
      downRisk: riskDown,
      upRisk: riskUp,
    };
  });

  return results.sort((a, b) => b.swingImpact - a.swingImpact);
}
