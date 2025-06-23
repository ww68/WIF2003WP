async function guardedNavigate(e, url) {
  e.preventDefault();

  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      credentials: 'include',
      redirect: 'manual'
    });

    if (res.status === 200) {
      window.location.href = url;           // logged-in – proceed
      return;
    }
    if (res.status === 401 || res.status === 302) {
    const msg =
      url === '/watchlist'
        ? 'Please log in to view your watchlist.'
        : url === '/profile'
        ? 'Please log in to view your profile.'
        : 'Please log in first.';

      showAuthModal(msg);                   // pop modal
      return;
    }

    console.error('Unexpected status', res.status);
    showAuthModal('Something went wrong, please try again.');
  } catch (err) {
    console.error(err);
    showAuthModal('Network error – check your connection.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  [
    { selector: '#watchlist-link',  url: '/watchlist' },
    { selector: '#profile-link',    url: '/profile'  },
    { selector: '#profile-avatar',  url: '/profile'  }, // desktop avatar
    { selector: '#profile-mobile-link',    url: '/profile'  }
  ].forEach(item => {
    const el = document.querySelector(item.selector);
    if (el && !el.dataset.guardAttached) {          // guard once
      el.dataset.guardAttached = 'true';
      el.addEventListener('click', e => guardedNavigate(e, item.url));
    }
  });
});
