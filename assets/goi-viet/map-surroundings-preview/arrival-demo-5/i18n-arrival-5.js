/* VI/EN labels for the preview-5 arrival flow. */
(() => {
  'use strict';
  const I = window.GoiVietI18n;
  const labels = {
    title: ['Gói Việt — Demo đến ga', 'Gói Việt — Arrival demo'],
    list: ['Danh sách ga', 'Station list'],
    closeList: ['Đóng danh sách', 'Close list'],
    hint: ['Chọn một ga trên bản đồ, hoặc bắt đầu với:', 'Choose a station on the map, or start with:'],
    explore: ['Khám phá', 'Explore'],
    running: ['Đang chạy…', 'Travelling…'],
    moving: ['Đang trên hành trình', 'On the journey'],
    ready: ['Sẵn sàng khởi hành', 'Ready to depart'],
    at: ['Đang ở ga {place}', 'At {place} station'],
    atIsland: ['Đang ở {place}', 'At the {place} Islands'],
    islandName: ['Quần đảo {place}', '{place}'],
    reachedIslands: ['Đã ra tới quần đảo', 'Reached the islands'],
    chooseNext: ['Chọn ga tiếp theo', 'Choose next station'],
    islands: ['Biển đảo', 'Islands'],
    postOffice: ['Bưu điện biển đảo', 'Sea post office'],
    islandChart: ['Xem hải đồ', 'View island chart'],
    stampTitle: ['Ga thứ {n}', 'Family stop {n}'],
    stampSub: ['cả nhà đặt chân', ''],
    unsealed: ['Chưa đóng ấn · chơi một lá để đóng ấn', 'No station seal yet · finish a card to earn it'],
    sealed: ['Đã đóng ấn ga', 'Station seal earned'],
    sealedCount: ['Đã đóng ấn {n}', 'Station seals earned: {n}'],
    sealHint: ['Chơi xong lá bài tại ga để đóng ấn', 'Finish a card at a station to earn its seal'],
    soonShare: ['Sắp có · Góp chuyện quê bạn', 'Coming soon · Share your story'],
    turnReady: ['Đến lượt {player} — tàu sẵn sàng tới {place}. Bấm Khám phá hoặc chọn ga khác.', '{player}’s turn — the train is ready for {place}. Press Explore or choose another station.'],
    eta: ['Khoảng {seconds} giây', 'About {seconds} seconds'],
    next: ['Ga tiếp theo: {place}', 'Next station: {place}'],
    passing: ['Đang qua {place}…', 'Passing through {place}…'],
    instant: ['Đến ngay', 'Arrive now'],
    reopen: ['Mở thông tin ga', 'Open station info'],
    close: ['Đóng thông tin ga', 'Close station info'],
    chooseOther: ['Chọn ga khác', 'Choose another station'],
    turn: ['Đã đến ga · Lượt của {player}', 'Arrived · {player}’s turn'],
    sheetArrival: ['Đã đến ga', 'Arrived'],
    sheetTurn: ['Lượt của {player}', '{player}’s turn'],
    sheetTicket: ['Vé đến ga', 'Arrival ticket'],
    sheetPhoto: ['Nguồn ảnh', 'Photo credits'],
    sheetModes: ['Chọn cách khám phá tại ga', 'Choose how to explore this station'],
    stationKicker: ['Một miền di sản', 'A place of heritage'],
    landed: ['Ga thứ {n} cả nhà đặt chân', 'Family stop number {n}'],
    visited: ['Đã đặt chân {n}/36', 'Visited {n}/36 stations'],
    visitedBadge: ['Đã đặt chân', 'Visited'],
    ticketCards: ['Lên tàu tới ga {place} →', 'Board the train to {place} →'],
    ticketBook: ['Lên tàu, đến nơi đọc sách →', 'Board the train, read on arrival →'],
    bar: ['Hành trình đến ga', 'Station journey'],
    progress: ['Tiến độ hành trình', 'Journey progress'],
    'sr.select': ['Đã chọn ga {place}. Bấm Khám phá để tới ga.', '{place} selected. Press Explore to reach the station.'],
    'sr.selectMoving': ['Ga tiếp theo: {place}. Tàu vẫn đang tới {dest}.', 'Next station: {place}. Still travelling to {dest}.'],
    'sr.depart': ['Khởi hành từ {from} đến {to}.', 'Departing from {from} to {to}.'],
    'sr.arrive': ['Đã đến ga {place}. Đã mở thông tin ga.', 'Arrived at {place}. Station info is open.'],
    'sr.open': ['Đã mở thông tin ga {place}.', 'Station info for {place} is open.'],
    'sr.close': ['Đã đóng thông tin ga. Có thể mở lại trên thanh hành trình.', 'Station info closed. Reopen it from the journey bar.']
  };
  const dict = { vi: {}, en: {} };
  for (const [key, [vi, en]] of Object.entries(labels)) {
    dict.vi['arrival.' + key] = vi;
    dict.en['arrival.' + key] = en;
  }
  I.add(dict);
})();
