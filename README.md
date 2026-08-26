# Result Maker - User Guide 🏆

Welcome to **Result Maker**, the ultimate platform for schools to manage student data, upload test scores, and generate beautiful, real-time public leaderboards and PDF performance reports!

This guide covers everything you need to know to get started and master the platform.

---

## 📚 Table of Contents
1. [Logging In & Security](#1-logging-in--security)
2. [Managing the Student Roster](#2-managing-the-student-roster)
   - [Bulk Uploading Students](#bulk-uploading-students)
   - [Editing & Deleting Students](#editing--deleting-students)
   - [Leaderboard Visibility (Privacy)](#leaderboard-visibility-privacy)
   - [Year-End Promotions (Bulk Move)](#year-end-promotions-bulk-move)
3. [Uploading Test Marks](#3-uploading-test-marks)
4. [The Public Leaderboard](#4-the-public-leaderboard)
5. [Exporting PDF Reports](#5-exporting-pdf-reports)

---

## 1. Logging In & Security
Your data is securely isolated. When you log in with your school credentials, you are placed in your own secure environment. 
- You cannot see other schools' students or data.
- Unauthenticated visitors cannot access your dashboard.
- Unauthenticated visitors **can** view the public class leaderboards, but *only* for students you have explicitly chosen to publish.

---

## 2. Managing the Student Roster
The **Student Roster** is your master database of every student in your school. 

### Bulk Uploading Students
Instead of typing student data one by one, you can upload an Excel sheet to create an entire class instantly.
1. Enter the target **Class Name** in the input field (e.g., `Class 6`).
2. Click **Upload Master Roster**.
3. Select your Excel file (`.xlsx` or `.csv`).
   - *Tip:* Ensure your Excel file has headers like `Name`, `Roll Number`, `Section`, `Registration Number`, `Father Name`, `Father Phone`, and `Father CNIC`. If they exist, they will be mapped automatically!

### Editing & Deleting Students
- **Edit:** Click the **Pencil (Edit)** icon next to any student to update their details, roll number, or parent contact info.
- **Delete:** Click the **Trash** icon to permanently remove a student and all their associated test scores.

### Leaderboard Visibility (Privacy)
By default, **all students are hidden from the public leaderboard** to protect their privacy (even if they have test scores). 
- **Publish a single student:** Click the **Eye-Off** icon in the "Leaderboard" column to change it to an **Eye** (Published).
- **Publish a whole class:** Select the class from the dropdown, click the top-left checkbox to select everyone, and click **Publish** in the green bulk-action bar.

### Year-End Promotions (Bulk Move)
When the academic year ends, you can easily promote an entire class to the next grade.
1. Filter by their current class (e.g., `Class 6`).
2. Click the top-left checkbox to select all students.
3. Click the **Promote** button in the green bulk-action bar.
4. Enter the new class name (e.g., `Class 7`) and confirm!

---

## 3. Uploading Test Marks
When a test (like "Midterms" or "March Assessment") finishes, you can upload the marks using the **Upload Marks** tab.

1. **Select Class & Test:** Enter the Class name and the Test Name.
2. **Upload Sheets:** Click to upload your Excel files containing the marks. You can upload multiple files (e.g., one for Math, one for Science).
3. **Review Data:** The system will intelligently match the students in the Excel sheet to your Student Roster using their Name or Roll Number. 
   - *Note: If a student in the Excel file does not exist in your Master Roster, their scores will be skipped. Ensure your Roster is up-to-date!*
4. **Delete Sheets:** If you accidentally uploaded the wrong subject, click the red "X" icon on that specific sheet to remove it before saving.
5. **Finalize:** Click **Save Marks** to lock the scores into the database.

---

## 4. The Public Leaderboard
Every class has a stunning, public-facing leaderboard that you can share with parents and students. 

**Features:**
- **The Podium:** The Top 3 students are celebrated with an animated 3D podium, complete with Gold, Silver, and Bronze medals and confetti!
- **Tiers:** Students are automatically categorized into tiers based on their percentage:
  - **Platinum:** 85%+
  - **Gold:** 70% - 84%
  - **Silver:** 50% - 69%
  - **Bronze:** Below 50%
- **Performance Trends:** Click on any student's row to expand it. You will see a breakdown of their exact scores in every test, how they compare to the Class Average, and a **Line Chart** tracking their performance over time.

*(Remember: Only students you have explicitly published via the Student Roster will appear here!)*

---

## 5. Exporting PDF Reports
You can generate high-quality, print-ready PDF reports directly from the Leaderboard.

1. Go to the Class Leaderboard.
2. Check the boxes next to the students you want to include in the report (or click the top checkbox to select everyone).
3. Click **Export Report** at the top right.
4. **Configure Report:** A modal will appear listing every test taken by this class. Select which tests you want to include in the calculation. (e.g., Uncheck weekly quizzes if you only want to generate a report based on the Midterm and Final).
5. Click **Export PDF**. The system will generate a beautiful consolidated report with bar charts, line charts, and subject breakdowns for you to print or email!
