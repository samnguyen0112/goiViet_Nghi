/* Preview-5 copy of home-station-feedback-3.js (P5-03 slice 2): interface text follows the VI/EN choice (GoiVietI18n).
   Other pages keep home-station-feedback-3.js. */
// Selection feedback only; the invitation's two actions retain navigation ownership.
(() => {
  if (document.body.dataset.previewVersion !== '3') return;
  const stations = [...document.querySelectorAll('.gv-home-stations button')];
  const hint = document.getElementById('homeStationHint');
  if (!hint) return;
  for (const station of stations) {
    station.addEventListener('click', () => {
      for (const button of stations) button.setAttribute('aria-pressed', String(button === station));
      const place = station.querySelector('strong').textContent.trim();
      hint.textContent = window.GoiVietI18n ? window.GoiVietI18n.t('home.stationChosen', { place }) : `Ga đã chọn: ${place}`;
    });
  }
})();
