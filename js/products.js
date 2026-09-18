(() => {
  'use strict';

  const BUCKET = 'product-images';
  const collectionMeta = {
    indian: {
      title: 'Indian Elegance',
      intro: 'Rooted in Indian tradition and shaped for individual expression. Explore half sarees, lehengas, anarkalis, traditional gowns and the details that make each piece feel distinctly VARNIYAM.'
    },
    gowns: {
      title: 'Modern Gowns',
      intro: 'Contemporary silhouettes with quiet confidence. Discover flowing gowns, sleeveless forms and statement shapes designed for a modern sense of occasion.'
    },
    everyday: {
      title: 'Everyday Feminine',
      intro: 'Easy pieces with character for the rhythm of real days. Explore short tops, peplums, mini dresses and relaxed outfits that still feel considered.'
    },
    getaway: {
      title: 'Getaway',
      intro: 'A wardrobe for slower mornings and open horizons. Resort pieces, vacation looks and breezy silhouettes made for movement, ease and escape.'
    },
    'after-hours': {
      title: 'After Hours',
      intro: 'Romantic, expressive and made for evenings that feel like you. Discover date-night dresses, evening silhouettes and pieces with a little more drama.'
    }
  };

  const currentCategory = document.body.dataset.collectionPage;
  if (!currentCategory || !collectionMeta[currentCategory]) return;

  const client = window.varniyamSupabase || null;
  const grid = document.getElementById('collection-grid');
  const status = document.getElementById('collection-status');
  const section = document.getElementById('collection-gallery');
  const dialog = document.getElementById('product-dialog');
  const dialogClose = document.getElementById('product-dialog-close');
  const dialogMain = document.getElementById('product-dialog-main');
  const dialogThumbs = document.getElementById('product-dialog-thumbs');
  const dialogCategory = document.getElementById('product-dialog-category');
  const dialogTitle = document.getElementById('product-dialog-title');
  const dialogPrice = document.getElementById('product-dialog-price');
  const dialogDescription = document.getElementById('product-dialog-description');
  const dialogEnquire = document.getElementById('product-dialog-enquire');
  if (!grid || !status || !section) return;

  let activeProducts = [];

  const escapeHTML = value => String(value ?? '').replace(/[&<>'"]/g, char => ({
    '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'
  })[char]);

  function formatPrice(product) {
    if (product.price === null || product.price === undefined || product.price === '') return '';
    const number = Number(product.price);
    if (!Number.isFinite(number)) return '';
    const currency = product.currency || 'INR';
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency', currency, maximumFractionDigits: Number.isInteger(number) ? 0 : 2
      }).format(number);
    } catch (_) {
      return `${currency} ${number.toLocaleString('en-IN')}`;
    }
  }

  function publicImage(path) {
    if (!path) return '';
    let value = String(path).trim();
    if (/^(https?:|data:|blob:)/i.test(value)) return value;
    value = value.replace(/^\/+/, '');
    if (value.startsWith(BUCKET + '/')) value = value.slice(BUCKET.length + 1);
    if (!client) return '';
    return client.storage.from(BUCKET).getPublicUrl(value).data.publicUrl || '';
  }

  function productImages(product) {
    return (Array.isArray(product.image_paths) ? product.image_paths : [])
      .map(publicImage)
      .filter(Boolean);
  }

  function setState(kind, heading, message) {
    grid.innerHTML = '';
    status.innerHTML = `
      <div class="collection-state">
        <div class="collection-state-inner">
          ${kind === 'loading' ? '<div class="collection-loader" aria-hidden="true"></div>' : '<div class="collection-state-mark" aria-hidden="true">V</div>'}
          <h3>${escapeHTML(heading)}</h3>
          <p>${escapeHTML(message)}</p>
        </div>
      </div>`;
  }

  function renderProducts(products) {
    status.innerHTML = '';
    activeProducts = products;
    if (!products.length) {
      setState('empty', 'This collection is being prepared.', 'Published VARNIYAM pieces will appear here automatically as they are added to the Supabase catalogue.');
      return;
    }

    grid.innerHTML = products.map((product, index) => {
      const images = productImages(product);
      const price = formatPrice(product);
      const imageMarkup = images[0]
        ? `<img src="${escapeHTML(images[0])}" alt="${escapeHTML(product.name || 'VARNIYAM piece')}" loading="lazy"/>`
        : '<div class="collection-placeholder">VARNIYAM</div>';
      return `
        <article class="collection-card">
          <button class="collection-card-media" type="button" data-product-index="${index}" aria-label="View ${escapeHTML(product.name || 'product')} details">
            ${imageMarkup}
            <span class="collection-card-number">${String(index + 1).padStart(2,'0')}</span>
          </button>
          <div class="collection-card-copy">
            <div class="collection-card-top">
              <h3>${escapeHTML(product.name || 'Untitled piece')}</h3>
              ${price ? `<div class="collection-card-price">${escapeHTML(price)}</div>` : ''}
            </div>
            <p class="collection-card-description">${escapeHTML(product.description || 'A VARNIYAM piece from this collection.')}</p>
            <div class="collection-card-actions">
              <button class="text-link" type="button" data-product-index="${index}">View piece <span aria-hidden="true">↗</span></button>
            </div>
          </div>
        </article>`;
    }).join('');
  }

  function openProduct(product) {
    if (!product || !dialog) return;
    const images = productImages(product);
    const price = formatPrice(product);
    const meta = collectionMeta[currentCategory];

    dialogCategory.textContent = meta.title;
    dialogTitle.textContent = product.name || 'VARNIYAM piece';
    dialogPrice.textContent = price;
    dialogPrice.hidden = !price;
    dialogDescription.textContent = product.description || 'A VARNIYAM piece from this collection.';
    dialogEnquire.href = 'index.html#contact';
    dialogEnquire.dataset.productName = product.name || '';

    if (images.length) {
      dialogMain.innerHTML = `<img src="${escapeHTML(images[0])}" alt="${escapeHTML(product.name || 'VARNIYAM piece')}"/>`;
      dialogThumbs.innerHTML = images.map((src, i) => `<button type="button" class="product-dialog-thumb" data-dialog-image="${i}" aria-pressed="${i === 0}"><img src="${escapeHTML(src)}" alt="${escapeHTML(product.name || 'VARNIYAM piece')} image ${i + 1}"/></button>`).join('');
      dialogThumbs.hidden = images.length < 2;
    } else {
      dialogMain.innerHTML = '<div class="collection-placeholder">VARNIYAM</div>';
      dialogThumbs.innerHTML = '';
      dialogThumbs.hidden = true;
    }
    dialog.dataset.images = JSON.stringify(images);

    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open','');
  }

  async function loadCollection() {
    section.setAttribute('aria-busy','true');
    if (!client) {
      section.removeAttribute('aria-busy');
      setState('error', 'Catalogue connection unavailable.', 'The collection could not connect to Supabase. Please check your internet connection and try again.');
      return;
    }

    const meta = collectionMeta[currentCategory];
    setState('loading', 'Opening the collection…', 'Loading published VARNIYAM pieces.');
    const aliases = [currentCategory, meta.title];
    const { data, error } = await client
      .from('products')
      .select('id,name,category,description,price,currency,image_paths,published,sort_order,created_at')
      .eq('published', true)
      .in('category', aliases)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    section.removeAttribute('aria-busy');
    if (error) {
      console.error('VARNIYAM collection load error:', error);
      setState('error', 'We couldn’t open this collection.', 'Please try again in a moment. The rest of the VARNIYAM website is still available.');
      return;
    }

    renderProducts(Array.isArray(data) ? data : []);
  }

  grid.addEventListener('click', event => {
    const button = event.target.closest('[data-product-index]');
    if (!button) return;
    openProduct(activeProducts[Number(button.dataset.productIndex)]);
  });

  dialogThumbs?.addEventListener('click', event => {
    const button = event.target.closest('[data-dialog-image]');
    if (!button) return;
    let images = [];
    try { images = JSON.parse(dialog.dataset.images || '[]'); } catch (_) {}
    const index = Number(button.dataset.dialogImage);
    if (!images[index]) return;
    const image = dialogMain.querySelector('img');
    if (image) image.src = images[index];
    dialogThumbs.querySelectorAll('[data-dialog-image]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  });

  dialogClose?.addEventListener('click', () => dialog.close());
  dialog?.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  dialogEnquire?.addEventListener('click', () => {
    if (dialog.open) dialog.close();
  });

  loadCollection();
})();
