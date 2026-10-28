export type Sector = 'AI & Agents' | 'DeepTech Robotics' | 'Enterprise SaaS' | 'Fintech' | 'ClimateTech' | 'BioTech';
export type Stage = 'Pre-Seed' | 'Seed' | 'Series A' | 'Series B';
export type RiskTier = 'Low Risk' | 'Moderate Risk' | 'High Risk' | 'Critical Risk';

export interface CBTTraitScores {
  tamDelusion: number;        // 0-100: Overconfidence in total addressable market sizing
  sunkCostAnchor: number;     // 0-100: Reluctance to sunset failing features or pivot
  founderOmniscience: number; // 0-100: Micromanagement, low delegation bandwidth
  churnBlindspot: number;     // 0-100: Denial of customer friction & churn signals
  burnApathy: number;         // 0-100: High burn tolerance, vanity expenditure bias
  keyManDependency: number;   // 0-100: Vulnerability to single technical founder loss
}

export interface QuantitativeMetrics {
  arr: number;                     // Annual Recurring Revenue in USD
  growthRate: number;              // Year-over-Year Growth %
  monthlyBurn: number;             // Monthly Net Cash Burn in USD
  cashBalance: number;             // Current Cash in Bank in USD
  runwayMonths: number;            // Current runway in months
  netDollarRetention: number;      // NDR in % (e.g. 115%)
  grossMargin: number;             // Gross margin in % (e.g. 74%)
  cacPaybackMonths: number;        // CAC Payback Period in months
  burnMultiple: number;            // Net Burn / Net New ARR (e.g. 1.6x)
  founderEquityPercent: number;    // % equity held by active founders
  deadEquityPercent: number;       // % equity held by departed cofounders/advisors
  capitalRaised: number;           // Total equity capital raised to date
  askingValuation: number;         // Current post-money valuation expectation
}

export interface Startup extends QuantitativeMetrics {
  id: string;
  name: string;
  tagline: string;
  sector: Sector;
  stage: Stage;
  foundingYear: number;
  teamSize: number;
  headquarters: string;
  cbtTraits: CBTTraitScores;
  diligenceNotes: string;
}

export interface RadarAxis {
  label: string;
  key: string;
  score: number;             // 0-100 (where higher = higher risk)
  benchmarkMedian: number;   // Cohort median
  topDecile: number;         // Top decile resilience
}

export interface TornadoItem {
  variable: string;
  swingImpact: number;       // Risk delta in points
  downRisk: number;
  baseRisk: number;
  upRisk: number;
}

export interface MonteCarloSimulation {
  failureProbability12Mo: number; // 0-100%
  failureProbability24Mo: number; // 0-100%
  medianRunwayRemaining: number;  // in months
  p10Runway: number;              // 10th percentile conservative runway
  p90Runway: number;              // 90th percentile optimistic runway
  trajectoryPaths: number[][];    // 40 sampled simulation paths across 24 months
}

export interface RiskAssessment {
  compositeRiskScore: number;     // 0-100 (0=impregnable, 100=extreme hazard)
  riskTier: RiskTier;
  letterGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  cbtCognitiveScore: number;      // 0-100
  unitEconomicsScore: number;     // 0-100
  runwayStressScore: number;      // 0-100
  marketMoatScore: number;        // 0-100
  governanceScore: number;        // 0-100
  radarAxes: RadarAxis[];
  tornado: TornadoItem[];
  simulation: MonteCarloSimulation;
  keyRiskDriver: string;
  topMitigation: string;
}

export interface StressTestScenario {
  marketDownturn: number;     // 0-50% contraction in enterprise procurement
  cacInflation: number;       // 0-100% increase in customer acquisition cost
  churnSpike: number;         // 0-30% increase in churn rate
  roundDelayMonths: number;   // 0-12 months delay in closing next round
  founderFriction: number;    // 0-50% increase in CBT bias severity
}

export interface AIDiligenceReport {
  executiveSummary: string;
  investmentVerdict: string;
  recommendedValuationCap: string;
  cbtBehavioralAudit: {
    founderBiasDiagnosis: string;
    executionResilience: string;
    credibilityGap: string;
  };
  contrarianPartnerQuestions: string[];
  criticalFailureModes: Array<{
    trigger: string;
    impact: string;
    probability: string;
  }>;
  syndicateTermsRecommendation: string;
}
