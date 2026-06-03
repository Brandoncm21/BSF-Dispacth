---
description: Propose a new change - create it and generate all artifacts in one step (intent-driven)
---

Propose a new change using the intent-driven workflow.

Artifacts to create (in order):
- proposal.md (what & why)
- specs/**/*.md (Gherkin-style behaviour specs)
- design.md (technical design)
- adr/*.md (architectural decision records)
- tasks.md (implementation tasks)

When ready to implement, run /opsx-apply

---

**Input**: The argument after `/opsx-propose` is the change name (kebab-case), OR a description of what the user wants to build.

**Steps**

1. **If no input provided, ask what they want to build**

   Use the **AskUserQuestion tool** (open-ended, no preset options) to ask:
   > "What change do you want to work on? Describe what you want to build or fix."

   From their description, derive a kebab-case name (e.g., "add user authentication" → `add-user-auth`).

   **IMPORTANT**: Do NOT proceed without understanding what the user wants to build.

2. **Use grill-me skill to interrogate the proposal**

   Load the **grill-me** skill. Interview the user one question at a time about:
   - The problem being solved and why now
   - What specific changes are needed
   - What capabilities will be added or modified
   - Affected systems and dependencies
   - Any constraints or unknowns

   Resolve each branch of the decision tree before moving to the next. For each question, provide your recommended answer.

   **IMPORTANT**: Walk down the decision tree one question at a time. Do not ask multiple questions at once unless they are trivially dependent.

3. **Create the change directory**
   ```bash
   openspec new change "<name>"
   ```
   This creates a scaffolded change at `openspec/changes/<name>/` with the intent-driven schema.

4. **Get the artifact build order**
   ```bash
   openspec status --change "<name>" --json
   ```
   Parse the JSON to get:
   - `applyRequires`: array of artifact IDs needed before implementation
   - `artifacts`: list of all artifacts with their status and dependencies

5. **Create artifacts in sequence until apply-ready**

   Use the **TodoWrite tool** to track progress through the artifacts.
   Intent-driven sequence: proposal → specs → design → adr → tasks

   Loop through artifacts in dependency order:

   a. **For each artifact that is `ready`**:
      - Get instructions:
        ```bash
        openspec instructions <artifact-id> --change "<name>" --json
        ```
      - Read dependency artifacts for context
      - Create the artifact file using the `template` as the structure
      - Apply `context` and `rules` as constraints - do NOT copy them into the file

   b. **Continue until all `applyRequires` artifacts are complete**
   c. **If an artifact requires user input**: use **AskUserQuestion tool** to clarify

6. **Show final status**
   ```bash
   openspec status --change "<name>"
   ```

**Output**

After completing all artifacts, summarize:
- Change name and location
- Schema: intent-driven (5 artifacts)
- List of artifacts created
- Prompt: "Run `/opsx-apply` to start implementing."

**Guardrails**
- Use grill-me for the proposal interrogation phase (ask one question at a time)
- Create ALL artifacts needed for implementation (proposal, specs, design, adr, tasks)
- Always read dependency artifacts before creating a new one
- If context is critically unclear, ask the user
- Verify each artifact file exists after writing before proceeding to next
