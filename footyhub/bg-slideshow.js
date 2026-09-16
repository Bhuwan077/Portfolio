function setupBgSlideshow() {
  const container = document.getElementById('bg-slideshow');
  if (!container) return;

  const league = getCurrentLeague();
  document.body.setAttribute('data-league', league);
  const leagueData = LEAGUES[league];
  const images = (leagueData && leagueData.bgImages) ? leagueData.bgImages : [];

  const slidesHTML = images.map((url, i) =>
    `<div class="bg-slide${i === 0 ? ' active' : ''}" style="background-image:url('${url}')"></div>`
  ).join('');

  const auraHTML = `
    <div class="bg-aura-mesh" aria-hidden="true">
      <div class="aura-orb aura-orb-1"></div>
      <div class="aura-orb aura-orb-2"></div>
      <div class="aura-orb aura-orb-3"></div>
      <div class="floodlight-beam floodlight-left"></div>
      <div class="floodlight-beam floodlight-right"></div>
      <div class="league-watermark"></div>
    </div>
  `;

  container.innerHTML = slidesHTML + auraHTML;

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