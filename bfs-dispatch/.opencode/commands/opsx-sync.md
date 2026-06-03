---
description: Sync delta specs from a change to main specs
---

Sync delta specs from a change to main specs.

**Input**: Optionally specify a change name after `/opsx-sync` (e.g., `/opsx-sync add-auth`). If omitted, check if it can be inferred from conversation context.

**Steps**

1. **If no change name provided, prompt for selection**

   Run `openspec list --json` to get available changes. Use the **AskUserQuestion tool** to let the user select.

2. **Find delta specs**

   Look for delta spec files in `openspec/changes/<name>/specs/*/spec.md`.

   Each delta spec file contains sections like:
   - `## ADDED Requirements` - New requirements to add
   - `## MODIFIED Requirements` - Changes to existing requirements
   - `## REMOVED Requirements` - Requirements to remove

3. **For each delta spec, apply changes to main specs**

   For each capability with a delta spec:
   a. Read the delta spec
   b. Read the main spec at `openspec/specs/<capability>/spec.md`
   c. Apply changes intelligently:
      - ADDED: Add requirement if it doesn't exist in main spec
      - MODIFIED: Apply changes preserving content not mentioned in delta
      - REMOVED: Remove the entire requirement block from main spec
   d. Create new main spec if capability doesn't exist

4. **Show summary**

   After applying all changes, summarize:
   - Which capabilities were updated
   - What changes were made

**Key Principle: Intelligent Merging**

Unlike programmatic merging, you can apply partial updates:
- To add a scenario, just include that scenario under MODIFIED
- The delta represents intent, not a wholesale replacement
- Use your judgment to merge changes sensibly

**Guardrails**
- Read both delta and main specs before making changes
- Preserve existing content not mentioned in delta
- Show what you're changing as you go
