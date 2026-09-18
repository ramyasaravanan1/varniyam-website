(() => {
  const form = document.getElementById('review-form');
  if (!form) return;
  const REVIEW_BUCKET = 'review-images';
  const MAX_IMAGES = 10;
  const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
  const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

  const photoInput = document.getElementById('review-photos');
  const previewGrid = document.getElementById('review-preview-grid');
  const photoCount = document.getElementById('review-photo-count');
  const message = document.getElementById('review-message');
  const messageCount = document.getElementById('review-message-count');
  const status = document.getElementById('review-status');
  const wall = document.getElementById('review-wall');
  const empty = document.getElementById('review-empty');
  const pagination = document.getElementById('review-pagination');
  const prevPageButton = document.getElementById('review-prev');
  const nextPageButton = document.getElementById('review-next');
  const pageIndicator = document.getElementById('review-page-indicator');
  const wallHeading = document.querySelector('.review-wall-heading');
  const submit = form.querySelector('button[type="submit"]');
  const REVIEWS_PER_PAGE = 6;
  let currentReviewPage = 1;
  let totalReviewPages = 1;
  let chosen = [];
  const client = window.varniyamSupabase || null;

  const lightbox = document.createElement('div');
  lightbox.className = 'review-lightbox';
  lightbox.hidden = true;
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-modal', 'true');
  lightbox.setAttribute('aria-label', 'Review photo');
  lightbox.innerHTML = '<button type="button" aria-label="Close image">×</button><img alt="Review photo"/>';
  document.body.appendChild(lightbox);
  const lightboxImg = lightbox.querySelector('img');
  const lightboxClose = lightbox.querySelector('button');
  const closeLightbox = () => {
    lightbox.hidden = true;
    lightboxImg.removeAttribute('src');
  };
  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', event => {
    if (event.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !lightbox.hidden) closeLightbox();
  });

  function makeId() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
  }

  function setStatus(text, isError = false) {
    status.textContent = text;
    status.style.color = isError ? '#8F4938' : '';
  }

  function revokeChosen() {
    chosen.forEach(item => URL.revokeObjectURL(item.url));
  }

  function updatePreview() {
    previewGrid.replaceChildren();
    chosen.forEach((item, index) => {
      const box = document.createElement('div');
      box.className = 'review-preview';
      const img = document.createElement('img');
      img.src = item.url;
      img.alt = `Selected review photo ${index + 1}`;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.setAttribute('aria-label', `Remove photo ${index + 1}`);
      remove.textContent = '×';
      remove.addEventListener('click', () => {
        URL.revokeObjectURL(chosen[index].url);
        chosen.splice(index, 1);
        updatePreview();
      });
      box.append(img, remove);
      previewGrid.appendChild(box);
    });
    photoCount.textContent = `${chosen.length} / ${MAX_IMAGES}`;
  }

  photoInput.addEventListener('change', () => {
    const incoming = [...photoInput.files];
    const accepted = [];
    const problems = [];

    incoming.forEach(file => {
      if (!ALLOWED_TYPES.has(file.type)) {
        problems.push(`${file.name}: use JPG, PNG or WEBP`);
      } else if (file.size > MAX_SOURCE_BYTES) {
        problems.push(`${file.name}: file is too large`);
      } else {
        accepted.push(file);
      }
    });

    const space = MAX_IMAGES - chosen.length;
    if (accepted.length > space) {
      problems.push(`Only ${MAX_IMAGES} photos can be added to one review`);
    }

    accepted.slice(0, space).forEach(file => {
      chosen.push({ file, url: URL.createObjectURL(file) });
    });
    photoInput.value = '';
    updatePreview();
    setStatus(problems.length ? problems[0] : '', problems.length > 0);
  });

  message.addEventListener('input', () => {
    messageCount.textContent = `${message.value.length} / 1600`;
  });

  function optimizeImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Could not read the image.'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Could not decode the image.'));
        img.onload = () => {
          const maxDimension = 1800;
          const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight));
          const width = Math.max(1, Math.round(img.naturalWidth * scale));
          const height = Math.max(1, Math.round(img.naturalHeight * scale));
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext('2d');
          if (!context) {
            reject(new Error('Image processing is unavailable.'));
            return;
          }
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, width, height);
          context.drawImage(img, 0, 0, width, height);
          canvas.toBlob(blob => {
            if (!blob) {
              reject(new Error('Could not prepare the image.'));
              return;
            }
            resolve(blob);
          }, 'image/jpeg', 0.82);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function publicImageUrl(path) {
    return client.storage.from(REVIEW_BUCKET).getPublicUrl(path).data.publicUrl;
  }

  function renderReview(review, prepend = false) {
    const card = document.createElement('article');
    card.className = 'review-card';

    const head = document.createElement('div');
    head.className = 'review-card-head';
    const name = document.createElement('div');
    name.className = 'review-card-name';
    name.textContent = review.name;
    const date = document.createElement('time');
    date.className = 'review-card-date';
    const createdAt = new Date(review.created_at);
    date.dateTime = createdAt.toISOString();
    date.textContent = new Intl.DateTimeFormat(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(createdAt);
    head.append(name, date);

    const body = document.createElement('p');
    body.className = 'review-card-message';
    body.textContent = review.message;
    card.append(head, body);

    const photos = (review.image_paths || []).map(publicImageUrl);
    if (photos.length) {
      const gallery = document.createElement('div');
      gallery.className = 'review-card-gallery';
      photos.forEach((src, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('aria-label', `Open ${review.name}'s photo ${index + 1}`);
        const img = document.createElement('img');
        img.loading = 'lazy';
        img.src = src;
        img.alt = `${review.name}'s VARNIYAM photo ${index + 1}`;
        button.appendChild(img);
        button.addEventListener('click', () => {
          lightboxImg.src = src;
          lightbox.hidden = false;
          lightboxClose.focus();
        });
        gallery.appendChild(button);
      });
      card.appendChild(gallery);
      if (photos.length > 6) {
        const more = document.createElement('span');
        more.className = 'review-gallery-more';
        more.textContent = `+${photos.length - 6} more photo${photos.length - 6 === 1 ? '' : 's'}`;
        card.appendChild(more);
      }
    }

    wall.appendChild(card);
    empty.hidden = true;
  }

  function updateReviewPagination(totalReviews) {
    totalReviewPages = Math.max(1, Math.ceil(totalReviews / REVIEWS_PER_PAGE));
    currentReviewPage = Math.min(currentReviewPage, totalReviewPages);

    pageIndicator.textContent = `Page ${currentReviewPage} of ${totalReviewPages}`;
    prevPageButton.disabled = currentReviewPage <= 1;
    nextPageButton.disabled = currentReviewPage >= totalReviewPages;
    pagination.hidden = totalReviews <= REVIEWS_PER_PAGE;
  }

  async function loadReviews(page = 1, scrollToWall = false) {
    if (!client) {
      empty.querySelector('p').textContent = 'Reviews are temporarily unavailable.';
      setStatus('The online review service could not load. Please refresh and try again.', true);
      submit.disabled = true;
      pagination.hidden = true;
      return;
    }

    currentReviewPage = Math.max(1, page);
    const from = (currentReviewPage - 1) * REVIEWS_PER_PAGE;
    const to = from + REVIEWS_PER_PAGE - 1;

    empty.querySelector('p').textContent = 'Loading community reviews…';
    empty.hidden = false;
    pagination.hidden = true;
    prevPageButton.disabled = true;
    nextPageButton.disabled = true;

    const { data, error, count } = await client
      .from('reviews')
      .select('id,name,message,image_paths,created_at', { count: 'exact' })
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Could not load reviews:', error);
      empty.querySelector('p').textContent = 'Community reviews could not be loaded right now.';
      pagination.hidden = true;
      return;
    }

    const totalReviews = count || 0;
    const availablePages = Math.max(1, Math.ceil(totalReviews / REVIEWS_PER_PAGE));
    if (totalReviews && currentReviewPage > availablePages) {
      currentReviewPage = availablePages;
      return loadReviews(currentReviewPage, scrollToWall);
    }

    wall.replaceChildren();
    (data || []).forEach(renderReview);

    if (!totalReviews) {
      empty.querySelector('p').textContent = 'No approved reviews yet. Be the first to share your VARNIYAM moment.';
      empty.hidden = false;
      pagination.hidden = true;
    } else {
      empty.hidden = true;
      updateReviewPagination(totalReviews);
    }

    if (scrollToWall && wallHeading) {
      wallHeading.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  prevPageButton.addEventListener('click', () => {
    if (currentReviewPage > 1) loadReviews(currentReviewPage - 1, true);
  });

  nextPageButton.addEventListener('click', () => {
    if (currentReviewPage < totalReviewPages) loadReviews(currentReviewPage + 1, true);
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();

    if (!client) {
      setStatus('The online review service is unavailable. Please refresh and try again.', true);
      return;
    }

    const { data: authData, error: authError } = await client.auth.getUser();
    const user = authData?.user;
    if (authError || !user) {
      setStatus('Please sign in to your VARNIYAM account before submitting a review.', true);
      window.dispatchEvent(new CustomEvent('varniyam:open-auth', { detail: 'signin' }));
      return;
    }

    const nameInput = document.getElementById('review-name');
    const cleanName = nameInput.value.trim();
    const cleanMessage = message.value.trim();

    if (cleanName.length < 2 || !cleanMessage) {
      setStatus('Please add your name and review before submitting.', true);
      (cleanName.length < 2 ? nameInput : message).focus();
      return;
    }
    if (chosen.length > MAX_IMAGES) {
      setStatus(`Please keep the review to ${MAX_IMAGES} images or fewer.`, true);
      return;
    }

    submit.disabled = true;
    submit.textContent = 'Submitting…';
    setStatus(chosen.length ? 'Preparing your photos…' : 'Saving your review…');

    const reviewId = makeId();
    const imagePaths = [];

    try {
      for (let index = 0; index < chosen.length; index += 1) {
        setStatus(`Uploading photo ${index + 1} of ${chosen.length}…`);
        const imageBlob = await optimizeImage(chosen[index].file);
        const imagePath = `reviews/${user.id}/${reviewId}/${String(index + 1).padStart(2, '0')}-${makeId()}.jpg`;
        const { error: uploadError } = await client.storage
          .from(REVIEW_BUCKET)
          .upload(imagePath, imageBlob, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: false
          });
        if (uploadError) throw uploadError;
        imagePaths.push(imagePath);
      }

      setStatus('Saving your review…');
      const { error: insertError } = await client
        .from('reviews')
        .insert({
          id: reviewId,
          name: cleanName,
          message: cleanMessage,
          image_paths: imagePaths,
          user_id: user.id,
          approved: false
        });
      if (insertError) throw insertError;

      revokeChosen();
      chosen = [];
      form.reset();
      updatePreview();
      messageCount.textContent = '0 / 1600';
      setStatus('Thank you — your review was saved and is waiting for VARNIYAM approval.');
    } catch (error) {
      console.error('Review submission failed:', error);
      const detail = error?.message ? ` (${error.message})` : '';
      setStatus(`We could not submit your review${detail}. Please try again.`, true);
    } finally {
      submit.disabled = false;
      submit.innerHTML = 'Submit review <span aria-hidden="true">↗</span>';
    }
  });

  loadReviews();
})();
