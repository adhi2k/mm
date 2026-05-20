// config.js
// Centralized configuration for selectors, URLs, and mapping
module.exports = {
  urls: {
    login: 'http://training.saveetha.in/login/index.php',
    baseCourseUrl: 'http://training.saveetha.in/user/index.php?id=',
    webAppUrl: 'https://script.google.com/macros/s/AKfycbxQLmOYSaaNaMxqA68rddM6JfEc3rYU3xPSYIVHw_jIGC0QeJv4QWYwWeuS_i8q_fhb/exec'
  },
  selectors: {
    // Login
    username: 'input[name="username"], #username',
    password: 'input[name="password"], #password',
    loginBtn: 'button[type="submit"], input[type="submit"], #loginbtn',

    // Enrollment
    initialEnrollBtn: 'input[value="Enrol users"], #enrolusersbutton-1 input[type="submit"], button[data-action="enrol"]',
    searchInput: 'input[role="combobox"], input[placeholder*="Search"]',
    searchResultOption: '.form-autocomplete-suggestions li[role="option"]',
    finalEnrollBtn: 'button[data-action="save"]',
    successMessage: '.alert-success'
  },
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
  },
  delays: {
    pageLoad: 3000,
    searchWait: 2000,
    actionWait: 1000
  }
};
