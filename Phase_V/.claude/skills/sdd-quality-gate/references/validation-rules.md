# Validation Rules Reference

This document describes the validation rules enforced by the Spec-Driven Quality Gate.

## Rule Categories

### 1. Spec Existence

**Rule**: Every feature implementation must have a corresponding `spec.md` file.

**Rationale**: Spec-driven development requires documented requirements before implementation.

**Location**: `specs/<feature-name>/spec.md`

**Validation**:
- File exists at expected location
- File has minimum content (>100 characters)
- File contains key sections (intent, requirements, inputs, outputs, acceptance criteria)

**Failure Actions**:
- Block: Implementation without spec
- Warn: Spec exists but appears incomplete

### 2. Acceptance Criteria

**Rule**: Specs must define clear, testable acceptance criteria.

**Rationale**: Acceptance criteria define "done" and guide testing.

**Requirements**:
- Dedicated "Acceptance Criteria" section (or similar: "Definition of Done", "Success Criteria")
- Minimum 3 criteria items (bullet points, numbered list, or checkboxes)
- Use of testable language (must, should, displays, returns, validates, etc.)

**Validation**:
- Section with acceptance criteria keywords exists
- At least 3 criteria items present
- Measurable/testable terms used

**Failure Actions**:
- Block: No acceptance criteria section
- Warn: Fewer than 5 criteria items
- Warn: Few testable terms used

### 3. Scope Alignment

**Rule**: Implementation must align with spec; no undocumented features.

**Rationale**: Prevents scope creep and ensures traceability.

**Validation** (heuristic-based):
- Compare git diff with spec content
- Flag large numbers of changed files (>10)
- Detect common out-of-scope patterns:
  - Persistence (when not specified)
  - Network APIs (when not specified)
  - Authentication (when not specified)
  - Configuration changes

**Note**: This check is heuristic and requires manual review. It flags potential concerns rather than definitive violations.

**Failure Actions**:
- Warn: Potential scope concerns detected
- Suggest: Manual review of flagged areas

### 4. Constitution Compliance

**Rule**: Implementation must follow project constitution constraints.

**For Phase I (Evolution of Todo)**:
- Python 3.13+ only
- Standard library only (no external dependencies except for testing/dev tools)
- No persistence (file I/O, databases)
- No network APIs (Flask, FastAPI, requests, etc.)
- Dataclass-based models

**Validation**:
- Parse Python files with AST
- Check imports against stdlib whitelist
- Search for file I/O patterns (open, read, write)
- Search for database patterns (sqlite3, CREATE TABLE, INSERT)
- Search for network patterns (requests, flask, fastapi, socket)

**Failure Actions**:
- Block: Non-stdlib imports found
- Block: Persistence operations detected
- Block: Network/API operations detected

## Scoring

Each check returns a status:
- **pass**: No issues detected
- **fail**: Violations found; blocks progression
- **warning**: Potential concerns; manual review recommended
- **error**: Check could not complete

Overall gate status:
- **pass**: All checks pass or warning only
- **fail**: Any check fails
- **error**: Critical checks could not run

## Manual Review Triggers

The following scenarios require human judgment:
1. Scope creep detection (heuristic warnings)
2. Acceptance criteria quality (subjective)
3. Ambiguous spec language
4. Edge cases not covered by automated checks

## Configuration

Validation rules can be customized:
- Stdlib whitelist: Add project-specific stdlib modules
- Scope patterns: Define project-specific out-of-scope indicators
- Acceptance criteria thresholds: Adjust minimum criteria count
- Constitution constraints: Define phase-specific rules

See individual validation scripts for configuration options.
