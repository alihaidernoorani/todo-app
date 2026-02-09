---
name: sdd-quality-gate
description: Enforces alignment with approved specs, blocks undocumented features, validates acceptance criteria coverage, and detects scope creep. Use before implementation, after implementation, or during review phases to ensure implementation matches spec.md, plan.md, and tasks.md artifacts.
---

# Spec-Driven Quality Gate

This skill validates implementation work against approved specifications and constitution constraints. It ensures all code changes are documented, in scope, and compliant with project standards.

## When to Use This Skill

Use this quality gate at three key checkpoints:

1. **Before Implementation** - Verify spec exists and is complete before writing code
2. **After Implementation** - Validate completed work aligns with spec and constitution
3. **During Review** - Generate compliance reports for PR reviews or audits

## Quick Start

Run the full quality gate:

```bash
cd /path/to/project
python3 .claude/skills/sdd-quality-gate/scripts/run_quality_gate.py
```

This automatically:
- Detects current feature from git branch
- Finds corresponding spec file
- Runs all validation checks
- Generates compliance report

## Validation Checks

The quality gate performs four primary checks:

### 1. Spec Exists ✓

Validates that a `spec.md` file exists for the current feature.

**Checks:**
- File exists at `specs/<feature-name>/spec.md`
- File has minimum content (>100 characters)
- File contains key sections (intent, requirements, inputs/outputs, acceptance criteria)

**Failure modes:**
- FAIL: Spec file not found
- FAIL: Spec file too short or appears incomplete

**Manual check:**
```bash
python3 scripts/validate_spec_exists.py
```

### 2. Acceptance Criteria ✓

Validates that spec defines clear, testable acceptance criteria.

**Checks:**
- "Acceptance Criteria" section exists (or similar: "Definition of Done", "Success Criteria")
- At least 3 criteria items present (bullets, numbered, or checkboxes)
- Uses testable language (must, should, displays, returns, validates)

**Failure modes:**
- FAIL: No acceptance criteria section
- WARN: Fewer than 5 criteria items
- WARN: Few testable terms used

**Manual check:**
```bash
python3 scripts/check_acceptance_criteria.py path/to/spec.md
```

### 3. Scope Alignment ⚠️

Detects potential scope creep by comparing implementation with spec.

**Checks (heuristic-based):**
- Compare git diff against spec content
- Flag large change sets (>10 files)
- Detect common out-of-scope patterns:
  - Persistence when not specified
  - Network APIs when not specified
  - Authentication when not specified
  - Unexpected configuration changes

**Note**: This check is heuristic and requires manual review. It flags concerns, not violations.

**Failure modes:**
- WARN: Potential scope concerns detected
- SUGGEST: Manual review areas

**Manual check:**
```bash
python3 scripts/detect_scope_creep.py path/to/spec.md
```

### 4. Constitution Compliance ✓

Validates implementation follows project constitution constraints.

**For Phase I projects (in-memory, console):**
- Python 3.13+ only
- Standard library only (no external dependencies)
- No persistence (file I/O, databases)
- No network APIs
- Dataclass-based models

**Checks:**
- Parse Python imports against stdlib whitelist
- Search for file I/O patterns (`open`, `read`, `write`)
- Search for database patterns (`sqlite3`, `CREATE TABLE`)
- Search for network patterns (`requests`, `flask`, `fastapi`)

**Failure modes:**
- FAIL: Non-stdlib imports detected
- FAIL: Persistence operations found
- FAIL: Network/API operations found

**Manual check:**
```bash
python3 scripts/validate_constitution.py /path/to/project
```

## Usage Patterns

### Pattern 1: Pre-Implementation Gate

Before starting implementation, verify the spec is ready:

```bash
# Check spec exists and has acceptance criteria
python3 scripts/validate_spec_exists.py
python3 scripts/check_acceptance_criteria.py path/to/spec.md
```

**Use when:**
- Starting new feature work
- Verifying spec completeness before coding
- Ensuring requirements are clear

### Pattern 2: Post-Implementation Gate

After completing implementation, run full gate:

```bash
# Run all checks and generate report
python3 scripts/run_quality_gate.py --output compliance-report.md
```

**Use when:**
- Feature implementation complete
- Before creating PR
- Before committing changes
- Verifying scope alignment

### Pattern 3: Review Gate

Generate compliance report for review:

```bash
# Generate report with custom paths
python3 scripts/run_quality_gate.py \
  --spec-path specs/my-feature/spec.md \
  --project-root . \
  --output reports/compliance-$(date +%Y%m%d).md
```

**Use when:**
- Preparing for code review
- Audit or compliance check
- Retrospective analysis
- Quality metrics collection

### Pattern 4: JSON Output for CI/CD

Get structured output for automation:

```bash
# JSON output for parsing
python3 scripts/run_quality_gate.py --json > gate-result.json
```

**Use when:**
- Integrating with CI/CD pipelines
- Automated quality gates
- Programmatic result processing

## Understanding Results

### Status Values

Each check returns one of:
- **pass** ✅ - No issues detected
- **fail** ❌ - Violations found (blocks progression)
- **warning** ⚠️ - Potential concerns (manual review recommended)
- **error** 🔴 - Check could not complete

### Overall Gate Status

- **pass**: All checks pass or warning only → Safe to proceed
- **fail**: Any check fails → Must fix violations before proceeding
- **error**: Critical checks failed → Resolve errors and re-run

### Interpreting Warnings

Warnings require human judgment:
- **Scope warnings**: Review flagged changes, verify they're in spec
- **Criteria warnings**: Consider adding more detailed acceptance criteria
- **Quality warnings**: Review code against constitution principles

Warnings don't block progression but should be addressed.

## Advanced Usage

### Custom Spec Path

If spec is not in standard location:

```bash
python3 scripts/run_quality_gate.py --spec-path /custom/path/spec.md
```

### Custom Project Root

For multi-project repos:

```bash
python3 scripts/run_quality_gate.py --project-root ./services/api
```

### Individual Check Execution

Run specific checks for faster iteration:

```bash
# Only check constitution compliance
python3 scripts/validate_constitution.py .

# Only check acceptance criteria
python3 scripts/check_acceptance_criteria.py specs/feature/spec.md
```

## Customization

Projects can customize validation rules:

1. **Stdlib Whitelist**: Edit `scripts/validate_constitution.py` to add project-specific stdlib modules
2. **Scope Patterns**: Edit `scripts/detect_scope_creep.py` to define custom out-of-scope indicators
3. **Acceptance Thresholds**: Adjust minimum criteria counts in `scripts/check_acceptance_criteria.py`
4. **Constitution Rules**: Define phase-specific constraints based on project constitution

See `references/validation-rules.md` for detailed rule documentation.

## Reference Documentation

- **Validation Rules**: See `references/validation-rules.md` for complete rule specifications
- **Constitution Rules**: See `references/constitution-rules.md` for Phase I/II/III constraints
- **Report Template**: See `assets/compliance-report-template.md` for report structure

## Workflow Integration

### Git Pre-Commit Hook

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash
python3 .claude/skills/sdd-quality-gate/scripts/run_quality_gate.py
if [ $? -ne 0 ]; then
    echo "❌ Quality gate failed. Fix violations before committing."
    exit 1
fi
```

### CI/CD Integration

Add to GitHub Actions (`.github/workflows/quality-gate.yml`):

```yaml
- name: Run Quality Gate
  run: |
    python3 .claude/skills/sdd-quality-gate/scripts/run_quality_gate.py --json
```

### Pre-PR Checklist

Before creating PR:
1. ✓ Run full quality gate
2. ✓ Review compliance report
3. ✓ Fix all failures
4. ✓ Address warnings or document why they're acceptable
5. ✓ Include compliance report in PR description

## Troubleshooting

**"Spec file not found"**
- Verify branch name follows pattern: `<number>-<feature-name>` or `feature/<name>`
- Check spec exists at `specs/<feature-name>/spec.md`
- Use `--spec-path` to specify custom location

**"Cannot extract feature name from branch"**
- Branch name doesn't match expected pattern
- Manually specify spec path with `--spec-path`

**"Non-stdlib imports detected"**
- Remove external dependencies
- Use only Python standard library for Phase I
- Add legitimate stdlib modules to whitelist if needed

**"Scope creep warnings"**
- Review flagged files against spec
- Verify all changes are documented in spec
- Update spec if requirements changed
- Document scope decisions in ADR

## Best Practices

1. **Run Early, Run Often**: Don't wait until PR - run during development
2. **Address Warnings**: Even if they don't block, they indicate quality concerns
3. **Update Spec First**: If requirements change, update spec before code
4. **Document Exceptions**: If warnings are false positives, document why
5. **Automate**: Integrate into git hooks or CI/CD for consistency
6. **Review Reports**: Don't just check pass/fail - read the detailed results

## Exit Codes

Scripts return standard exit codes:
- `0`: Success (pass or warning)
- `1`: Failure (violations detected or errors occurred)

Use for scripting and automation:

```bash
if python3 scripts/run_quality_gate.py; then
    echo "Gate passed ✅"
else
    echo "Gate failed ❌"
    exit 1
fi
```
