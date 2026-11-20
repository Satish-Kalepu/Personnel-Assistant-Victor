# Exact, one-time Victor retirement approved in prompts 002/003/007.
# Default is read-only. Never broaden these identifiers to unrelated resources.
param([switch]$Execute)
$ErrorActionPreference = 'Stop'
$env:AWS_EC2_METADATA_DISABLED = 'true'
$env:AWS_PAGER = ''
$region = 'ap-south-1'
$profile = 'victor'
$stackName = 'victor-phase1'
$supportStack = 'aws-sam-cli-managed-default'
$tableName = 'victor-phase1-DataTable-PRQV353MIB3O'
$budgetName = 'victor-account-50-monthly'
$bucketName = 'aws-sam-cli-managed-default-samclisourcebucket-72hkdlvg1t6w'
$functionName = 'victor-phase1-ApiFunction-MBAimA5zNLAc'
$reviewPath = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../.local/legacy-review'))
function Read-Aws([string[]]$Arguments) {
    $result = & aws @Arguments --profile $profile --region $region --output json
    if ($LASTEXITCODE -ne 0) { throw "AWS command failed: $($Arguments[0]) $($Arguments[1])" }
    if ($result) { return ($result | ConvertFrom-Json) }
}
$identity = Read-Aws @('sts','get-caller-identity')
$stack = (Read-Aws @('cloudformation','describe-stacks','--stack-name',$stackName)).Stacks[0]
$resources = (Read-Aws @('cloudformation','list-stack-resources','--stack-name',$stack.StackId)).StackResourceSummaries
if ($resources.Count -ne 17) { throw 'Resource count changed; review ownership before retirement.' }
foreach ($entry in @(@('DataTable',$tableName),@('ApiFunction',$functionName),@('Api','zq8981osu8'),@('MonthlyAccountBudget',$budgetName),@('UserPool','ap-south-1_9SdIq4rUE'))) {
    if (($resources | Where-Object LogicalResourceId -eq $entry[0]).PhysicalResourceId -ne $entry[1]) { throw 'Project resource identity changed; stop.' }
}
$table = (Read-Aws @('dynamodb','describe-table','--table-name',$tableName)).Table
if ($table.DeletionProtectionEnabled) { throw 'Unexpected table deletion protection; review required.' }
$backups = (Read-Aws @('dynamodb','list-backups','--table-name',$tableName,'--backup-type','ALL')).BackupSummaries
$recovery = (Read-Aws @('backup','list-recovery-points-by-resource','--resource-arn',$table.TableArn)).RecoveryPoints
if ($backups.Count -or $recovery.Count) { throw 'Backup inventory changed; review exact retained copies before permanent deletion.' }
$support = (Read-Aws @('cloudformation','describe-stacks','--stack-name',$supportStack)).Stacks[0]
foreach ($output in $support.Outputs) {
    if ($output.ExportName) {
        $imports = (Read-Aws @('cloudformation','list-imports','--export-name',$output.ExportName)).Imports
        if ($imports.Count) { throw 'SAM support exports are in use; do not delete shared support resources.' }
    }
}
$reviewedObjects = Get-Content -LiteralPath (Join-Path $reviewPath 'object-manifest.json') -Raw | ConvertFrom-Json
$allowedKeys = @($reviewedObjects | ForEach-Object Key)
if ($allowedKeys.Count -ne 12) { throw 'Expected exactly 12 independently reviewed Victor artifacts.' }
$versions = Read-Aws @('s3api','list-object-versions','--bucket',$bucketName)
$allObjects = @($versions.Versions) + @($versions.DeleteMarkers) | Where-Object { $_ }
foreach ($item in $allObjects) { if ($item.Key -notin $allowedKeys) { throw 'Unreviewed bucket object/version found; stop shared-bucket cleanup.' } }
$manifest = [ordered]@{ Account = $identity.Account; StackId = $stack.StackId; Resources = $resources; TableArn = $table.TableArn; Budget = $budgetName; SamBucket = $bucketName; ArtifactVersions = $allObjects; DataExport = $false; StandaloneBackups = @($backups).Count; AwsBackupCopies = @($recovery).Count }
$manifest | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath (Join-Path $reviewPath 'retirement-manifest.json') -Encoding utf8
Write-Output "Verified exact Victor resources, no standalone/AWS Backup copies, and $($allObjects.Count) reviewed artifact versions. Unrelated Cloud9/EC2/ALB/DNS are excluded."
if (-not $Execute) { Write-Output 'Read-only manifest complete. No resource changes.'; exit 0 }
Read-Aws @('lambda','put-function-concurrency','--function-name',$functionName,'--reserved-concurrent-executions','0') | Out-Null
Read-Aws @('dynamodb','update-continuous-backups','--table-name',$tableName,'--point-in-time-recovery-specification','PointInTimeRecoveryEnabled=false') | Out-Null
$disabled = $false
for ($i=0; $i -lt 20; $i++) {
    $state = (Read-Aws @('dynamodb','describe-continuous-backups','--table-name',$tableName)).ContinuousBackupsDescription.PointInTimeRecoveryDescription.PointInTimeRecoveryStatus
    if ($state -eq 'DISABLED') { $disabled=$true; break }
    Start-Sleep -Seconds 2
}
if (-not $disabled) { throw 'PITR did not disable; stop before deleting the table.' }
Read-Aws @('cloudformation','delete-stack','--stack-name',$stack.StackId) | Out-Null
& aws cloudformation wait stack-delete-complete --stack-name $stack.StackId --profile $profile --region $region
if ($LASTEXITCODE -ne 0) { throw 'Victor stack deletion requires investigation; do not claim retirement complete.' }
Read-Aws @('dynamodb','delete-table','--table-name',$tableName) | Out-Null
& aws dynamodb wait table-not-exists --table-name $tableName --profile $profile --region $region
if ($LASTEXITCODE -ne 0) { throw 'Retained table deletion not confirmed.' }
Read-Aws @('budgets','delete-budget','--account-id',$identity.Account,'--budget-name',$budgetName) | Out-Null
$delete = @{ Objects = @($allObjects | ForEach-Object { @{ Key=$_.Key; VersionId=$_.VersionId } }); Quiet=$true }
$deleteFile = Join-Path $reviewPath 'delete-reviewed-versions.json'
[IO.File]::WriteAllText($deleteFile,($delete | ConvertTo-Json -Depth 5),[Text.UTF8Encoding]::new($false))
$deleted = Read-Aws @('s3api','delete-objects','--bucket',$bucketName,'--delete',('file://' + $deleteFile))
if ($deleted.Errors.Count) { throw 'Some artifact versions were not deleted.' }
$remaining = Read-Aws @('s3api','list-object-versions','--bucket',$bucketName)
if ($remaining.Versions.Count -or $remaining.DeleteMarkers.Count) { throw 'Bucket is not empty; do not delete support stack.' }
Read-Aws @('cloudformation','delete-stack','--stack-name',$support.StackId) | Out-Null
& aws cloudformation wait stack-delete-complete --stack-name $support.StackId --profile $profile --region $region
if ($LASTEXITCODE -ne 0) { throw 'SAM support deletion requires investigation.' }
$ownedBuckets = (Read-Aws @('s3api','list-buckets')).Buckets
if ($ownedBuckets.Name -contains $bucketName) { Read-Aws @('s3api','delete-bucket','--bucket',$bucketName) | Out-Null }
Write-Output 'Legacy stack, retained table/budget and reviewed SAM resources deleted. Perform independent post-deletion verification before reporting completion.'
