import Notiflix, { Notify } from 'notiflix';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

const gallerylightbox = new SimpleLightbox('.gallery a', {
  captionsData: 'alt',
  captionPosition: 'bottom',
  captionDelay: 250,
});

const gallery = document.querySelector('.gallery');
const form = document.querySelector('form');
const guard = document.querySelector('.guard');
const magic = document.querySelector('.super-button');
form.addEventListener('submit', onSubmit);
magic.addEventListener('click', onClick);

const options = {
  root: null,
  rootMargin: '150px',
  threshold: 1.0,
};

const observer = new IntersectionObserver(onLoad, options);

let page = 1;
let searchQuery = null;

function onClick(e) {
  console.log(e.currentTarget);
}

async function onSubmit(e) {
  e.preventDefault();

  searchQuery = e.currentTarget.elements.query.value;
  console.log(searchQuery);

  if (!searchQuery) {
    resetMarkup();
    return;
  }

  e.currentTarget.reset();

  const apiR = await api(searchQuery)
    .then(images => {
      resetMarkup();
      page = 1;
      if (images.totalHits > 0) {
        Notify.success(`Hooray! We found ${images.totalHits} images.`);
      }
      if (images.totalHits === 0) {
        Notify.failure(
          'Sorry, there are no images matching your search query. Please try again.'
        );
        return;
      }
      console.log(images);
      createMarkup(images);
      observer.observe(guard);
      return;
    })
    .catch(error => console.log(error));
}

async function onLoad(entries) {
  const add = await entries.forEach(entry => {
    if (entry.isIntersecting) {
      page += 1;
      api(searchQuery, page).then(images => {
        if (page >= 2) {
          magic.classList.remove('is-hidden');
        }
        console.log('This is images.hits', images.hits);
        console.log(page);
        createMarkup(images);
        observer.unobserve(guard);
        if (images.hits.length === 0) {
          Notify.info(
            "We're sorry, but you've reached the end of search results."
          );
          return;
        }
        return;
      });
    }
  });
}

function createMarkup(images) {
  const markup = images.hits
    .map(image => {
      const {
        webformatURL,
        largeImageURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      } = image;
      return `<div class="photo-card">
 <a class="gallery__link" href="${largeImageURL}">
  <img class="gallery__image" src="${webformatURL}" alt="${tags}" loading="lazy" />
  <div class="info">
    <p class="info-item">
      <b>Likes</b>
      <span>${likes}</span>
    </p>
    <p class="info-item">
      <b>Views</b>
      <span>${views}</span>
    </p>
    <p class="info-item">
      <b>Comments</b>
      <span>${comments}</span>
    </p>
    <p class="info-item">
      <b>Downloads</b>
      <span>${downloads}</span>
    </p>
  </div>
  </a>
</div>`;
    })
    .join('');
  gallery.insertAdjacentHTML('beforeend', markup);

  gallerylightbox.refresh();
}

function resetMarkup() {
  gallery.innerHTML = '';
}

async function api(searchQuery, page) {
  const rest = await fetch(
    `https://pixabay.com/api/?key=30691958-6af913c4f83636a6243d9d3b7&q=${searchQuery}&image_type=photo&orientation=horizontal&safesearch=true&page=${page}&per_page=40`
  );
  const dataRest = await rest.json();
  return dataRest;
}
