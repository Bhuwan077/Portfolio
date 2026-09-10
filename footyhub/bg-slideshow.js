function setupBgSlideshow() {
  const slides = document.querySelectorAll('.bg-slide');
  if (slides.length === 0) return;

  let current = 0;

  setInterval(() => {
    slides[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
  }, 20000);
}

setupBgSlideshow();
