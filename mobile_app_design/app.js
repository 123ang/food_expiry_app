// Food Expiry App - Web Version

// --- Shopping List Interactions ---
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('shopping-input');
  const addBtn = document.getElementById('shopping-add-btn');
  const list = document.getElementById('shopping-items-list');

  if (!input || !addBtn || !list) return; // shopping list not on this screen

  const addItem = () => {
    const text = input.value.trim();
    if (!text) return;
    const li = document.createElement('li');
    li.className = 'shopping-item card-base';
    li.style.display = 'flex';
    li.style.alignItems = 'center';
    li.style.padding = '12px';
    li.innerHTML = `<label style="display:flex; align-items:center; gap:8px; width:100%; cursor:pointer;">
        <input type="checkbox" class="item-check" style="width:18px; height:18px;" />
        <span class="item-text" style="flex:1;">${text}</span>
      </label>`;
    list.prepend(li);
    input.value = '';
  };

  addBtn.addEventListener('click', addItem);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addItem();
    }
  });

  list.addEventListener('change', (e) => {
    if (e.target.classList.contains('item-check')) {
      const span = e.target.nextElementSibling;
      if (e.target.checked) {
        span.style.textDecoration = 'line-through';
        span.style.color = 'var(--text-secondary, #888)';
      } else {
        span.style.textDecoration = '';
        span.style.color = '';
      }
    }
  });

  /* Wishlist modal & list */
  const fab = document.getElementById('wishlist-fab');
  const modal = document.getElementById('wishlist-modal');
  const modalClose = modal ? modal.querySelector('.modal-close') : null;
  const modalCancel = modal ? modal.querySelector('.modal-btn.cancel') : null;
  const saveBtn = document.getElementById('wishlist-save-btn');
  const wishlistInput = document.getElementById('wishlist-item-name');
  const wishlistList = document.getElementById('wishlist-items-list');

  const openModal = () => { if(modal){ modal.style.display='flex'; wishlistInput.value=''; wishlistInput.focus(); } };
  const closeModal = () => { if(modal){ modal.style.display='none'; } };

  fab && fab.addEventListener('click', openModal);
  modalClose && modalClose.addEventListener('click', closeModal);
  modalCancel && modalCancel.addEventListener('click', closeModal);

  const addWishlistItem = () => {
    const text = wishlistInput.value.trim();
    if(!text) return;
    const li = document.createElement('li');
    li.className = 'wishlist-item card-base';
    li.style.padding = '12px';
    li.textContent = text;
    wishlistList.prepend(li);
    closeModal();
  };

  saveBtn && saveBtn.addEventListener('click', addWishlistItem);
  wishlistInput && wishlistInput.addEventListener('keypress', (e)=>{ if(e.key==='Enter'){ addWishlistItem(); }});
});
