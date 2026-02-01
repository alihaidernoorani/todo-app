#!/usr/bin/env python3
"""
Check that spec.md defines clear acceptance criteria.

Returns:
    0: Acceptance criteria found and well-defined
    1: Missing or poorly defined acceptance criteria
"""

import sys
import json
import re
from pathlib import Path

def find_acceptance_criteria(content):
    """
    Find acceptance criteria sections in spec content.
    
    Returns:
        dict with criteria found and quality assessment
    """
    content_lower = content.lower()
    
    # Common acceptance criteria indicators
    indicators = [
        'acceptance criteria',
        'acceptance test',
        'definition of done',
        'success criteria',
        'must have',
        'requirements:',
    ]
    
    found_sections = []
    for indicator in indicators:
        if indicator in content_lower:
            # Find the section
            pattern = re.compile(rf'#{1,4}\s*{re.escape(indicator)}.*?(?=^#{1,4}\s|\Z)', 
                               re.IGNORECASE | re.MULTILINE | re.DOTALL)
            matches = pattern.findall(content)
            if matches:
                found_sections.extend(matches)
    
    # Look for bullet points or numbered lists that might be criteria
    criteria_items = []
    
    # Bullet points
    bullet_pattern = re.compile(r'^\s*[-*+]\s+(.+)$', re.MULTILINE)
    bullets = bullet_pattern.findall(content)
    
    # Numbered lists
    numbered_pattern = re.compile(r'^\s*\d+\.\s+(.+)$', re.MULTILINE)
    numbered = numbered_pattern.findall(content)
    
    # Checkboxes
    checkbox_pattern = re.compile(r'^\s*[-*]\s*\[[ x]\]\s+(.+)$', re.MULTILINE)
    checkboxes = checkbox_pattern.findall(content)
    
    criteria_items = bullets + numbered + checkboxes
    
    return {
        'found_sections': len(found_sections) > 0,
        'section_count': len(found_sections),
        'criteria_count': len(criteria_items),
        'has_testable_criteria': len(criteria_items) >= 3
    }

def assess_criteria_quality(spec_path):
    """
    Assess the quality of acceptance criteria in spec.
    
    Returns:
        dict with assessment results
    """
    try:
        content = spec_path.read_text()
    except Exception as e:
        return {
            'status': 'error',
            'message': f'Cannot read spec file: {e}'
        }
    
    analysis = find_acceptance_criteria(content)
    
    issues = []
    warnings = []
    
    # Check if acceptance criteria section exists
    if not analysis['found_sections']:
        issues.append("No acceptance criteria section found")
    
    # Check if there are enough criteria items
    if analysis['criteria_count'] < 3:
        issues.append(f"Only {analysis['criteria_count']} acceptance criteria found - need at least 3 for completeness")
    elif analysis['criteria_count'] < 5:
        warnings.append(f"Only {analysis['criteria_count']} acceptance criteria found - consider adding more detail")
    
    # Check for measurable/testable language
    testable_keywords = ['must', 'should', 'shall', 'will', 'displays', 'returns', 'shows', 'validates', 'accepts', 'rejects']
    testable_count = sum(1 for keyword in testable_keywords if keyword in content.lower())
    
    if testable_count < 3:
        warnings.append("Few testable/measurable terms found - ensure criteria are specific and verifiable")
    
    return {
        'status': 'pass' if len(issues) == 0 else 'fail',
        'found_sections': analysis['found_sections'],
        'criteria_count': analysis['criteria_count'],
        'testable_keywords_count': testable_count,
        'issues': issues,
        'warnings': warnings
    }

def main():
    """Main function."""
    if len(sys.argv) < 2:
        print(json.dumps({
            'status': 'error',
            'message': 'Usage: check_acceptance_criteria.py <spec_path>'
        }, indent=2))
        return 1
    
    spec_path = Path(sys.argv[1])
    
    if not spec_path.exists():
        result = {
            'status': 'error',
            'message': f'Spec file not found: {spec_path}'
        }
        print(json.dumps(result, indent=2))
        return 1
    
    assessment = assess_criteria_quality(spec_path)
    assessment['spec_path'] = str(spec_path)
    
    print(json.dumps(assessment, indent=2))
    return 0 if assessment['status'] == 'pass' else 1

if __name__ == '__main__':
    sys.exit(main())
