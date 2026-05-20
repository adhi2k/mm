# Saveetha Enroller Bot (Playwright + GitHub Actions)

A fully cloud-based automation system for Moodle enrollment. This replaces the Chrome Extension by running a headless Chromium browser inside GitHub Actions.

## Setup Instructions

### 1. Initialize Git Repository
Upload this entire folder to a new private GitHub repository.
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Configure GitHub Secrets (Security)
Never hardcode your password! We use GitHub Secrets to keep your Moodle login safe.
1. Go to your GitHub Repository in your browser.
2. Click **Settings** > **Secrets and variables** > **Actions**.
3. Click **New repository secret**.
4. Add `MOODLE_USERNAME` (e.g., `ilavarasan`).
5. Add `MOODLE_PASSWORD` (e.g., `1504`).

### 3. Add Students
Edit the `students.json` file with the registration numbers and modules you want to enroll. Push the updated `students.json` file to GitHub whenever you want to process a new batch.

### 4. Enable GitHub Actions
1. Go to the **Actions** tab in your repository.
2. Click **I understand my workflows, go ahead and enable them**.
3. The script is now configured to run automatically every 5 minutes.

### 5. Running Manually
If you want to trigger it immediately without waiting 5 minutes:
1. Go to the **Actions** tab.
2. Click **Saveetha Enroller Automation** on the left.
3. Click **Run workflow** on the right side.

## Local Testing
If you want to test the Playwright script on your laptop before pushing to GitHub:
1. Install Node.js.
2. Open a terminal in this folder and run `npm install`.
3. Set your environment variables (Windows PowerShell: `$env:MOODLE_USERNAME="ilavarasan"; $env:MOODLE_PASSWORD="yourpassword"`).
4. Run `npm start`.

## Troubleshooting & Logs
- If a student fails to enroll, the bot will automatically retry once.
- If it fails again, it will take a screenshot.
- You can view the logs and download the screenshots by clicking on the completed Action run in GitHub and downloading the `automation-artifacts.zip` file at the bottom of the summary page.

## Bonus: Google Sheets API Integration
Currently, this system reads from a hardcoded `students.json` file. To connect it directly to your existing Google Apps Script:
1. In `index.js`, install `axios` (`npm install axios`).
2. Replace the `students` array loading logic with:
```javascript
const axios = require('axios');
const response = await axios.get('YOUR_WEB_APP_URL');
const students = response.data.data;
```
3. Use an `axios.post` request at the end of the `enrollStudent` function to write "Completed" back to your Google Sheet!
