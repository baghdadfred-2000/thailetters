# Thai Letters - Git setup script
# Run this from inside the project folder in PowerShell:
#   cd "C:\Users\fkand\OneDrive\Belgeler\Desktop\CLAUDE PROJECTS\thailetters"
#   powershell -ExecutionPolicy Bypass -File .\git-setup.ps1

$ErrorActionPreference = "Stop"

# 0. Remove any broken/partial .git folder from a failed init
if (Test-Path ".git") {
    Write-Host "Removing existing .git folder..."
    Remove-Item -Recurse -Force ".git"
}

# 1. Initialize repo
git init

# 2. (Optional) set identity if not already configured globally
#    git config user.name  "baghdadfred-2000"
#    git config user.email "fkanderson@gmail.com"

# 3. Stage everything
git add .

# 4. Initial commit
git commit -m "Initial commit: Thai Letters site (HTML, CSS, assets)"

# 5. Set branch to main
git branch -M main

# 6. Add remote origin
git remote add origin https://github.com/baghdadfred-2000/thailetters.git

# 7. Push
git push -u origin main

# 8. Verify
Write-Host "`n--- git remote -v ---"
git remote -v
Write-Host "`n--- git status ---"
git status
