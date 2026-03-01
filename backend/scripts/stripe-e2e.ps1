param(
    [string]$BaseUrl = "http://localhost:3000",
    [string]$Origin = "http://localhost:8080",
    [switch]$NoServerStart
)

$ErrorActionPreference = "Stop"

function Invoke-Api {
    param(
        [string]$Method,
        [string]$Path,
        [object]$Body = $null,
        [hashtable]$Headers = @{}
    )

    $allHeaders = @{ Origin = $Origin }
    foreach ($key in $Headers.Keys) {
        $allHeaders[$key] = $Headers[$key]
    }

    $params = @{
        Uri = "$BaseUrl$Path"
        Method = $Method
        Headers = $allHeaders
        TimeoutSec = 30
    }

    if ($null -ne $Body) {
        $params.ContentType = "application/json"
        if ($Body -is [string]) {
            $params.Body = $Body
        } else {
            $params.Body = ($Body | ConvertTo-Json -Depth 8)
        }
    }

    try {
        $response = Invoke-RestMethod @params
        return @{
            ok = $true
            status = 200
            body = $response
        }
    }
    catch {
        $status = 0
        if ($_.Exception.Response) {
            $status = [int]$_.Exception.Response.StatusCode
        }

        $errorBody = $_.ErrorDetails.Message
        if (-not $errorBody) {
            $errorBody = $_.Exception.Message
        }

        return @{
            ok = $false
            status = $status
            error = $errorBody
        }
    }
}

function Wait-Health {
    param([int]$TimeoutSeconds = 90)
    for ($i = 0; $i -lt $TimeoutSeconds; $i++) {
        try {
            $health = Invoke-RestMethod -Uri "$BaseUrl/health" -Headers @{ Origin = $Origin } -TimeoutSec 2
            if ($health.success -eq $true) {
                return $true
            }
        }
        catch {}
        Start-Sleep -Seconds 1
    }
    return $false
}

$backendDir = Split-Path -Parent $PSScriptRoot
$stdoutLog = Join-Path $backendDir "tmp-backend-out.log"
$stderrLog = Join-Path $backendDir "tmp-backend-err.log"
$proc = $null

if (-not $NoServerStart) {
    if (Test-Path $stdoutLog) { Remove-Item $stdoutLog -Force }
    if (Test-Path $stderrLog) { Remove-Item $stderrLog -Force }

    $proc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm run dev" -WorkingDirectory $backendDir -PassThru -RedirectStandardOutput $stdoutLog -RedirectStandardError $stderrLog
}

try {
    if (-not (Wait-Health -TimeoutSeconds 120)) {
        throw "Backend did not become healthy in time."
    }

    $email = "stripe.e2e.$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())@example.com"
    $register = Invoke-Api -Method "POST" -Path "/api/auth/register" -Body @{
        name = "Stripe E2E"
        email = $email
        password = "TestPass123!"
    }

    if (-not $register.ok) {
        throw "Register failed: $($register.error)"
    }

    $token = $register.body.data.accessToken
    if (-not $token) {
        throw "No access token from register."
    }

    $authHeaders = @{ Authorization = "Bearer $token" }

    $promoPercent = Invoke-Api -Method "POST" -Path "/api/checkout/validate-promo" -Headers $authHeaders -Body @{
        code = "WELCOME10"
        templateSlug = "royal-gold"
    }
    $promoFlat = Invoke-Api -Method "POST" -Path "/api/checkout/validate-promo" -Headers $authHeaders -Body @{
        code = "FLAT50"
        templateSlug = "royal-gold"
    }
    $freeCheckoutUsd = Invoke-Api -Method "POST" -Path "/api/checkout/create-order" -Headers $authHeaders -Body @{
        templateSlug = "rustic-charm"
        currency = "usd"
    }
    $paidCheckoutUsd = Invoke-Api -Method "POST" -Path "/api/checkout/create-order" -Headers $authHeaders -Body @{
        templateSlug = "royal-gold"
        currency = "usd"
    }
    $paidCheckoutEur = Invoke-Api -Method "POST" -Path "/api/checkout/create-order" -Headers $authHeaders -Body @{
        templateSlug = "floral-garden"
        currency = "eur"
    }
    $paidCheckoutUsdPercent = Invoke-Api -Method "POST" -Path "/api/checkout/create-order" -Headers $authHeaders -Body @{
        templateSlug = "eternal-vows"
        currency = "usd"
        promoCode = "WELCOME10"
    }
    $paidCheckoutUsdFlat = Invoke-Api -Method "POST" -Path "/api/checkout/create-order" -Headers $authHeaders -Body @{
        templateSlug = "modern-summit"
        currency = "usd"
        promoCode = "FLAT50"
    }
    $webhookInvalidSignature = Invoke-Api -Method "POST" -Path "/api/checkout/stripe-webhook" -Headers @{
        "stripe-signature" = "t=12345,v1=invalid"
    } -Body @{
        id = "evt_test_invalid"
        type = "payment_intent.succeeded"
        data = @{
            object = @{
                id = "pi_test_invalid"
            }
        }
    }

    $webhookSecret = Get-Content (Join-Path $backendDir ".env") |
        Where-Object { $_ -match "^STRIPE_WEBHOOK_SECRET=" } |
        Select-Object -First 1
    $webhookSecret = if ($webhookSecret) { ($webhookSecret -split "=", 2)[1] } else { "" }
    $webhookValidSignature = $null
    if ($webhookSecret) {
        $validPayload = '{"id":"evt_test_valid","type":"payment_intent.succeeded","data":{"object":{"id":"pi_test_valid","latest_charge":"ch_test_valid"}}}'
        $timestamp = [int][DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
        $signedPayload = "$timestamp.$validPayload"
        $hmac = New-Object System.Security.Cryptography.HMACSHA256
        $hmac.Key = [System.Text.Encoding]::UTF8.GetBytes($webhookSecret)
        $hashBytes = $hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($signedPayload))
        $signature = -join ($hashBytes | ForEach-Object { $_.ToString("x2") })
        $stripeSignatureHeader = "t=$timestamp,v1=$signature"

        $webhookValidSignature = Invoke-Api -Method "POST" -Path "/api/checkout/stripe-webhook" -Headers @{
            "stripe-signature" = $stripeSignatureHeader
        } -Body $validPayload
    }

    $adminLogin = Invoke-Api -Method "POST" -Path "/api/admin/auth/login" -Body @{
        email = "admin@shyara.co.in"
        password = "admin123"
    }
    $refundAttempt = $null
    if ($adminLogin.ok -and $freeCheckoutUsd.ok) {
        $adminHeaders = @{ Authorization = "Bearer $($adminLogin.body.data.token)" }
        $refundAttempt = Invoke-Api -Method "POST" -Path "/api/admin/transactions/$($freeCheckoutUsd.body.data.transactionId)/refund" -Headers $adminHeaders -Body @{
            reason = "E2E refund check"
        }
    }

    $result = [ordered]@{
        register = @{
            ok = $register.ok
            email = $email
        }
        validatePromoPercent = if ($promoPercent.ok) {
            @{
                ok = $true
                label = $promoPercent.body.data.label
                discountType = $promoPercent.body.data.discountType
                discountValue = $promoPercent.body.data.discountValue
            }
        } else {
            @{
                ok = $false
                status = $promoPercent.status
                error = $promoPercent.error
            }
        }
        validatePromoFlat = if ($promoFlat.ok) {
            @{
                ok = $true
                label = $promoFlat.body.data.label
                discountType = $promoFlat.body.data.discountType
                discountValue = $promoFlat.body.data.discountValue
            }
        } else {
            @{
                ok = $false
                status = $promoFlat.status
                error = $promoFlat.error
            }
        }
        freeCheckoutUsd = if ($freeCheckoutUsd.ok) {
            @{
                ok = $true
                free = $freeCheckoutUsd.body.data.free
                transactionId = $freeCheckoutUsd.body.data.transactionId
                inviteId = $freeCheckoutUsd.body.data.inviteId
            }
        } else {
            @{
                ok = $false
                status = $freeCheckoutUsd.status
                error = $freeCheckoutUsd.error
            }
        }
        paidCheckoutUsd = if ($paidCheckoutUsd.ok) {
            @{
                ok = $true
                paymentIntentId = $paidCheckoutUsd.body.data.paymentIntentId
                amount = $paidCheckoutUsd.body.data.amount
                currency = $paidCheckoutUsd.body.data.currency
            }
        } else {
            @{
                ok = $false
                status = $paidCheckoutUsd.status
                error = $paidCheckoutUsd.error
            }
        }
        paidCheckoutEur = if ($paidCheckoutEur.ok) {
            @{
                ok = $true
                paymentIntentId = $paidCheckoutEur.body.data.paymentIntentId
                amount = $paidCheckoutEur.body.data.amount
                currency = $paidCheckoutEur.body.data.currency
            }
        } else {
            @{
                ok = $false
                status = $paidCheckoutEur.status
                error = $paidCheckoutEur.error
            }
        }
        paidCheckoutUsdPercentPromo = if ($paidCheckoutUsdPercent.ok) {
            @{
                ok = $true
                amount = $paidCheckoutUsdPercent.body.data.amount
                currency = $paidCheckoutUsdPercent.body.data.currency
            }
        } else {
            @{
                ok = $false
                status = $paidCheckoutUsdPercent.status
                error = $paidCheckoutUsdPercent.error
            }
        }
        paidCheckoutUsdFlatPromo = if ($paidCheckoutUsdFlat.ok) {
            @{
                ok = $true
                amount = $paidCheckoutUsdFlat.body.data.amount
                currency = $paidCheckoutUsdFlat.body.data.currency
            }
        } else {
            @{
                ok = $false
                status = $paidCheckoutUsdFlat.status
                error = $paidCheckoutUsdFlat.error
            }
        }
        webhookInvalidSignature = if ($webhookInvalidSignature.ok) {
            @{
                ok = $true
                note = "Unexpected success"
            }
        } else {
            @{
                ok = $false
                status = $webhookInvalidSignature.status
                error = $webhookInvalidSignature.error
            }
        }
        webhookValidSignature = if ($null -eq $webhookValidSignature) {
            @{
                ok = $false
                status = 0
                error = "Webhook secret missing."
            }
        } elseif ($webhookValidSignature.ok) {
            @{
                ok = $true
                status = 200
            }
        } else {
            @{
                ok = $false
                status = $webhookValidSignature.status
                error = $webhookValidSignature.error
            }
        }
        adminLogin = if ($adminLogin.ok) {
            @{
                ok = $true
                email = "admin@shyara.co.in"
            }
        } else {
            @{
                ok = $false
                status = $adminLogin.status
                error = $adminLogin.error
            }
        }
        refundAttempt = if ($null -eq $refundAttempt) {
            @{
                ok = $false
                status = 0
                error = "Refund attempt was not executed."
            }
        } elseif ($refundAttempt.ok) {
            @{
                ok = $true
                status = 200
            }
        } else {
            @{
                ok = $false
                status = $refundAttempt.status
                error = $refundAttempt.error
            }
        }
    }

    $json = $result | ConvertTo-Json -Depth 8
    $reportPath = Join-Path $backendDir "stripe-e2e-report.json"
    Set-Content -Path $reportPath -Value $json
    Write-Output $json
    Write-Host "Report written: $reportPath"
}
finally {
    if ($proc) {
        cmd /c "taskkill /PID $($proc.Id) /T /F >nul 2>nul" | Out-Null
    }
}
