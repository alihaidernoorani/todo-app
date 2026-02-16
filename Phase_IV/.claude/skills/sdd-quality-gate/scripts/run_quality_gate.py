#!/usr/bin/env python3
"""
Main quality gate orchestrator.

Runs all validation checks and generates a compliance report.

Usage:
    run_quality_gate.py [--spec-path <path>] [--project-root <path>] [--output <path>]
"""

import sys
import json
import subprocess
from pathlib import Path
from datetime import datetime
import argparse

def run_script(script_path, args=None):
    """
    Run a validation script and return parsed JSON result.
    
    Returns:
        dict with result or error information
    """
    cmd = ['python3', str(script_path)]
    if args:
        cmd.extend(args)
    
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.stdout:
            return json.loads(result.stdout)
        else:
            return {
                'status': 'error',
                'message': f'No output from {script_path.name}',
                'stderr': result.stderr
            }
    except subprocess.TimeoutExpired:
        return {
            'status': 'error',
            'message': f'Script timeout: {script_path.name}'
        }
    except json.JSONDecodeError as e:
        return {
            'status': 'error',
            'message': f'Invalid JSON output from {script_path.name}',
            'error': str(e),
            'stdout': result.stdout
        }
    except Exception as e:
        return {
            'status': 'error',
            'message': f'Failed to run {script_path.name}',
            'error': str(e)
        }

def generate_compliance_report(results, output_path=None):
    """
    Generate a formatted compliance report.
    
    Returns:
        formatted report string
    """
    report_lines = []
    report_lines.append("# Spec-Driven Quality Gate Report")
    report_lines.append(f"\n**Generated**: {datetime.now().isoformat()}")
    report_lines.append(f"**Status**: {results['overall_status']}\n")
    
    # Summary
    report_lines.append("## Summary\n")
    passed = sum(1 for r in results['checks'].values() if r.get('status') == 'pass')
    total = len(results['checks'])
    report_lines.append(f"- **Passed**: {passed}/{total} checks")
    report_lines.append(f"- **Overall**: {'✅ PASS' if results['overall_status'] == 'pass' else '❌ FAIL'}\n")
    
    # Detailed results
    report_lines.append("## Detailed Results\n")
    
    for check_name, check_result in results['checks'].items():
        status_emoji = {
            'pass': '✅',
            'fail': '❌',
            'warning': '⚠️',
            'error': '🔴'
        }.get(check_result.get('status', 'error'), '❓')
        
        report_lines.append(f"### {status_emoji} {check_name}")
        report_lines.append(f"**Status**: {check_result.get('status', 'unknown')}")
        report_lines.append(f"**Message**: {check_result.get('message', 'No message')}\n")
        
        # Add issues if present
        if 'issues' in check_result and check_result['issues']:
            report_lines.append("**Issues:**")
            for issue in check_result['issues']:
                report_lines.append(f"- {issue}")
            report_lines.append("")
        
        # Add warnings if present
        if 'warnings' in check_result and check_result['warnings']:
            report_lines.append("**Warnings:**")
            for warning in check_result['warnings']:
                report_lines.append(f"- {warning}")
            report_lines.append("")
        
        # Add violations if present
        if 'violations' in check_result and check_result['violations']:
            report_lines.append("**Violations:**")
            for violation_type, violation_data in check_result['violations'].items():
                report_lines.append(f"- **{violation_type}**: {len(violation_data)} found")
            report_lines.append("")
    
    # Recommendations
    report_lines.append("## Recommendations\n")
    if results['overall_status'] == 'pass':
        report_lines.append("✅ All checks passed. Implementation appears to align with specifications.")
    else:
        report_lines.append("❌ Some checks failed. Review the issues above and ensure:")
        report_lines.append("1. All features are documented in spec.md")
        report_lines.append("2. Acceptance criteria are clear and testable")
        report_lines.append("3. Implementation follows constitution constraints")
        report_lines.append("4. No undocumented features or scope creep")
    
    report = '\n'.join(report_lines)
    
    # Write to file if output path specified
    if output_path:
        Path(output_path).write_text(report)
    
    return report

def main():
    """Main orchestrator function."""
    parser = argparse.ArgumentParser(description='Run Spec-Driven Quality Gate')
    parser.add_argument('--spec-path', help='Path to spec.md file')
    parser.add_argument('--project-root', default='.', help='Project root directory')
    parser.add_argument('--output', help='Output path for compliance report')
    parser.add_argument('--json', action='store_true', help='Output JSON instead of markdown')
    
    args = parser.parse_args()
    
    # Get script directory
    script_dir = Path(__file__).parent
    
    # Results container
    results = {
        'timestamp': datetime.now().isoformat(),
        'overall_status': 'pass',
        'checks': {}
    }
    
    # Check 1: Validate spec exists
    print("Running: Validate Spec Exists...")
    spec_exists_result = run_script(script_dir / 'validate_spec_exists.py')
    results['checks']['Spec Exists'] = spec_exists_result
    
    # Determine spec path
    spec_path = args.spec_path
    if not spec_path and spec_exists_result.get('spec_path'):
        spec_path = spec_exists_result['spec_path']
    
    # Check 2: Check acceptance criteria (if spec found)
    if spec_path and Path(spec_path).exists():
        print("Running: Check Acceptance Criteria...")
        criteria_result = run_script(
            script_dir / 'check_acceptance_criteria.py',
            [spec_path]
        )
        results['checks']['Acceptance Criteria'] = criteria_result
        
        # Check 3: Detect scope creep
        print("Running: Detect Scope Creep...")
        scope_result = run_script(
            script_dir / 'detect_scope_creep.py',
            [spec_path]
        )
        results['checks']['Scope Alignment'] = scope_result
    else:
        results['checks']['Acceptance Criteria'] = {
            'status': 'error',
            'message': 'Skipped - spec file not found'
        }
        results['checks']['Scope Alignment'] = {
            'status': 'error',
            'message': 'Skipped - spec file not found'
        }
    
    # Check 4: Validate constitution compliance
    print("Running: Validate Constitution...")
    constitution_result = run_script(
        script_dir / 'validate_constitution.py',
        [args.project_root]
    )
    results['checks']['Constitution Compliance'] = constitution_result
    
    # Determine overall status
    failed_checks = [
        name for name, result in results['checks'].items()
        if result.get('status') == 'fail'
    ]
    
    if failed_checks:
        results['overall_status'] = 'fail'
    elif any(r.get('status') == 'error' for r in results['checks'].values()):
        results['overall_status'] = 'error'
    
    # Generate report
    if args.json:
        print(json.dumps(results, indent=2))
    else:
        report = generate_compliance_report(results, args.output)
        print("\n" + report)
        
        if args.output:
            print(f"\n📄 Report saved to: {args.output}")
    
    # Exit with appropriate code
    return 0 if results['overall_status'] == 'pass' else 1

if __name__ == '__main__':
    sys.exit(main())
