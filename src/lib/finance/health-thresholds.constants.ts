export const THRESHOLD_KEYS = [
  "liquidity_months_min",
  "liquidity_months_max",
  "liquid_to_equity_min",
  "saving_ratio_min",
  "debt_to_assets_max",
  "debt_repayment_max",
  "non_mortgage_repayment_max",
  "investment_to_equity_min",
  "solvability_min",
] as const;

export type ThresholdKey = (typeof THRESHOLD_KEYS)[number];

export type FinanceHealthThresholds = Record<ThresholdKey, number>;

export const DEFAULT_FINANCE_HEALTH_THRESHOLDS: FinanceHealthThresholds = {
  liquidity_months_min: 3,
  liquidity_months_max: 6,
  liquid_to_equity_min: 0.15,
  saving_ratio_min: 0.1,
  debt_to_assets_max: 0.5,
  debt_repayment_max: 0.35,
  non_mortgage_repayment_max: 0.15,
  investment_to_equity_min: 0.5,
  solvability_min: 0.5,
};

export const THRESHOLD_LABELS: Record<
  ThresholdKey,
  { label: string; hint: string; unit: "months" | "percent" | "ratio" }
> = {
  liquidity_months_min: {
    label: "Liquidity ratio — minimum months",
    hint: "Target range lower bound (cash ÷ monthly expenses)",
    unit: "months",
  },
  liquidity_months_max: {
    label: "Liquidity ratio — maximum months",
    hint: "Target range upper bound",
    unit: "months",
  },
  liquid_to_equity_min: {
    label: "Liquid to net equity — minimum",
    hint: "Liquid assets ÷ net worth",
    unit: "percent",
  },
  saving_ratio_min: {
    label: "Saving ratio — minimum",
    hint: "Annual savings ÷ annual income",
    unit: "percent",
  },
  debt_to_assets_max: {
    label: "Debt to assets — maximum",
    hint: "Total debt ÷ total assets",
    unit: "percent",
  },
  debt_repayment_max: {
    label: "Debt repayment capacity — maximum",
    hint: "Total annual loan payments ÷ annual income",
    unit: "percent",
  },
  non_mortgage_repayment_max: {
    label: "Non-mortgage repayment — maximum",
    hint: "Non-mortgage annual payments ÷ annual income",
    unit: "percent",
  },
  investment_to_equity_min: {
    label: "Investment to net equity — minimum",
    hint: "Investment assets ÷ net worth",
    unit: "percent",
  },
  solvability_min: {
    label: "Solvability — minimum",
    hint: "Net worth ÷ total assets",
    unit: "percent",
  },
};
