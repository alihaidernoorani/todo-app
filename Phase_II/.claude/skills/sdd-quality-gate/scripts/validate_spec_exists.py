#!/usr/bin/env python3
"""
Validate that a spec file exists for the current feature/branch.

Returns:
    0: Spec exists and is valid
    1: Spec missing or invalid
"""

import sys
import json
from pathlib import Path
import subprocess

def get_current_branch():
    """Get the current git branch name."""
    try:
        result = subprocess.run(
            ['git', 'branch', '--show-current'],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError:
        return None

def extract_feature_from_branch(branch_name):
    """
    Extract feature name from branch.
    Assumes pattern like: <number>-<feature-name> or feature/<feature-name>
    """
    if not branch_name:
        return None
    
    # Remove common prefixes
    for prefix in ['feature/', 'feat/', 'spec/']:
        if branch_name.startswith(prefix):
            branch_name = branch_name[len(prefix):]
    
    # Remove leading numbers and hyphens (e.g., "001-in-memory-todo-cli" -> "in-memory-todo-cli")
    parts = branch_name.split('-', 1)
    if len(parts) > 1 and parts[0].isdigit():
        return parts[1]
    
    return branch_name

def find_spec_file(feature_name, search_paths=None):
    """
    Search for spec.md file for the given feature.
    
    Args:
        feature_name: Name of the feature
        search_paths: Optional list of paths to search
    
    Returns:
        Path to spec file if found, None otherwise
    """
    if search_paths is None:
        search_paths = [
            Path.cwd() / 'specs' / feature_name / 'spec.md',
            Path.cwd() / f'specs/{feature_name}/spec.md',
            Path.cwd() / 'spec.md',
        ]
    
    for spec_path in search_paths:
        if isinstance(spec_path, str):
            spec_path = Path(spec_path)
        if spec_path.exists() and spec_path.is_file():
            return spec_path
    
    return None

def validate_spec_content(spec_path):
    """
    Validate that spec file has minimum required content.
    
    Returns:
        dict with 'valid' bool and 'issues' list
    """
    issues = []
    
    try:
        content = spec_path.read_text()
    except Exception as e:
        return {'valid': False, 'issues': [f"Cannot read spec file: {e}"]}
    
    # Check minimum length
    if len(content.strip()) < 100:
        issues.append("Spec file is too short (< 100 characters)")
    
    # Check for key sections (flexible)
    required_indicators = ['intent', 'requirement', 'input', 'output', 'acceptance']
    found_indicators = sum(1 for indicator in required_indicators 
                          if indicator in content.lower())
    
    if found_indicators < 2:
        issues.append("Spec appears incomplete - missing key sections (intent, requirements, inputs, outputs, or acceptance criteria)")
    
    return {
        'valid': len(issues) == 0,
        'issues': issues
    }

def main():
    """Main validation function."""
    # Get current branch
    branch = get_current_branch()
    if not branch:
        result = {
            'status': 'error',
            'message': 'Not in a git repository or cannot determine branch',
            'spec_path': None
        }
        print(json.dumps(result, indent=2))
        return 1
    
    # Extract feature name
    feature_name = extract_feature_from_branch(branch)
    if not feature_name:
        result = {
            'status': 'warning',
            'message': f'Cannot extract feature name from branch: {branch}',
            'branch': branch,
            'spec_path': None
        }
        print(json.dumps(result, indent=2))
        return 1
    
    # Find spec file
    spec_path = find_spec_file(feature_name)
    if not spec_path:
        result = {
            'status': 'error',
            'message': f'Spec file not found for feature: {feature_name}',
            'branch': branch,
            'feature': feature_name,
            'spec_path': None,
            'searched_paths': [
                f'specs/{feature_name}/spec.md',
                'spec.md'
            ]
        }
        print(json.dumps(result, indent=2))
        return 1
    
    # Validate spec content
    validation = validate_spec_content(spec_path)
    
    result = {
        'status': 'pass' if validation['valid'] else 'fail',
        'message': 'Spec file found and valid' if validation['valid'] else 'Spec file found but has issues',
        'branch': branch,
        'feature': feature_name,
        'spec_path': str(spec_path),
        'issues': validation['issues']
    }
    
    print(json.dumps(result, indent=2))
    return 0 if validation['valid'] else 1

if __name__ == '__main__':
    sys.exit(main())
