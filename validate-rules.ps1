# Firebase Security Rules Validation Script (PowerShell)
# This script performs basic validation checks on Firebase security rules files

Write-Host "`n🔍 Firebase Security Rules Validation" -ForegroundColor Blue
Write-Host "=====================================" -ForegroundColor Blue

$allValid = $true

# Function to validate a rules file
function Validate-RulesFile {
    param(
        [string]$FilePath,
        [string]$RulesType
    )
    
    Write-Host "`n📋 Validating $RulesType rules: $FilePath" -ForegroundColor Blue
    
    if (-not (Test-Path $FilePath)) {
        Write-Host "❌ Error: File not found: $FilePath" -ForegroundColor Red
        return $false
    }
    
    $content = Get-Content $FilePath -Raw
    $isValid = $true
    
    # Check 1: File is not empty
    if ([string]::IsNullOrWhiteSpace($content)) {
        Write-Host "❌ Error: Rules file is empty" -ForegroundColor Red
        return $false
    }
    
    # Check 2: Contains rules_version declaration
    if ($content -notmatch "rules_version = '2'") {
        Write-Host "⚠️  Warning: Missing or incorrect rules_version declaration" -ForegroundColor Yellow
        $isValid = $false
    }
    
    # Check 3: Contains service declaration
    $servicePattern = if ($RulesType -eq "Firestore") { "service cloud\.firestore" } else { "service firebase\.storage" }
    if ($content -notmatch $servicePattern) {
        Write-Host "❌ Error: Missing service declaration for $RulesType" -ForegroundColor Red
        return $false
    }
    
    # Check 4: Balanced braces
    $openBraces = ([regex]::Matches($content, "{")).Count
    $closeBraces = ([regex]::Matches($content, "}")).Count
    
    if ($openBraces -ne $closeBraces) {
        Write-Host "❌ Error: Unbalanced braces ($openBraces open, $closeBraces close)" -ForegroundColor Red
        return $false
    }
    
    # Check 5: Contains match statements
    if ($content -notmatch "match /") {
        Write-Host "⚠️  Warning: No match statements found" -ForegroundColor Yellow
    }
    
    # Check 6: Contains allow statements
    if ($content -notmatch "allow ") {
        Write-Host "⚠️  Warning: No allow statements found" -ForegroundColor Yellow
    }
    
    # Check 7: Check for common patterns
    if ($content -match "if\s+true") {
        Write-Host "ℹ️  Info: Found 'if true' - ensure this is intentional for public access" -ForegroundColor Yellow
    }
    
    if ($isValid) {
        Write-Host "✅ $RulesType rules validation passed" -ForegroundColor Green
    }
    
    return $isValid
}

# Function to validate firebase.json
function Validate-FirebaseConfig {
    Write-Host "`n📋 Validating firebase.json configuration" -ForegroundColor Blue
    
    if (-not (Test-Path "firebase.json")) {
        Write-Host "❌ Error: firebase.json not found" -ForegroundColor Red
        return $false
    }
    
    try {
        $config = Get-Content "firebase.json" -Raw | ConvertFrom-Json
        
        # Check Firestore configuration
        if (-not $config.firestore -or -not $config.firestore.rules) {
            Write-Host "⚠️  Warning: Firestore rules not configured in firebase.json" -ForegroundColor Yellow
        } else {
            Write-Host "✅ Firestore rules configured: $($config.firestore.rules)" -ForegroundColor Green
        }
        
        # Check Storage configuration
        if (-not $config.storage -or -not $config.storage.rules) {
            Write-Host "⚠️  Warning: Storage rules not configured in firebase.json" -ForegroundColor Yellow
        } else {
            Write-Host "✅ Storage rules configured: $($config.storage.rules)" -ForegroundColor Green
        }
        
        return $true
    }
    catch {
        Write-Host "❌ Error parsing firebase.json: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Run validations
$allValid = Validate-FirebaseConfig
$allValid = (Validate-RulesFile -FilePath "firestore.rules" -RulesType "Firestore") -and $allValid
$allValid = (Validate-RulesFile -FilePath "storage.rules" -RulesType "Storage") -and $allValid

# Summary
Write-Host "`n=====================================" -ForegroundColor Blue
if ($allValid) {
    Write-Host "✅ All validation checks passed!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Blue
    Write-Host "1. Test rules with Firebase emulator: firebase emulators:start"
    Write-Host "2. Deploy rules: firebase deploy --only firestore:rules,storage:rules"
    exit 0
} else {
    Write-Host "❌ Validation failed. Please fix the errors above." -ForegroundColor Red
    exit 1
}
