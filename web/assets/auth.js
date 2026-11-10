const byId = (id) => document.getElementById(id);
const loginForm = byId('login-form');
const registerForm = byId('register-form');
const passwordToggles = document.querySelectorAll('.password-toggle');
const registerButton = registerForm.querySelector('button[type="submit"]');
const authToast = byId('auth-toast');
let redirectTimer;
let toastTimer;
let toastCleanupTimer;

function setPasswordVisibility(button, visible) {
  const input = byId(button.getAttribute('aria-controls'));
  const field = input.id === 'confirm-password' ? 'mật khẩu nhập lại' : 'mật khẩu';
  const label = `${visible ? 'Ẩn' : 'Hiện'} ${field}`;
  input.type = visible ? 'text' : 'password';
  button.classList.toggle('is-visible', visible);
  button.setAttribute('aria-label', label);
  button.title = label;
}

for (const button of passwordToggles) {
  button.hidden = false;
  button.addEventListener('click', () => {
    const input = byId(button.getAttribute('aria-controls'));
    setPasswordVisibility(button, input.type === 'password');
  });
}

function notify(message = '', kind = 'info') {
  const notice = byId('notice');
  notice.textContent = message;
  notice.dataset.kind = kind;
  notice.hidden = !message;
}

function showToast(message, kind = 'success') {
  clearTimeout(toastTimer);
  clearTimeout(toastCleanupTimer);
  authToast.dataset.kind = kind;
  authToast.textContent = message;
  authToast.classList.add('is-visible');
  toastTimer = setTimeout(() => {
    authToast.classList.remove('is-visible');
    toastCleanupTimer = setTimeout(() => { authToast.textContent = ''; }, 240);
  }, 2500);
}

function showLoginResult(authenticated) {
  if (authenticated) showToast('Đăng nhập thành công');
  else showToast('Sai tài khoản hoặc mật khẩu', 'error');
}

function showScreen(focus = false) {
  clearTimeout(redirectTimer);
  registerButton.disabled = false;
  const registering = location.hash === '#register';
  const title = registering ? 'Đăng ký' : 'Đăng nhập';
  const heading = byId('screen-title');
  heading.textContent = title;
  document.title = `${title} · Âm Kho`;
  loginForm.hidden = registering;
  registerForm.hidden = !registering;
  byId('switch-text').textContent = registering ? 'Đã có tài khoản?' : 'Chưa có tài khoản?';
  byId('switch-link').textContent = registering ? 'Đăng nhập' : 'Đăng ký';
  byId('switch-link').href = registering ? '#login' : '#register';
  loginForm.reset();
  registerForm.reset();
  for (const button of passwordToggles) setPasswordVisibility(button, false);
  notify();
  if (focus) heading.focus();
}

function requireGmail(input) {
  try {
    if (!/^[^\s@]+@gmail\.com$/i.test(input.value.trim())) {
      throw new Error('Hãy nhập địa chỉ có đuôi @gmail.com.');
    }
    return true;
  } catch (error) {
    notify(error.message, 'error');
    input.focus();
    return false;
  }
}

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!requireGmail(byId('login-email'))) return;
  byId('login-password').value = '';
  setPasswordVisibility(loginForm.querySelector('.password-toggle'), false);
  notify();
  // The static preview has no credential check. Pass the authentication result here when connected.
  showLoginResult(true);
});

registerForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (registerButton.disabled) return;
  if (!requireGmail(byId('register-email'))) return;
  const password = byId('register-password');
  const confirmation = byId('confirm-password');
  const rules = [/\p{Ll}/u, /\p{Lu}/u, /\d/, /[\p{P}\p{S}]/u];
  if (!rules.every((rule) => rule.test(password.value))) {
    notify('Mật khẩu cần có chữ thường, chữ hoa, số và ký tự đặc biệt.', 'error');
    password.focus();
    return;
  }
  if (password.value !== confirmation.value) {
    notify('Hai mật khẩu chưa khớp.', 'error');
    confirmation.focus();
    return;
  }
  registerForm.reset();
  for (const button of registerForm.querySelectorAll('.password-toggle')) setPasswordVisibility(button, false);
  notify();
  registerButton.disabled = true;
  showToast('Tạo tài khoản thành công');
  redirectTimer = setTimeout(() => { location.hash = '#login'; }, 900);
});

window.addEventListener('hashchange', () => showScreen(true));
showScreen();
