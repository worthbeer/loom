# 0011 — Restatement is a comprehension checkpoint, not ground truth

**Status:** Accepted

## Context
Retrieval (tokens, patterns) can be correct while the model's *reading* of
that retrieved data is still wrong — a gap between "the tools returned the
right facts" and "the model understood those facts correctly" that
nothing upstream of generation was checking.

## Decision
Before generation runs, the model paraphrases the build target back using
only vocabulary already present in the retrieved data — proving it
understood what it retrieved, not just that retrieval succeeded. This
restatement is a checkpoint, never treated as ground truth: the critic
(0006) always re-derives its own ground truth from the original tool
output, never from the restatement, so a restatement that already drifted
can't be "confirmed" against its own drifted version.

## Consequences
- `critique()` has no parameter for the restatement at all — the
  invariant is enforced structurally, not by convention.
- The restatement step must satisfy two independent checks, not one: no
  invented terms, and no silent omission of a term that was actually
  present in the retrieved data. Passing the first while quietly dropping
  information is still a failure — collapsing two distinct token
  references into one vague description is the same failure as
  fabricating one that doesn't exist.
- When the model can't confidently attribute a value, it surfaces a
  clarifying question rather than guessing (same principle as 0009).
