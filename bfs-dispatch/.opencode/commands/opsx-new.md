---
description: Start a new change using the intent-driven artifact workflow
---

Start a new change using the intent-driven artifact workflow.

**Input**: The argument after `/opsx-new` is the change name (kebab-case), OR a description of what the user wants to build.

**Steps**

1. **If no input provided, ask what they want to build**

   Use the **AskUserQuestion tool** (open-ended, no preset options) to ask:
   > "What change do you want to work on? Describe what you want to build or fix."

   From their description, derive a kebab-case name (e.g., "add user authentication" → `add-user-auth`).

   **IMPORTANT**: Do NOT proceed without understanding what the user wants to build.

2. **Create the change directory**
   ```bash
   openspec new change "<name>"
   ```
   This creates a scaffolded change at `openspec/changes/<name>/` using the intent-driven schema (configured in openspec/config.yaml).

3. **Show the artifact status**
   ```bash
   openspec status --change "<name>"
   ```
   This shows the artifact sequence: proposal → specs → design → adr → tasks

4. **Get instructions for the first artifact**
   ```bash
   openspec instructions proposal --change "<name>"
   ```
   This outputs the template and context for creating the first artifact.

5. **STOP and wait for user direction**

**Output**

After completing the steps, summarize:
- Change name and location
- Schema: intent-driven (proposal → specs → design → adr → tasks)
- Current status (0/5 artifacts complete)
- The template for the first artifact
- Prompt: "Ready to create the first artifact? Run `/opsx-continue` to start."

**Guardrails**
- Do NOT create any artifacts yet - just show the instructions
- Do NOT advance beyond showing the first artifact template
- If the name is invalid (not kebab-case), ask for a valid name
- If a change with that name already exists, suggest using `/opsx-continue` instead
