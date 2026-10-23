// Selection feedback only; the invitation's two actions retain navigation ownership.
(() => {
  if (document.body.dataset.previewVersion !== '3') return;
  const stations = [...document.querySelectorAll('.gv-home-stations button')];
  const hint = document.getElementById('homeStationHint');
  if (!hint) return;
  for (const station of stations) {
    station.addEventListener('click', () => {
      for (const button of stations) button.setAttribute('aria-pressed', String(button === station));
      hint.textContent = `Ga đã chọn: ${station.querySelector('strong').textContent.trim()}`;
    });
  }
})();
