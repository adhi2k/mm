// Configuration file for Training Module Enroller
// This file is shared across popup, background, and content scripts.

const CONFIG = {
  // ==========================================
  // 1. GOOGLE APPS SCRIPT URL
  // ==========================================
  // Paste your deployed Web App URL here
  webAppUrl: "https://script.google.com/macros/s/AKfycbxQLmOYSaaNaMxqA68rddM6JfEc3rYU3xPSYIVHw_jIGC0QeJv4QWYwWeuS_i8q_fhb/exec",

  // ==========================================
  // 2. COURSE ID MAPPING
  // ==========================================
  // Update these with the real Course IDs from training.saveetha.in
  // The format is "Category-ModuleNumber": "ActualCourseID"
  courseMapping: {
    "TT DS PYTHON MODULE-I": "60",
    "TT DS PYTHON MODULE-II": "61",
    "TT DS PYTHON MODULE-III": "62",
    "TT DS PYTHON MODULE-IV": "63",
    "TT DS PYTHON MODULE-V": "64",
    "TT DS PYTHON MODULE-VI": "65",
    "TT DS PYTHON MODULE-VII": "66",
    "TT DS PYTHON MODULE-VIII": "67",
    "TT DS PYTHON MODULE-IX": "92",
    "TT DS PYTHON MODULE-X": "93",
    "TT DS PYTHON MODULE-XI": "94",
    "TT DS PYTHON MODULE-XII": "95",
    "TT DS PYTHON MODULE-13": "96",
    "TT DS PYTHON MODULE-14": "97",
    "TT DS PYTHON MODULE-15": "98",
    "TT DS PYTHON MODULE-16": "99",
    "TT DS PYTHON MODULE-17": "100",
    "TT DS PYTHON MODULE-18": "101",
    "TT DS PYTHON MODULE-19": "102",
    "TT DS PYTHON MODULE-20": "103",
    "TT DS PYTHON MODULE-21": "104",
    "TT DS PYTHON MODULE-22": "105",
    "TT DS PYTHON MODULE-23": "106",
    "TT DS PYTHON MODULE-24": "107",
    "TT JAVA MODULE-I": "68",
    "TT JAVA MODULE-II": "69",
    "TT JAVA MODULE-III": "70",
    "TT JAVA MODULE-IV": "71",
    "TT JAVA MODULE-V": "72",
    "TT JAVA MODULE-VI": "73",
    "TT JAVA MODULE-VII": "74",
    "TT JAVA MODULE-VIII": "75",
    "TT Module - I": "35",
    "TT Module - II": "37",
    "TT Module - III": "38",
    "TT Module - IV": "39",
    "TT Module - VI": "36",
    "TT Module - VII": "40",
    "TT Module - VIII": "41",
    "TT Module - IX": "44",
    "TT Module - X": "47",
    "TT Module - XI": "45",
    "TT Module - XII": "51",
    "TT DS PYTHON MODULE - V-B":"151",
    "TT Module - V NEW":"158"
    // Add more courses here following the same pattern
  },



  // ==========================================
  // 4. CSS SELECTORS
  // ==========================================
  // REPLACE THESE WITH ACTUAL SELECTORS AFTER INSPECTING THE WEBSITE
  selectors: {
    // Login Form
    loginUsernameInput: 'input[name="username"], #username',
    loginPasswordInput: 'input[name="password"], #password',
    loginSubmitButton: 'button[type="submit"], input[type="submit"], #loginbtn',

    // First enroll button (matches various Moodle variations)
    initialEnrollButton: '#enrolusersbutton-1 input[type="submit"], input[value*="nrol"], button[data-action="enrol"]',

    // Search box
    searchUserInput: 'input[role="combobox"], input[placeholder*="Search"]',

    // Student search result
    studentSearchResult:
      '.form-autocomplete-suggestions li[role="option"]',

    // Final enroll button
    finalEnrollButton: 'button[data-action="save"]',

    // Success alert
    successMessage:
      '.alert-success'
  },

  // ==========================================
  // 3. TIMING & DELAYS (in milliseconds)
  // ==========================================
  // Adjust these if the website is slow to load
  delays: {
    pageLoadWait: 6000,     // Wait before starting automation on the enrollment page
    searchWait: 2000,       // Wait after typing the registration number for results to load
    actionWait: 1000        // General wait between clicks to simulate human behavior
  }
};
