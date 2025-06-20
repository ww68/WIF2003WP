function showAuthModal(message) {
  if (document.querySelector('.auth-modal-backdrop')) return; // guard

  const backdrop = document.createElement('div');
  backdrop.className = 'auth-modal-backdrop';
  backdrop.innerHTML = `
    <div class="auth-modal-content">
      <div class="auth-icon">
        <i class="fa fa-sign-in-alt"></i>
      </div>
      <h3>Authentication Required</h3>
      <p>${message}</p>
      <div class="modal-buttons">
        <a href="/login" class="btn btn-primary">Log In / Sign Up</a>
        <button id="modal-cancel" class="btn btn-secondary">Cancel</button>
      </div>
    </div>`;
  document.body.appendChild(backdrop);

  // Event listener for cancel button
  backdrop.querySelector('#modal-cancel')
          .addEventListener('click', () => backdrop.remove());
  
  // Event listener for backdrop click (close on outside click)
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      backdrop.remove();
    }
  });
}

window.showAuthModal = showAuthModal; // visible to all scripts