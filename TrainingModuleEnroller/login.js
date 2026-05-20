// login.js - Injected if the extension detects the login page

(function() {
  const usernameInput = document.querySelector(CONFIG.selectors.loginUsernameInput);
  const passwordInput = document.querySelector(CONFIG.selectors.loginPasswordInput);
  const loginBtn = document.querySelector(CONFIG.selectors.loginSubmitButton);

  if (usernameInput && passwordInput && loginBtn) {
    console.log("Training Module Enroller: Auto-filling login credentials...");
    usernameInput.value = CONFIG.credentials.username;
    passwordInput.value = CONFIG.credentials.password;
    
    // Simulate events just in case
    usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
    passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Click the login button
    loginBtn.click();
  } else {
    console.error("Training Module Enroller: Login elements not found!");
  }
})();
