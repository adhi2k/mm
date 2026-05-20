# 📘 User Manual: Saveetha Training Module Enroller

Welcome to the Cloud-Based Saveetha Training Module Enroller! This system is designed to be **100% hands-free**. You do not need to keep your computer turned on, and you do not need to click any buttons. 

This manual will guide you on how to use the system day-to-day, how to check for errors, and how to maintain it.

---

## 🌟 1. Daily Usage (How it Works)

The entire automation pipeline is triggered by your Google Form. 

1. **Submit the Form:** A student (or you) submits the Google Form with their Registration Number and the desired Module(s).
2. **Google Sheet Updates:** The form automatically adds a row to your linked Google Sheet.
3. **The Cloud Bot Wakes Up:** Every 5 minutes, the GitHub Actions Cloud Server wakes up and checks your Google Sheet.
4. **Enrollment Happens:** If it sees a blank "System Status" column, it silently opens Moodle, logs in as you, and performs the exact clicks needed to enroll the student.
5. **Status Updated:** Once finished, the bot writes `Completed` back to the Google Sheet.

**Your only job is to share the Google Form. Everything else is automatic.**

---

## 📊 2. Checking the Status

You can monitor the entire system directly from your Google Sheet. Look at the **System Status** column:

- **(Blank)**: The bot hasn't seen this yet. It will process it within the next 5 minutes.
- **`Completed`**: The student was successfully enrolled!
- **`Failed All: [Error Message]`**: The bot tried twice to enroll the student but failed. Read the error message to see why.
- **`Partial Success`**: If you submitted multiple modules for one student, some succeeded and some failed.

---

## 🚨 3. How to View Error Screenshots

If a student fails to enroll, the bot takes a screenshot of the exact moment it failed so you can see what went wrong (e.g., "Student not found", "Website is down").

**To view the screenshots:**
1. Go to your GitHub Repository: `https://github.com/adhi2k/mm`
2. Click on the **Actions** tab at the top.
3. You will see a list of runs. Click on the most recent run (even if it has a red ❌).
4. Scroll all the way to the bottom of the page to the **Artifacts** section.
5. Click on **`automation-artifacts`** to download a ZIP file.
6. Open the ZIP file on your computer. Inside the `screenshots` folder, you will see exactly what the bot saw when it crashed!

---

## ⏸️ 4. How to Pause or Stop the Bot

If the Moodle website goes down for maintenance, or you want to stop enrolling students for a few days, you can pause the bot without deleting anything.

1. Go to your GitHub Repository > **Actions** tab.
2. Click on **Saveetha Enroller Automation** on the left sidebar.
3. On the right side of the screen, click the **three dots (...)**.
4. Click **Disable workflow**.

The bot is now sleeping. To turn it back on later, click **Enable workflow** in the same menu.

---

## 🔑 5. How to Update Your Password

If you ever change your Moodle password (`1504`), the bot will fail to log in. You must update the password in GitHub so the bot knows the new one.

1. Go to your GitHub Repository > **Settings** tab.
2. On the left sidebar, scroll down and click **Secrets and variables** > **Actions**.
3. Under "Repository secrets", you will see `MOODLE_PASSWORD`.
4. Click the **Pencil (Edit) icon** next to it.
5. Type your new password and click **Update secret**.

The bot will immediately start using your new password on its next run.

---

## ❓ Frequently Asked Questions (FAQ)

**Q: Can I submit 10 students at once?**  
A: Yes! You can submit as many rows as you want in the Google Sheet. The bot will process them one by one.

**Q: What happens if a student is already enrolled?**  
A: The bot is smart. If it searches for the student and Moodle says "No suggestions" (meaning they are already enrolled), the bot will simply skip them, mark them as `Completed` in the sheet, and move on.

**Q: Does my laptop need to be on?**  
A: No! The bot lives on GitHub's cloud servers in Microsoft's datacenters. It runs 24/7 regardless of what your laptop is doing. You can even manage it from your phone!
