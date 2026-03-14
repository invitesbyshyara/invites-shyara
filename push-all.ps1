# Shyara Invite - Git push helper
# Usage:
#   .\push-all.ps1
#   .\push-all.ps1 -CommitMessage "Describe the change"
#   .\push-all.ps1 -IncludeIgnored

param(
    [string]$CommitMessage,
    [switch]$IncludeIgnored,
    [switch]$SkipPush
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false

$Root = $PSScriptRoot

function Write-Step { param([string]$Message) Write-Host ""; Write-Host ">> $Message" -ForegroundColor Cyan }
function Write-Ok { param([string]$Message) Write-Host "   [OK]   $Message" -ForegroundColor Green }
function Write-Warn { param([string]$Message) Write-Host "   [WARN] $Message" -ForegroundColor Yellow }
function Write-Err { param([string]$Message) Write-Host "   [ERR]  $Message" -ForegroundColor Red }

function Require-Command {
    param([string]$Name, [string]$Hint)

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        Write-Err "$Name not found. $Hint"
        exit 1
    }
}

function Invoke-Git {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Args,
        [switch]$AllowFailure,
        [switch]$CaptureOutput
    )

    if ($CaptureOutput) {
        $output = & git @Args 2>&1
        $exitCode = $LASTEXITCODE

        if (-not $AllowFailure -and $exitCode -ne 0) {
            if ($output) {
                $output | ForEach-Object { Write-Host $_ }
            }
            throw "git $($Args -join ' ') failed with exit code $exitCode"
        }

        return [PSCustomObject]@{
            Output   = @($output)
            ExitCode = $exitCode
        }
    }

    & git @Args
    $exitCode = $LASTEXITCODE

    if (-not $AllowFailure -and $exitCode -ne 0) {
        throw "git $($Args -join ' ') failed with exit code $exitCode"
    }

    return $exitCode
}

function Get-TrimmedFirstLine {
    param([object[]]$Lines)

    $firstLine = $Lines | Select-Object -First 1
    if ($null -eq $firstLine) {
        return $null
    }

    return $firstLine.ToString().Trim()
}

function Get-CurrentBranch {
    $result = Invoke-Git -Args @("branch", "--show-current") -CaptureOutput
    return Get-TrimmedFirstLine -Lines $result.Output
}

function Get-UpstreamRef {
    $result = Invoke-Git -Args @("rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}") -AllowFailure -CaptureOutput
    if ($result.ExitCode -ne 0) {
        return $null
    }

    return Get-TrimmedFirstLine -Lines $result.Output
}

function Get-IgnoredPaths {
    $result = Invoke-Git -Args @("ls-files", "--others", "--ignored", "--exclude-standard", "--directory") -CaptureOutput
    return @($result.Output | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
}

function Should-IncludeIgnoredPaths {
    param([string[]]$IgnoredPaths)

    if ($IgnoredPaths.Count -eq 0) {
        return $false
    }

    Write-Step "Ignored paths detected"
    Write-Warn "These paths are excluded by .gitignore and will not be pushed unless you force them."
    $IgnoredPaths | Select-Object -First 10 | ForEach-Object { Write-Host "   $_" -ForegroundColor DarkYellow }
    if ($IgnoredPaths.Count -gt 10) {
        Write-Host "   ... and $($IgnoredPaths.Count - 10) more" -ForegroundColor DarkYellow
    }

    $response = Read-Host "Type INCLUDE to force-add ignored paths too, or press Enter to keep .gitignore exclusions"
    return $response.Trim().ToUpperInvariant() -eq "INCLUDE"
}

function Has-StagedChanges {
    & git diff --cached --quiet
    $exitCode = $LASTEXITCODE

    if ($exitCode -eq 0) {
        return $false
    }

    if ($exitCode -eq 1) {
        return $true
    }

    throw "git diff --cached --quiet failed with exit code $exitCode"
}

function Get-CommitMessage {
    param([string]$CurrentValue)

    $message = $CurrentValue
    while ([string]::IsNullOrWhiteSpace($message)) {
        $message = Read-Host "Enter commit message"
        $message = $message.Trim()
    }

    return $message
}

Write-Host ""
Write-Host "  +----------------------------------+" -ForegroundColor Magenta
Write-Host "  |    Shyara Invite  --  Git Push   |" -ForegroundColor Magenta
Write-Host "  +----------------------------------+" -ForegroundColor Magenta
Write-Host ""

Require-Command "git" "Install Git from https://git-scm.com/downloads"

Push-Location $Root
try {
    Write-Step "Checking repository"
    $repoRoot = Get-TrimmedFirstLine -Lines (Invoke-Git -Args @("rev-parse", "--show-toplevel") -CaptureOutput).Output
    if (-not $repoRoot) {
        throw "This script must be run inside a git repository."
    }
    Write-Ok "Repo root: $repoRoot"

    $branch = Get-CurrentBranch
    if ([string]::IsNullOrWhiteSpace($branch)) {
        throw "Detached HEAD is not supported. Check out a branch and run the script again."
    }
    Write-Ok "Current branch: $branch"

    Write-Step "Staging all repository changes"
    Invoke-Git -Args @("add", "--all")

    $ignoredPaths = Get-IgnoredPaths
    $shouldIncludeIgnored = $IncludeIgnored.IsPresent
    if (-not $shouldIncludeIgnored -and $ignoredPaths.Count -gt 0) {
        $shouldIncludeIgnored = Should-IncludeIgnoredPaths -IgnoredPaths $ignoredPaths
    }

    if ($shouldIncludeIgnored) {
        Write-Warn "Force-adding paths that match .gitignore"
        Invoke-Git -Args @("add", "--all", "--force")
        $ignoredPaths = @()
    }

    $status = (Invoke-Git -Args @("status", "--short") -CaptureOutput).Output
    if ($status.Count -gt 0) {
        $status | ForEach-Object { Write-Host "   $_" }
    } else {
        Write-Ok "No file changes detected"
    }

    if (Has-StagedChanges) {
        Write-Step "Creating commit"
        $CommitMessage = Get-CommitMessage -CurrentValue $CommitMessage
        Write-Ok "Commit message: $CommitMessage"
        Invoke-Git -Args @("commit", "-m", $CommitMessage)
    } else {
        Write-Ok "Nothing new to commit"
    }

    if ($SkipPush) {
        Write-Warn "Push skipped because -SkipPush was provided"
        return
    }

    Write-Step "Pushing to GitHub"
    $upstream = Get-UpstreamRef
    if ([string]::IsNullOrWhiteSpace($upstream)) {
        $originCheck = Invoke-Git -Args @("remote", "get-url", "origin") -AllowFailure -CaptureOutput
        if ($originCheck.ExitCode -ne 0) {
            throw "No upstream branch is configured and no origin remote was found."
        }

        Write-Warn "No upstream branch found. Setting upstream to origin/$branch"
        Invoke-Git -Args @("push", "--set-upstream", "origin", $branch)
    } else {
        Write-Ok "Using upstream: $upstream"
        Invoke-Git -Args @("push")
    }

    if ($ignoredPaths.Count -gt 0 -and -not $shouldIncludeIgnored) {
        Write-Step "Ignored paths not pushed"
        Write-Warn "Git still excluded $($ignoredPaths.Count) ignored path(s). Re-run with -IncludeIgnored if you really want those in the repo."
        $ignoredPaths | Select-Object -First 10 | ForEach-Object { Write-Host "   $_" -ForegroundColor DarkYellow }
        if ($ignoredPaths.Count -gt 10) {
            Write-Host "   ... and $($ignoredPaths.Count - 10) more" -ForegroundColor DarkYellow
        }
    }

    $remainingChanges = (Invoke-Git -Args @("status", "--short") -CaptureOutput).Output
    Write-Step "Finished"
    if ($remainingChanges.Count -eq 0) {
        Write-Ok "Working tree is clean for tracked files and unignored files."
    } else {
        Write-Warn "Some uncommitted changes remain:"
        $remainingChanges | ForEach-Object { Write-Host "   $_" -ForegroundColor Yellow }
    }
}
catch {
    Write-Err $_.Exception.Message
    exit 1
}
finally {
    Pop-Location
}
