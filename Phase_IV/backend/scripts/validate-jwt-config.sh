#!/bin/bash

# JWT Configuration Validator
# Checks BETTER_AUTH_SECRET length and JWKS endpoint reachability
# Exit codes:
#   0: All validations passed
#   1: Configuration errors found
#   2: Network errors found

set -e  # Exit immediately if a command exits with a non-zero status

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_success() {
    print_status $GREEN "✓ $1"
}

print_warning() {
    print_status $YELLOW "⚠ $1"
}

print_error() {
    print_status $RED "✗ $1"
}

print_info() {
    print_status $BLUE "ℹ $1"
}

# Function to check if jq is installed
check_jq_installed() {
    if ! command -v jq &> /dev/null; then
        print_error "jq is required but not installed. Please install jq to parse JSON responses."
        print_info "On Ubuntu/Debian: sudo apt-get install jq"
        print_info "On macOS: brew install jq"
        print_info "On CentOS/RHEL: sudo yum install jq"
        exit 1
    fi
}

# Function to validate BETTER_AUTH_SECRET
validate_secret() {
    local secret="$1"

    if [[ -z "$secret" ]]; then
        print_warning "BETTER_AUTH_SECRET is not set. This is OK for production with RS256/JWKS, but required for development with HS256."
        return 0
    fi

    local secret_length=${#secret}

    if [[ $secret_length -lt 32 ]]; then
        print_error "BETTER_AUTH_SECRET is too short. Minimum length is 32 characters, got $secret_length."
        return 1
    else
        print_success "BETTER_AUTH_SECRET length is sufficient ($secret_length characters)."
        return 0
    fi
}

# Function to validate BETTER_AUTH_URL
validate_auth_url() {
    local auth_url="$1"

    if [[ -z "$auth_url" ]]; then
        print_error "BETTER_AUTH_URL is not set. This is required for JWT authentication."
        return 1
    fi

    # Check if URL is valid format
    if [[ ! "$auth_url" =~ ^https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(:[0-9]+)?$ ]]; then
        print_error "BETTER_AUTH_URL format is invalid: $auth_url"
        return 1
    fi

    print_success "BETTER_AUTH_URL format is valid: $auth_url"
    return 0
}

# Function to test JWKS endpoint
test_jwks_endpoint() {
    local auth_url="$1"
    local secret="$2"

    if [[ -z "$auth_url" ]]; then
        print_error "Cannot test JWKS endpoint: BETTER_AUTH_URL is not set."
        return 1
    fi

    # Construct JWKS URL
    local jwks_url="${auth_url%/}/.well-known/jwks.json"
    print_info "Testing JWKS endpoint: $jwks_url"

    # Test the JWKS endpoint
    local response
    local http_code
    response=$(curl -s -w "\n%{http_code}" -m 10 --max-time 10 "$jwks_url" 2>/dev/null)
    http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')

    if [[ $http_code -eq 0 ]]; then
        print_error "Failed to connect to JWKS endpoint: $jwks_url"
        print_error "Possible causes:"
        print_error "  - Network connectivity issues"
        print_error "  - Incorrect BETTER_AUTH_URL"
        print_error "  - JWKS endpoint not available"
        return 2
    elif [[ $http_code -ge 400 ]]; then
        print_error "JWKS endpoint returned error: HTTP $http_code"
        print_error "Response: $body"
        return 2
    else
        print_success "JWKS endpoint is reachable: HTTP $http_code"

        # Validate JSON response
        if echo "$body" | jq empty 2>/dev/null; then
            print_success "JWKS response is valid JSON"

            # Check if keys exist in response
            local key_count
            key_count=$(echo "$body" | jq '.keys | length' 2>/dev/null)

            if [[ -n "$key_count" ]] && [[ $key_count -gt 0 ]]; then
                print_success "JWKS contains $key_count key(s)"

                # Check key algorithms
                local algorithms
                algorithms=$(echo "$body" | jq -r '.keys[].alg' 2>/dev/null | sort -u | tr '\n' ' ')
                print_info "Supported algorithms: $algorithms"

                # Verify RS256 is available for production
                if echo "$algorithms" | grep -q "RS256"; then
                    print_success "RS256 algorithm is available (recommended for production)"
                else
                    print_warning "RS256 algorithm not found. Consider using RS256 for production security."
                fi

                return 0
            else
                print_error "JWKS response does not contain any keys"
                return 2
            fi
        else
            print_error "JWKS response is not valid JSON: $body"
            return 2
        fi
    fi
}

# Main validation function
main() {
    print_info "Starting JWT Configuration Validation..."
    echo ""

    # Check if jq is installed
    check_jq_installed

    # Load environment variables from .env file if it exists
    if [[ -f ".env" ]]; then
        print_info "Loading environment variables from .env file..."
        export $(grep -v '^#' .env | xargs)
    else
        print_warning ".env file not found. Using environment variables from shell."
    fi

    # Get configuration values
    local better_auth_secret="$BETTER_AUTH_SECRET"
    local better_auth_url="$BETTER_AUTH_URL"

    print_info "Configuration values:"
    print_info "  BETTER_AUTH_URL: ${better_auth_url:-[not set]}"
    print_info "  BETTER_AUTH_SECRET: ${better_auth_secret:+[set]}${better_auth_secret:-[not set]}"
    echo ""

    # Validate configuration
    local config_errors=0
    local network_errors=0

    # Validate secret
    if ! validate_secret "$better_auth_secret"; then
        ((config_errors++))
    fi

    # Validate auth URL
    if ! validate_auth_url "$better_auth_url"; then
        ((config_errors++))
    fi

    echo ""

    # Test JWKS endpoint
    if ! test_jwks_endpoint "$better_auth_url" "$better_auth_secret"; then
        local exit_code=$?
        if [[ $exit_code -eq 1 ]]; then
            ((config_errors++))
        elif [[ $exit_code -eq 2 ]]; then
            ((network_errors++))
        fi
    fi

    echo ""

    # Summary
    if [[ $config_errors -gt 0 ]] && [[ $network_errors -gt 0 ]]; then
        print_error "Validation failed with $config_errors configuration error(s) and $network_errors network error(s)."
        exit 1
    elif [[ $config_errors -gt 0 ]]; then
        print_error "Validation failed with $config_errors configuration error(s)."
        exit 1
    elif [[ $network_errors -gt 0 ]]; then
        print_error "Validation failed with $network_errors network error(s)."
        exit 2
    else
        print_success "All validations passed!"
        print_success "JWT configuration is ready for production."
        exit 0
    fi
}

# Run main function
main "$@"