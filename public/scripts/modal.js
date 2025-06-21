function showAuthModal(message) {
  if (document.querySelector('.base-modal-backdrop')) return; // guard

  const backdrop = document.createElement('div');
  backdrop.className = 'base-modal-backdrop';
  backdrop.innerHTML = `
    <div class="base-modal-content">
      <div class="base-icon auth-blue">
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

function showConfirmModal(message, onConfirm) {
  console.log('showConfirmModal called:', message); 
  const backdrop = document.createElement('div');
  backdrop.className = 'base-modal-backdrop';     
  backdrop.innerHTML = `
    <div class="base-modal-content">
      <div class="base-icon remove-red">
        <i class="fa fa-trash-alt"></i>
      </div>
      <h3>Remove Movie</h3>
      <p>${message}</p>
      <div class="modal-buttons">
        <button id="confirm-ok" class="btn btn-danger">Remove</button>
        <button id="confirm-cancel" class="btn btn-secondary">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);

  backdrop.querySelector('#confirm-ok')
          .addEventListener('click', () => {
            backdrop.remove();
            onConfirm();                    
          });
  backdrop.querySelector('#confirm-cancel')
          .addEventListener('click', () => backdrop.remove());
}

window.showAuthModal = showAuthModal; // visible to all scripts
window.showConfirmModal = showConfirmModal;