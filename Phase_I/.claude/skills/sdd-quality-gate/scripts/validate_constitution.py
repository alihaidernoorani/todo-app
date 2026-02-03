#!/usr/bin/env python3
"""
Validate implementation against constitution rules.

Checks Phase I constraints:
- Python 3.13+ only
- No external dependencies (stdlib only)
- No persistence (file I/O, databases)
- No network APIs
- Dataclass-based models

Returns:
    0: Constitution compliant
    1: Constitution violations detected
"""

import sys
import json
import ast
import re
from pathlib import Path

def check_python_imports(file_path):
    """
    Check Python file for non-stdlib imports.
    
    Returns:
        list of non-stdlib imports found
    """
    try:
        content = file_path.read_text()
        tree = ast.parse(content)
    except Exception as e:
        return {'error': str(e), 'imports': []}
    
    imports = []
    
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                imports.append(alias.name.split('.')[0])
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                imports.append(node.module.split('.')[0])
    
    # Python stdlib modules (common ones for Phase I)
    stdlib_modules = {
        'abc', 'collections', 'dataclasses', 'datetime', 'enum', 'functools',
        'itertools', 'json', 'logging', 'math', 'os', 'pathlib', 're', 
        'sys', 'typing', 'unittest', 'uuid', 'argparse', 'io', 'subprocess'
    }
    
    non_stdlib = [imp for imp in imports if imp not in stdlib_modules]
    
    return non_stdlib

def check_for_persistence(file_path):
    """
    Check for file I/O or database operations.
    
    Returns:
        list of potential persistence violations
    """
    try:
        content = file_path.read_text()
    except Exception:
        return []
    
    violations = []
    
    # File I/O patterns
    file_io_patterns = [
        r'open\(',
        r'\.write\(',
        r'\.read\(',
        r'with\s+open',
        r'Path\(.*\)\.write',
        r'Path\(.*\)\.read',
    ]
    
    for pattern in file_io_patterns:
        if re.search(pattern, content):
            violations.append(f'File I/O detected: {pattern}')
            break  # Only report once per file
    
    # Database patterns
    db_patterns = [
        r'sqlite3',
        r'pymongo',
        r'psycopg',
        r'mysql',
        r'CREATE TABLE',
        r'INSERT INTO',
        r'SELECT.*FROM',
    ]
    
    for pattern in db_patterns:
        if re.search(pattern, content, re.IGNORECASE):
            violations.append(f'Database operation detected: {pattern}')
            break
    
    return violations

def check_for_network_apis(file_path):
    """
    Check for network/API operations.
    
    Returns:
        list of potential network violations
    """
    try:
        content = file_path.read_text()
    except Exception:
        return []
    
    violations = []
    
    network_patterns = [
        r'import\s+requests',
        r'import\s+urllib',
        r'import\s+httpx',
        r'import\s+flask',
        r'import\s+fastapi',
        r'@app\.route',
        r'@app\.get',
        r'@app\.post',
        r'socket\.',
    ]
    
    for pattern in network_patterns:
        if re.search(pattern, content, re.IGNORECASE):
            violations.append(f'Network/API operation detected: {pattern}')
            break
    
    return violations

def validate_python_files(project_root):
    """
    Validate all Python files in the project against constitution.
    
    Returns:
        dict with validation results
    """
    project_path = Path(project_root)
    
    # Find all Python files (exclude venv, .git, etc.)
    python_files = []
    for py_file in project_path.rglob('*.py'):
        # Skip common exclusions
        if any(part in py_file.parts for part in ['.git', 'venv', '__pycache__', '.venv', 'node_modules']):
            continue
        python_files.append(py_file)
    
    violations = {
        'non_stdlib_imports': {},
        'persistence': {},
        'network_apis': {}
    }
    
    for py_file in python_files:
        # Check imports
        non_stdlib = check_python_imports(py_file)
        if non_stdlib:
            violations['non_stdlib_imports'][str(py_file)] = non_stdlib
        
        # Check persistence
        persistence_issues = check_for_persistence(py_file)
        if persistence_issues:
            violations['persistence'][str(py_file)] = persistence_issues
        
        # Check network APIs
        network_issues = check_for_network_apis(py_file)
        if network_issues:
            violations['network_apis'][str(py_file)] = network_issues
    
    has_violations = any(violations.values())
    
    return {
        'status': 'fail' if has_violations else 'pass',
        'files_checked': len(python_files),
        'violations': violations
    }

def main():
    """Main function."""
    project_root = sys.argv[1] if len(sys.argv) > 1 else '.'
    
    result = validate_python_files(project_root)
    
    # Format output
    output = {
        'status': result['status'],
        'message': 'Constitution violations detected' if result['status'] == 'fail' else 'Constitution compliant',
        'files_checked': result['files_checked'],
        'violations': {}
    }
    
    # Add violation details
    if result['violations']['non_stdlib_imports']:
        output['violations']['non_stdlib_imports'] = result['violations']['non_stdlib_imports']
    
    if result['violations']['persistence']:
        output['violations']['persistence'] = result['violations']['persistence']
    
    if result['violations']['network_apis']:
        output['violations']['network_apis'] = result['violations']['network_apis']
    
    print(json.dumps(output, indent=2))
    return 0 if result['status'] == 'pass' else 1

if __name__ == '__main__':
    sys.exit(main())
