#!/usr/bin/env python3
"""
Detect potential scope creep by analyzing implementation against spec.

This script provides heuristic-based detection of scope creep. It flags
potential issues for manual review rather than providing definitive answers.

Returns:
    0: No obvious scope creep detected
    1: Potential scope creep detected (review recommended)
"""

import sys
import json
import subprocess
from pathlib import Path

def get_git_diff(base_branch='main'):
    """Get git diff against base branch."""
    try:
        result = subprocess.run(
            ['git', 'diff', f'{base_branch}...HEAD', '--name-only'],
            capture_output=True,
            text=True,
            check=True
        )
        changed_files = result.stdout.strip().split('\n')
        return [f for f in changed_files if f]
    except subprocess.CalledProcessError:
        return []

def get_file_diff_stats(file_path):
    """Get addition/deletion stats for a file."""
    try:
        result = subprocess.run(
            ['git', 'diff', 'main...HEAD', '--numstat', '--', file_path],
            capture_output=True,
            text=True,
            check=True
        )
        stats = result.stdout.strip()
        if stats:
            parts = stats.split('\t')
            return {
                'additions': int(parts[0]) if parts[0] != '-' else 0,
                'deletions': int(parts[1]) if parts[1] != '-' else 0
            }
    except (subprocess.CalledProcessError, ValueError):
        pass
    return {'additions': 0, 'deletions': 0}

def analyze_spec_scope(spec_path):
    """
    Analyze spec to extract mentioned features/components.
    
    Returns basic heuristics about what the spec covers.
    """
    try:
        content = spec_path.read_text().lower()
    except Exception:
        return {'keywords': set(), 'sections': []}
    
    # Extract potential feature keywords
    # This is heuristic-based and should be customized per project
    keywords = set()
    
    # Common technical terms that might indicate scope
    tech_terms = ['model', 'class', 'function', 'api', 'ui', 'database', 
                  'validation', 'authentication', 'authorization', 'storage',
                  'persistence', 'network', 'service', 'controller', 'view']
    
    for term in tech_terms:
        if term in content:
            keywords.add(term)
    
    # Extract section headers
    import re
    section_pattern = re.compile(r'^#{1,4}\s+(.+)$', re.MULTILINE)
    sections = section_pattern.findall(content)
    
    return {
        'keywords': keywords,
        'sections': [s.lower() for s in sections]
    }

def detect_scope_creep_heuristics(changed_files, spec_analysis):
    """
    Use heuristics to detect potential scope creep.
    
    Returns:
        dict with warnings and suggestions
    """
    warnings = []
    suggestions = []
    
    # Check for new directories (might indicate new components)
    new_dirs = set()
    for file_path in changed_files:
        parts = file_path.split('/')
        if len(parts) > 1:
            new_dirs.add(parts[0])
    
    # Heuristic: Many changed files might indicate broader scope
    if len(changed_files) > 10:
        warnings.append(f"Large number of files changed ({len(changed_files)}) - verify all are in scope")
    
    # Check for common out-of-scope patterns
    out_of_scope_patterns = {
        'test': 'Tests are good, but ensure they align with spec acceptance criteria',
        'config': 'Configuration changes detected - verify they are specified',
        'migration': 'Database migrations detected - ensure persistence was in scope',
        'api': 'API changes detected - verify endpoints are specified',
        'auth': 'Authentication/Authorization changes - verify security requirements are in spec',
    }
    
    for pattern, message in out_of_scope_patterns.items():
        if any(pattern in f.lower() for f in changed_files):
            suggestions.append(message)
    
    return {
        'warnings': warnings,
        'suggestions': suggestions,
        'changed_file_count': len(changed_files),
        'changed_dirs': list(new_dirs)
    }

def main():
    """Main function."""
    if len(sys.argv) < 2:
        print(json.dumps({
            'status': 'error',
            'message': 'Usage: detect_scope_creep.py <spec_path> [base_branch]'
        }, indent=2))
        return 1
    
    spec_path = Path(sys.argv[1])
    base_branch = sys.argv[2] if len(sys.argv) > 2 else 'main'
    
    if not spec_path.exists():
        result = {
            'status': 'error',
            'message': f'Spec file not found: {spec_path}'
        }
        print(json.dumps(result, indent=2))
        return 1
    
    # Get changed files
    changed_files = get_git_diff(base_branch)
    
    if not changed_files:
        result = {
            'status': 'pass',
            'message': 'No changes detected',
            'warnings': []
        }
        print(json.dumps(result, indent=2))
        return 0
    
    # Analyze spec
    spec_analysis = analyze_spec_scope(spec_path)
    
    # Detect scope creep heuristics
    analysis = detect_scope_creep_heuristics(changed_files, spec_analysis)
    
    result = {
        'status': 'warning' if (analysis['warnings'] or analysis['suggestions']) else 'pass',
        'message': 'Potential scope concerns detected - manual review recommended' if analysis['warnings'] else 'No obvious scope creep detected',
        'spec_path': str(spec_path),
        'changed_files': changed_files[:20],  # Limit output
        'total_changed_files': len(changed_files),
        'warnings': analysis['warnings'],
        'suggestions': analysis['suggestions']
    }
    
    print(json.dumps(result, indent=2))
    return 1 if analysis['warnings'] else 0

if __name__ == '__main__':
    sys.exit(main())
