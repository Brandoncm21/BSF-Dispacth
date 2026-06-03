---
description: Verify implementation matches change artifacts before archiving
---

Verify that an implementation matches the change artifacts (specs, tasks, design).

**Input**: Optionally specify a change name after `/opsx-verify` (e.g., `/opsx-verify add-auth`). If omitted, check if it can be inferred from conversation context.

**Steps**

1. **If no change name provided, prompt for selection**

   Run `openspec list --json` to get available changes. Use the **AskUserQuestion tool** to let the user select.

2. **Check status to understand the schema**
   ```bash
   openspec status --change "<name>" --json
   ```
   Parse the JSON to understand:
   - `schemaName`: Expected "intent-driven"
   - Which artifacts exist for this change

3. **Load artifacts**
   ```bash
   openspec instructions apply --change "<name>" --json
   ```
   This returns `contextFiles` (artifact ID -> array of concrete file paths).

4. **Initialize verification report**

   Create a report with three dimensions:
   - **Completeness**: Track tasks and spec coverage
   - **Correctness**: Track requirement implementation and scenario coverage
   - **Coherence**: Track design adherence and pattern consistency

5. **Verify Completeness**

   **Task Completion**:
   - If tasks.md exists, read it
   - Parse checkboxes: `- [ ]` (incomplete) vs `- [x]` (complete)
   - Count complete vs total tasks
   - If incomplete tasks exist → CRITICAL issue

6. **Verify Correctness**

   - For each requirement in delta specs, search codebase for implementation
   - For each scenario, check if conditions are handled in code
   - If requirements appear unimplemented → CRITICAL issue

7. **Verify Coherence**

   - If design.md exists, extract key decisions
   - Verify implementation follows those decisions
   - If contradiction detected → WARNING

8. **Generate Report**

   ```
   ## Verification Report: <change-name>

   | Dimension    | Status           |
   |--------------|------------------|
   | Completeness | X/Y tasks, N reqs|
   | Correctness  | M/N reqs covered |
   | Coherence    | Followed/Issues  |

   ### CRITICAL (Must fix before archive)
   ### WARNING (Should fix)
   ### SUGGESTION (Nice to fix)
   ```

**Guardrails**
- Prefer SUGGESTION over WARNING, WARNING over CRITICAL when uncertain
- Every issue must have a specific actionable recommendation
