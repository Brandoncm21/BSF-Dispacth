---
description: Continue working on a change - create the next artifact (intent-driven)
---

Continue working on a change by creating the next artifact.

**Input**: Optionally specify a change name after `/opsx-continue` (e.g., `/opsx-continue add-auth`). If omitted, check if it can be inferred from conversation context.

**Steps**

1. **If no change name provided, prompt for selection**

   Run `openspec list --json` to get available changes sorted by most recently modified. Then use the **AskUserQuestion tool** to let the user select which change to work on.

2. **Check current status**
   ```bash
   openspec status --change "<name>" --json
   ```
   Parse the JSON to understand current state:
   - `schemaName`: Should be "intent-driven"
   - `artifacts`: Array of artifacts (proposal, specs, design, adr, tasks) with their status ("done", "ready", "blocked")
   - `isComplete`: Boolean indicating if all artifacts are complete

3. **Act based on status**:

   ---

   **If all artifacts are complete (`isComplete: true`)**:
   - Congratulate the user
   - Suggest: "All artifacts created! You can now implement with `/opsx-apply`."
   - STOP

   ---

   **If artifacts are ready to create** (status shows artifacts with `status: "ready"`):
   - Pick the FIRST artifact with `status: "ready"` from the status output
   - Get its instructions:
     ```bash
     openspec instructions <artifact-id> --change "<name>" --json
     ```
   - Parse the JSON. Key fields:
     - `context`: Project background (constraints for you)
     - `rules`: Artifact-specific rules (constraints for you)
     - `template`: The structure to use
     - `instruction`: Schema-specific guidance
     - `outputPath`: Where to write
     - `dependencies`: Completed artifacts to read for context
   - **Create the artifact file** using `template` as the structure, applying `context` and `rules` as constraints
   - STOP after creating ONE artifact

4. **After creating an artifact, show progress**
   ```bash
   openspec status --change "<name>"
   ```

**Output**

After each invocation, show:
- Which artifact was created
- Schema: intent-driven
- Current progress (N/5 complete)
- What artifacts are now unlocked
- Prompt: "Run `/opsx-continue` to create the next artifact"

**Guardrails**
- Create ONE artifact per invocation
- Always read dependency artifacts before creating a new one
- Never skip artifacts or create out of order
- Intent-driven sequence: proposal → specs → design → adr → tasks
- Verify the artifact file exists after writing before marking progress
- **IMPORTANT**: `context` and `rules` are constraints for YOU, not content for the file
