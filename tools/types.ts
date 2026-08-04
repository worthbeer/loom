// Shared type contracts for the pipeline. Centralized here rather than
// inlined per-file so every stage agrees on the same shape for data that
// crosses module boundaries (resolved tokens, gate/critic results, etc.).

export interface ResolvedToken {
  value: string | null;
  found: boolean;
}

export type ResolvedTokens = Record<string, ResolvedToken>;

export interface Intent {
  component: string;
  variant: Record<string, string>;
  tokenRefs: string[];
  content: unknown;
}

export interface PatternFile {
  filename: string;
  source: string;
}

export interface RouteResult {
  framework: string | null;
  source: 'explicit' | 'payload' | 'ambiguous';
  needsClarification?: boolean;
}

export interface GateViolation {
  rule: string;
  location?: string;
  detail: string;
}

export interface GateResult {
  passed: boolean;
  violations: GateViolation[];
}

export interface CriticViolation {
  rule: string;
  location: string;
  detail: string;
}

export interface CriticResult {
  passed: boolean;
  violations: CriticViolation[];
  matches_intent: boolean | null;
}

export type RestatedIntent =
  | { restatement: string }
  | { needsClarification: true; question: string }
  | null;

export interface TraceEntry {
  step: string;
  input: unknown;
  output: unknown;
}

export interface RetrievalLoopResult {
  intent: Intent;
  resolvedTokens: ResolvedTokens;
  patterns: PatternFile[];
  restatedIntent: RestatedIntent;
  trace: TraceEntry[];
}

export interface GeneratedFile {
  filename: string;
  content: string;
}

export interface GenerationResult {
  componentFile: GeneratedFile;
  storiesFile: GeneratedFile | null;
}
