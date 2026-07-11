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


### 3. Add Students
You don't need to change any files! The cloud bot is automatically connected to your **Google Sheet** (the same one you used for the Chrome Extension). Just fill out your Google Form, and the GitHub Action will automatically fetch the pending students every 5 minutes and write back "Completed" to the sheet when done!

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
3. Set your environment variables (Windows PowerShell: `$env:MOODLE_USERNAME="your_username"; $env:MOODLE_PASSWORD="yourpassword"`).
4. Run `npm start`.

## Troubleshooting & Logs
- If a student fails to enroll, the bot will automatically retry once.
- If it fails again, it will take a screenshot.
- You can view the logs and download the screenshots by clicking on the completed Action run in GitHub and downloading the `automation-artifacts.zip` file at the bottom of the summary page.
