const logout = document.getElementById('logout');
const dialog = document.getElementById('logout-dialog');
const cancel = document.getElementById('cancel-logout');
const confirm = document.getElementById('confirm-logout');
const logoutError = document.getElementById('logout-error');

async function closeDialog() {
  if (dialog.classList.contains('is-closing')) return;
  dialog.classList.add('is-closing');
  await Promise.allSettled(dialog.getAnimations().map((animation) => animation.finished));
  dialog.close();
  dialog.classList.remove('is-closing');
}

logout.addEventListener('click', () => {
  logoutError.hidden = true;
  dialog.showModal();
});

cancel.addEventListener('click', () => closeDialog());
dialog.addEventListener('cancel', (event) => {
  event.preventDefault();
  if (!confirm.disabled) closeDialog();
});

confirm.addEventListener('click', async () => {
  if (dialog.classList.contains('is-closing')) return;
  confirm.disabled = true;
  cancel.disabled = true;
  logoutError.hidden = true;
  try {
    const response = await fetch('/api/logout', { method: 'POST' });
    if (!response.ok) throw new Error('Logout request failed');
    await closeDialog();
    location.replace('/#login');
  } catch {
    logoutError.textContent = 'Chưa thể đăng xuất. Vui lòng thử lại.';
    logoutError.hidden = false;
    confirm.disabled = false;
    cancel.disabled = false;
  }
});
