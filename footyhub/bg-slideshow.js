function setupBgSlideshow() {
  const container = document.getElementById('bg-slideshow');
  if (!container) return;

  const league = getCurrentLeague();
  const images = LEAGUES[league].bgImages;

  container.innerHTML = images.map((url, i) =>
    `<div class="bg-slide${i === 0 ? ' active' : ''}" style="background-image:url('${url}')"></div>`
  ).join('');

  const slides = container.querySelectorAll('.bg-slide');
  if (slides.length === 0) return;

  let current = 0;
  setInterval(() => {
    slides[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
  }, 20000);
}

setupBgSlideshow();