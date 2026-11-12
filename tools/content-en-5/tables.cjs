// P5-03 slice 3: English for preview-5's place and card content. Source of truth for the English: edit here, then run
//   node tools/build-content-en-5.cjs
// which rebuilds assets/goi-viet/map-surroundings-preview/content-en-5.js and fails when a Vietnamese text has no English.
// Choices (team, 11/11): place names keep their Vietnamese spelling with diacritics (no "Tỉnh"/"Thành phố"; Hồ Chí Minh
// City; Hoàng Sa (Paracel) / Trường Sa (Spratly) Islands); verses stay in Vietnamese with an English gloss line.
// Keys are the Vietnamese texts exactly as they appear in the data, so a later Vietnamese edit shows up as a missing
// translation instead of a stale one.

// Place names: id → [name, short].
exports.NAMES = {
  hn: ['Hà Nội', 'Hà Nội'], tq: ['Tuyên Quang', 'Tuyên Quang'], lc: ['Lào Cai', 'Lào Cai'], tn: ['Thái Nguyên', 'Thái Nguyên'],
  pt: ['Phú Thọ', 'Phú Thọ'], bn: ['Bắc Ninh', 'Bắc Ninh'], hy: ['Hưng Yên', 'Hưng Yên'], hp: ['Hải Phòng', 'Hải Phòng'],
  nb: ['Ninh Bình', 'Ninh Bình'], cb: ['Cao Bằng', 'Cao Bằng'], ls: ['Lạng Sơn', 'Lạng Sơn'], lc_old: ['Lai Châu', 'Lai Châu'],
  db: ['Điện Biên', 'Điện Biên'], sl: ['Sơn La', 'Sơn La'], qn: ['Quảng Ninh', 'Quảng Ninh'], th: ['Thanh Hóa', 'Thanh Hóa'],
  na: ['Nghệ An', 'Nghệ An'], ht: ['Hà Tĩnh', 'Hà Tĩnh'], qt: ['Quảng Trị', 'Quảng Trị'], hue: ['Huế', 'Huế'],
  dn: ['Đà Nẵng', 'Đà Nẵng'], qng: ['Quảng Ngãi', 'Quảng Ngãi'], gl: ['Gia Lai', 'Gia Lai'], dl: ['Đắk Lắk', 'Đắk Lắk'],
  kh: ['Khánh Hòa', 'Khánh Hòa'], ld: ['Lâm Đồng', 'Lâm Đồng'], hcm: ['Hồ Chí Minh City', 'Hồ Chí Minh City'],
  dna: ['Đồng Nai', 'Đồng Nai'], tni: ['Tây Ninh', 'Tây Ninh'], dt: ['Đồng Tháp', 'Đồng Tháp'], vl: ['Vĩnh Long', 'Vĩnh Long'],
  ct: ['Cần Thơ', 'Cần Thơ'], ag: ['An Giang', 'An Giang'], cm: ['Cà Mau', 'Cà Mau'],
  'hoang-sa': ['Hoàng Sa (Paracel) Islands', 'Hoàng Sa Islands'], 'truong-sa': ['Trường Sa (Spratly) Islands', 'Trường Sa Islands']
};

exports.REGIONS = {
  'Đồng bằng sông Hồng': 'Red River Delta',
  'Trung du & Miền núi phía Bắc': 'Northern Midlands & Mountains',
  'Bắc Trung Bộ & Duyên hải miền Trung': 'North Central & Central Coast',
  'Tây Nguyên': 'Central Highlands',
  'Đông Nam Bộ': 'Southeast',
  'Đồng bằng sông Cửu Long': 'Mekong Delta',
  'Biển Đông • Thành phố Đà Nẵng': 'Biển Đông (East Sea) • Đà Nẵng',
  'Biển Đông • Tỉnh Khánh Hòa': 'Biển Đông (East Sea) • Khánh Hòa'
};

// Station highlights (landmark, heritage, flavour) and photo titles.
exports.HIGHLIGHTS = {
  'Hồ Hoàn Kiếm': 'Hoàn Kiếm Lake',
  'Hoàng thành Thăng Long': 'Thăng Long Imperial Citadel',
  'Phở Hà Nội': 'Hà Nội phở',
  'Khu di tích lịch sử Tân Trào': 'Tân Trào Historic Site',
  'Hát Then Tày, Nùng, Thái': 'Then singing of the Tày, Nùng and Thái',
  'Cam sành Hàm Yên': 'Hàm Yên king oranges',
  'Đỉnh Fansipan': 'Fansipan Peak',
  'Ruộng bậc thang Sa Pa': 'Sa Pa rice terraces',
  'Thắng cố Bắc Hà': 'Bắc Hà thắng cố stew',
  'Hồ Núi Cốc': 'Núi Cốc Lake',
  'ATK Định Hóa Thái Nguyên': 'ATK Định Hóa resistance base',
  'Chè Tân Cương': 'Tân Cương tea',
  'Khu di tích lịch sử Đền Hùng': 'Hùng Temple Historic Site',
  'Tín ngưỡng thờ cúng Hùng Vương': 'Worship of the Hùng Kings',
  'Thịt chua Thanh Sơn': 'Thanh Sơn fermented pork',
  'Đền Đô': 'Đô Temple',
  'Dân ca Quan họ Bắc Ninh': 'Bắc Ninh Quan họ folk songs',
  'Bánh phu thê Đình Bảng': 'Đình Bảng phu thê wedding cakes',
  'Đô thị cổ Phố Hiến': 'Phố Hiến ancient town',
  'Khu di tích Phố Hiến': 'Phố Hiến relic site',
  'Nhãn lồng Hưng Yên': 'Hưng Yên longans',
  'Quần đảo Cát Bà': 'Cát Bà Archipelago',
  'Lễ hội chọi trâu Đồ Sơn': 'Đồ Sơn buffalo fighting festival',
  'Bánh đa cua Hải Phòng': 'Hải Phòng bánh đa cua crab noodle soup',
  'Quần thể danh thắng Tràng An': 'Tràng An Landscape Complex',
  'Di sản Thế giới Tràng An': 'Tràng An World Heritage Site',
  'Cơm cháy & Dê núi Ninh Bình': 'Ninh Bình crispy rice & mountain goat',
  'Thác Bản Giốc': 'Bản Giốc Waterfall',
  'Công viên Địa chất Toàn cầu': 'Global Geopark',
  'Bánh cuốn Cao Bằng': 'Cao Bằng rice rolls',
  'Đỉnh Mẫu Sơn': 'Mẫu Sơn Peak',
  'Công viên Địa chất Lạng Sơn': 'Lạng Sơn Geopark',
  'Vịt quay lá mắc mật': 'Roast duck with mắc mật leaves',
  'Cao nguyên Sìn Hồ': 'Sìn Hồ Plateau',
  'Lễ hội Nàng Han': 'Nàng Han Festival',
  'Lợn cắp nách Sìn Hồ': 'Sìn Hồ lợn cắp nách pork',
  'Đồi A1': 'Hill A1',
  'Chiến trường Điện Biên Phủ': 'Điện Biên Phủ battlefield',
  'Gạo Điện Biên': 'Điện Biên rice',
  'Cao nguyên Mộc Châu': 'Mộc Châu Plateau',
  'Nghệ thuật Xòe Thái': 'Thái xòe dance',
  'Sữa tươi & Chè Mộc Châu': 'Mộc Châu fresh milk & tea',
  'Vịnh Hạ Long': 'Hạ Long Bay',
  'Di sản thiên nhiên Vịnh Hạ Long': 'Hạ Long Bay natural heritage',
  'Chả mực Hạ Long': 'Hạ Long squid cakes',
  'Thành nhà Hồ': 'Citadel of the Hồ Dynasty',
  'Trò Xuân Phả': 'Xuân Phả folk plays',
  'Nem chua Thanh Hóa': 'Thanh Hóa nem chua fermented pork',
  'Làng Sen & Làng Hoàng Trù': 'Sen Village & Hoàng Trù Village',
  'Dân ca Ví, Giặm Nghệ Tĩnh': 'Ví and Giặm folk songs of Nghệ Tĩnh',
  'Cháo lươn Nghệ An': 'Nghệ An eel porridge',
  'Ngã ba Đồng Lộc': 'Đồng Lộc Junction',
  'Kẹo cu đơ Hà Tĩnh': 'Hà Tĩnh cu đơ peanut candy',
  'Phong Nha – Kẻ Bàng': 'Phong Nha – Kẻ Bàng',
  'Vườn Quốc gia Phong Nha – Kẻ Bàng': 'Phong Nha – Kẻ Bàng National Park',
  'Cháo canh miền Trung': 'Central Vietnam cháo canh noodle soup',
  'Đại Nội Huế & Ngọ Môn': 'Huế Imperial City & Ngọ Môn Gate',
  'Quần thể Di tích Cố đô Huế': 'Complex of Huế Monuments',
  'Bún bò Huế & Chè Huế': 'Huế beef noodle soup & Huế sweet soups',
  'Ngũ Hành Sơn & Cầu Rồng': 'Ngũ Hành Sơn (Marble Mountains) & Dragon Bridge',
  'Danh thắng Ngũ Hành Sơn': 'Ngũ Hành Sơn (Marble Mountains) scenic site',
  'Mì Quảng': 'Mì Quảng noodles',
  'Đảo Lý Sơn': 'Lý Sơn Island',
  'Văn hóa Sa Huỳnh': 'Sa Huỳnh culture',
  'Tỏi cô đơn Lý Sơn': 'Lý Sơn single-clove garlic',
  'Biển Hồ Pleiku': 'Pleiku’s Biển Hồ Lake',
  'Không gian Văn hóa Cồng chiêng Tây Nguyên': 'Space of Gong Culture in the Central Highlands',
  'Phở khô Gia Lai': 'Gia Lai dry phở',
  'Hồ Lắk & Thác Dray Nur': 'Lắk Lake & Dray Nur Waterfall',
  'Cà phê Buôn Ma Thuột': 'Buôn Ma Thuột coffee',
  'Vịnh Nha Trang': 'Nha Trang Bay',
  'Tháp Bà Ponagar': 'Po Nagar Cham Towers',
  'Yến sào Khánh Hòa': 'Khánh Hòa bird’s nest',
  'Hồ Xuân Hương Đà Lạt': 'Xuân Hương Lake, Đà Lạt',
  'Rau hoa & Trà Atisô Đà Lạt': 'Đà Lạt vegetables, flowers & artichoke tea',
  'Dinh Độc Lập & Chợ Bến Thành': 'Independence Palace & Bến Thành Market',
  'Đờn ca tài tử Nam Bộ': 'Đờn ca tài tử music of Southern Vietnam',
  'Cơm tấm Sài Gòn': 'Sài Gòn cơm tấm broken rice',
  'Vườn Quốc gia Cát Tiên': 'Cát Tiên National Park',
  'Văn miếu Trấn Biên': 'Trấn Biên Temple of Literature',
  'Bưởi Tân Triều': 'Tân Triều pomelos',
  'Núi Bà Đen': 'Bà Đen Mountain',
  'Nghệ thuật Đờn ca tài tử & Múa trống Chhay-dăm': 'Đờn ca tài tử music & Chhay-dăm drum dance',
  'Bánh tráng phơi sương Trảng Bàng': 'Trảng Bàng dew-dried rice paper',
  'Vườn Quốc gia Tràm Chim': 'Tràm Chim National Park',
  'Khu di tích Gò Tháp': 'Gò Tháp relic site',
  'Hủ tiếu Sa Đéc': 'Sa Đéc hủ tiếu noodle soup',
  'Cù lao An Bình': 'An Bình Islet',
  'Văn Thánh Miếu Vĩnh Long': 'Vĩnh Long Temple of Literature (Văn Thánh Miếu)',
  'Bưởi Năm Roi Bình Minh': 'Bình Minh Năm Roi pomelos',
  'Bến Ninh Kiều': 'Ninh Kiều Wharf',
  'Văn hóa Chợ nổi Cái Răng': 'Cái Răng floating market culture',
  'Bánh cống Cần Thơ': 'Cần Thơ bánh cống fritters',
  'Miếu Bà Chúa Xứ Núi Sam': 'Bà Chúa Xứ Temple on Sam Mountain',
  'Lễ hội Vía Bà Chúa Xứ': 'Vía Bà Chúa Xứ Festival',
  'Bún cá Long Xuyên': 'Long Xuyên fish noodle soup',
  'Mũi Cà Mau': 'Cà Mau Cape',
  'Khu dự trữ sinh quyển Thế giới Mũi Cà Mau': 'Cà Mau Cape World Biosphere Reserve',
  'Cua biển Cà Mau': 'Cà Mau mud crabs',
  'Đảo Phú Lâm & Cụm đảo Hoàng Sa': 'Phú Lâm Island & the Hoàng Sa island cluster',
  'Lễ Khao lề thế lính Hoàng Sa': 'Khao lề thế lính Hoàng Sa ceremony for the Hoàng Sa soldiers',
  'Bánh chưng lá bàng vuông': 'Bánh chưng wrapped in bàng vuông leaves',
  'Đảo Trường Sa Lớn & Cụm đảo Song Tử': 'Trường Sa Lớn Island & the Song Tử cluster',
  'Cột mốc chủ quyền Quần đảo Trường Sa': 'Trường Sa Islands sovereignty marker',
  // Photo titles that are not highlights.
  // Na Hang remains in the preview geography/cultural data, so keep its translation.
  'Khu bảo tồn thiên nhiên Na Hang': 'Na Hang Nature Reserve',
  'Chùa Bút Tháp': 'Bút Tháp Pagoda',
  'Vịnh Lan Hạ': 'Lan Hạ Bay',
  'Tượng đài Chiến thắng Điện Biên Phủ': 'Điện Biên Phủ Victory Monument',
  'Ngọ Môn – Đại Nội Huế': 'Meridian Gate – Huế Imperial City',
  'Cầu Vàng – Bà Nà': 'Golden Bridge – Bà Nà Hills',
  'Thác Dray Nur': 'Dray Nur waterfall',
  'Hồ Xuân Hương – Đà Lạt': 'Xuân Hương Lake – Đà Lạt',
  'Vương quốc gạch gốm đỏ Mang Thít': 'Mang Thít, kingdom of red brick and pottery',
  // Reviewed local station-photo titles; English matches each photoTitleEn.
  'Tháp Rùa – Hồ Hoàn Kiếm': 'Turtle Tower, Hoàn Kiếm Lake',
  'Đèo Mã Pí Lèng trong mây': 'Mã Pí Lèng Pass in the clouds',
  'Cột mốc đỉnh Fansipan': 'Fansipan summit marker',
  'Đền Hạ – Khu di tích Đền Hùng': 'Lower Temple, Hùng Kings Temple complex',
  'Tam quan Văn miếu Xích Đằng': 'Entrance gate of Xích Đằng Temple of Literature',
  'Vịnh Lan Hạ – Cát Bà': 'Lan Hạ Bay, Cát Bà',
  'Dãy núi Mẫu Sơn': 'Mẫu Sơn mountains',
  'Đèo Ô Quy Hồ': 'Ô Quy Hồ Pass',
  'Cổng Nam – Thành nhà Hồ': 'South Gate – Citadel of the Hồ Dynasty',
  'Khu di tích lịch sử Kim Liên': 'Kim Liên historical site',
  'Khu di tích Ngã ba Đồng Lộc': 'Đồng Lộc Junction memorial site',
  'Cửa động Phong Nha – Phong Nha–Kẻ Bàng': 'Phong Nha Cave entrance – Phong Nha–Kẻ Bàng',
  'Cổng Tò Vò – đảo Lý Sơn': 'Tò Vò Gate – Lý Sơn Island',
  'Biển Hồ T’Nưng – Pleiku': 'T’Nưng Lake – Pleiku',
  'Bãi biển Nha Trang': 'Nha Trang Beach',
  'Dinh Độc Lập – Thành phố Hồ Chí Minh': 'Independence Palace – Ho Chi Minh City',
  'Vườn quốc gia Cát Tiên': 'Cát Tiên National Park',
  'Tượng Tây Bổ Đà Sơn trên núi Bà Đen': 'Tây Bổ Đà Sơn statue on Bà Đen Mountain',
  'Đàn chim trên đồng ngập nước Tràm Chim': 'Waterbirds over Tràm Chim flooded grassland',
  'Lò gạch Mang Thít – Vĩnh Long': 'Mang Thít brick kilns – Vĩnh Long',
  'Chợ nổi Cái Răng – Cần Thơ': 'Cái Răng floating market – Cần Thơ',
  'Rừng tràm Trà Sư – An Giang': 'Trà Sư cajuput forest – An Giang',
  'Biểu tượng Mũi Cà Mau': 'Cape Cà Mau sailboat monument',
  'Đảo Song Tử Tây – Quần đảo Trường Sa': 'Song Tử Tây Island – Trường Sa archipelago',
};

// Station descriptions (tagline / summary).
exports.TAGLINES = {
  'Thủ đô nghìn năm văn hiến bên dòng sông Hồng với hương cốm thu và tiếng trống rối nước.': 'A thousand-year-old capital of learning on the Red River, with the scent of autumn cốm and the drums of water puppetry.',
  'Miền quê cách mạng Tân Trào và cao nguyên đá Đồng Văn hùng vĩ nơi địa đầu cực Bắc.': 'Revolutionary Tân Trào and the majestic Đồng Văn karst plateau at the country’s northernmost tip.',
  'Vùng cao biên giới sương mù Sa Pa – Fansipan, rực rỡ sắc màu thổ cẩm và ruộng bậc thang.': 'Misty border highlands of Sa Pa and Fansipan, bright with brocade and rice terraces.',
  'Vùng đất Thủ đô gió ngàn ATK và hồ Núi Cốc, nổi tiếng danh trà đệ nhất Tân Cương.': 'Home of the wartime ATK capital in the hills and Núi Cốc Lake, famed for Tân Cương, the finest of teas.',
  'Đất Tổ Hùng Vương cội nguồn dân tộc với tín ngưỡng thờ cúng Hùng Vương và câu hát Xoan cổ.': 'Ancestral land of the Hùng Kings and roots of the nation, with the worship of the Hùng Kings and ancient Xoan singing.',
  'Quê hương những làn điệu Quan họ mượt mà, tranh dân gian Đông Hồ và cổ tự miền Kinh Bắc.': 'Home of lilting Quan họ songs, Đông Hồ folk paintings and the ancient pagodas of Kinh Bắc.',
  'Miền quê văn hiến Phố Hiến xưa với mùa nhãn lồng ngọt thơm và kho tàng lễ hội châu thổ.': 'The cultured land of old Phố Hiến, with sweet longan seasons and a treasury of delta festivals.',
  'Thành phố Cảng hoa phượng đỏ vươn ra vịnh đảo Cát Bà và di sản non thiêng Yên Tử – Côn Sơn.': 'The port city of red flamboyant flowers, reaching out to the Cát Bà islands and the sacred heritage of Yên Tử – Côn Sơn.',
  'Cố đô Hoa Lư giữa non nước Tràng An kỳ vĩ, nơi hội tụ di sản văn hóa châu thổ sông Hồng.': 'The ancient capital Hoa Lư amid the majestic peaks and waters of Tràng An, where the heritage of the Red River Delta meets.',
  'Miền biên viễn non nước Cao Bằng hùng vĩ với thác Bản Giốc và tiếng đàn Tính trầm ấm.': 'The majestic frontier land of Cao Bằng, with Bản Giốc Waterfall and the warm sound of the Tính lute.',
  'Miền đất Cửa ngõ Xứ Lạng kỳ vĩ với núi Mẫu Sơn, thành cổ và điệu hát Then – đàn Tính.': 'The spectacular gateway land of Xứ Lạng, with Mẫu Sơn mountain, old citadels and Then singing with the Tính lute.',
  'Miền đất Lai Châu giàu truyền thống văn hóa, danh thắng Cao nguyên Sìn Hồ và hương vị Lợn cắp nách Sìn Hồ.': 'Lai Châu, rich in cultural traditions, with the Sìn Hồ Plateau and the flavour of Sìn Hồ lợn cắp nách pork.',
  'Vùng đất lịch sử Điện Biên Phủ giữa mùa hoa ban trắng và điệu xòe Thái ấm tình bản Mường.': 'Historic Điện Biên Phủ in the season of white ban flowers, with the warm Thái xòe dance of its mountain villages.',
  'Thảo nguyên Mộc Châu bốn mùa hoa trái giữa bản làng Tây Bắc và vòng Xòe Thái đoàn kết.': 'The Mộc Châu grasslands, with flowers and fruit in every season among Northwest villages and the Thái xòe circle of unity.',
  'Kỳ quan thiên nhiên thế giới Vịnh Hạ Long hòa quyện cùng non thiêng Yên Tử và văn hóa biển.': 'Hạ Long Bay, a natural wonder of the world, joined with sacred Yên Tử mountain and a culture of the sea.',
  'Vùng đất Lam Sơn địa linh nhân kiệt bên dòng sông Mã hào hùng và Thành nhà Hồ cổ kính.': 'Lam Sơn, a land of sacred soil and great people, beside the heroic Mã River and the ancient Citadel of the Hồ Dynasty.',
  'Quê hương xứ Nghệ bên dòng sông Lam với làng Sen quê Bác và câu hò Ví, Giặm sâu lắng.': 'The Nghệ homeland on the Lam River, with Sen Village, Uncle Hồ’s home village, and soulful Ví and Giặm songs.',
  'Dải đất Hồng Lam địa linh nhân kiệt, lắng đọng câu Ví, Giặm Nghệ Tĩnh và văn chương Nguyễn Du.': 'The Hồng Lam land of sacred soil and great people, steeped in Nghệ Tĩnh Ví and Giặm songs and the poetry of Nguyễn Du.',
  'Khúc ruột miền Trung kiên cường với kỳ quan hang động Phong Nha – Kẻ Bàng và dòng sông Bến Hải.': 'The resilient narrow waist of Central Vietnam, with the cave wonders of Phong Nha – Kẻ Bàng and the Bến Hải River.',
  'Kinh đô xưa bên dòng Hương Giang trầm mặc, nơi lưu giữ Nhã nhạc và nếp nhà vườn tinh tế.': 'The old imperial capital on the tranquil Perfume River (Hương Giang), keeper of court music and refined garden houses.',
  'Thành phố bên sông Hàn nối liền di sản phố cổ Hội An, thánh địa Mỹ Sơn và biển biếc.': 'The city on the Hàn River, linking the heritage of Hội An ancient town, the Mỹ Sơn sanctuary and a blue sea.',
  'Miền đất núi Ấn – sông Trà nối liền đảo tiền tiêu Lý Sơn với đại ngàn Măng Đen xanh mát.': 'The land of Ấn Mountain and Trà River, linking the outpost island of Lý Sơn with the cool green forests of Măng Đen.',
  'Không gian đại ngàn Tây Nguyên hùng vĩ với Biển Hồ T’Nưng và di sản cồng chiêng buôn làng.': 'The vast forests of the Central Highlands, with T’Nưng Lake (Biển Hồ) and the gong heritage of its villages.',
  'Cao nguyên Đắk Lắk đại ngàn vang vọng tiếng cồng chiêng, hương cà phê và sử thi Tây Nguyên.': 'The Đắk Lắk plateau, where the forests echo with gongs, the scent of coffee and Central Highlands epics.',
  'Xứ Trầm – Biển Yến hiền hòa nối liền vịnh biển Nha Trang với di sản tháp Chăm cổ kính.': 'The gentle land of agarwood and swiftlets, linking Nha Trang Bay with the heritage of ancient Cham towers.',
  'Cao nguyên ngàn hoa Đà Lạt giao hòa cùng văn hóa đại ngàn và bờ biển xanh miền Nam Trung Bộ.': 'Đà Lạt, the plateau of a thousand flowers, meeting the forest cultures and the blue coast of South Central Vietnam.',
  'Đô thị phương Nam hào sảng, rộn ràng tiếng Đờn ca tài tử và chợ hoa xuân trên bến dưới thuyền.': 'The generous southern metropolis, alive with Đờn ca tài tử music and spring flower markets on its wharves and boats.',
  'Vùng đất cửa ngõ Đông Nam Bộ trù phú bên dòng Đồng Nai, giàu truyền thống gốm cổ và miệt vườn.': 'The prosperous gateway to the Southeast on the Đồng Nai River, rich in old pottery and orchard traditions.',
  'Miền đất Tây Ninh giàu truyền thống văn hóa, danh thắng Núi Bà Đen và hương vị Bánh tráng phơi sương Trảng Bàng.': 'Tây Ninh, rich in cultural traditions, with Bà Đen Mountain and the flavour of Trảng Bàng dew-dried rice paper.',
  'Miền Đất Sen Hồng thanh khiết mùa nước nổi, rực rỡ làng hoa Sa Đéc bên dòng sông Tiền.': 'The pure land of pink lotus in the flood season, bright with the Sa Đéc flower villages on the Tiền River.',
  'Vùng đất cù lao xanh mát giữa hai dòng Tiền – Hậu, đậm đà văn hóa miệt vườn và gốm đỏ.': 'Green river islets between the Tiền and Hậu rivers, rich in orchard life and red pottery.',
  'Trái tim miệt vườn Tây Đô bên bến Ninh Kiều, tấp nập chợ nổi Cái Răng mỗi sớm mai.': 'The orchard heart of Tây Đô by Ninh Kiều Wharf, with Cái Răng floating market bustling every morning.',
  'Miền đất Thất Sơn linh thiêng giao hòa văn hóa đầu nguồn sông Hậu và biển đảo Phú Quốc.': 'The sacred Thất Sơn (Seven Mountains), where the upstream culture of the Hậu River meets the sea and islands of Phú Quốc.',
  'Mũi đất cực Nam Tổ quốc giữa rừng đước bạt ngàn, đậm tình đất và người cuối trời phương Nam.': 'The southernmost cape of the homeland amid endless mangroves, full of the warmth of its land and people at the far end of the South.',
  'Quần đảo tiền tiêu thiêng liêng giữa Biển Đông gắn liền với hải đội Hoàng Sa của cha ông.': 'A sacred outpost archipelago in Biển Đông (East Sea), bound to the Hoàng Sa flotilla of our ancestors.',
  'Quần đảo chủ quyền thiêng liêng nơi đầu sóng ngọn gió, rợp bóng bàng vuông và tình quân dân.': 'A sacred sovereign archipelago facing wind and waves, shaded by bàng vuông trees and the bond between soldiers and people.'
};

// ---- Template cards (every place except Hà Nội, Huế, Hồ Chí Minh City and the two archipelagos).
// Questions: {X} is the place.
exports.QUESTIONS = {
  'Món ăn hoặc sản vật nào sau đây là hương vị đặc trưng nổi tiếng gắn liền với vùng đất {X}?': 'Which dish or local product below is the famous signature flavour of {X}?',
  'Nét di sản văn hóa, lễ hội hoặc sinh hoạt truyền thống nào sau đây gắn bó mật thiết với cộng đồng cư dân tại {X}?': 'Which cultural heritage, festival or tradition below is closely tied to the people of {X}?',
  'Khi cùng gia đình du hành đến {X}, địa danh thắng cảnh hoặc di tích tiêu biểu nào thường được nhắc tới đầu tiên?': 'When travelling to {X} with your family, which landmark or historic site usually comes up first?',
  'Điều gì giúp các làng nghề thủ công và chế biến đặc sản truyền thống tại {X} giữ được uy tín và chất lượng qua nhiều thế hệ?': 'What has helped the craft villages and traditional food makers of {X} keep their reputation and quality for generations?'
};
// Explanations, by question kind: {S} is the subject (the answer, sometimes with notes), {X} the place, {G} the peoples.
exports.EXPLANATIONS = {
  food: { vi: /^(.+) là những thức quà ẩm thực tiêu biểu gắn liền với đời sống và văn hóa của người dân (.+)\.$/, en: '{S} are signature foods woven into the daily life and culture of the people of {X}.' },
  heritage: { vi: /^(.+) là một trong những niềm tự hào văn hóa được cộng đồng các dân tộc \((.+)\) tại (.+) gìn giữ qua nhiều thế hệ\.$/, en: '{S} — one of the cultural treasures that the ethnic communities of {X} ({G}) have kept alive for generations.' },
  heritagePeople: { vi: /^(.+) là một trong những niềm tự hào văn hóa được cộng đồng cư dân tại (.+) gìn giữ qua nhiều thế hệ\.$/, en: '{S} — one of the cultural treasures that the people of {X} have kept alive for generations.' },
  landmark: { vi: /^(.+) là những địa danh nổi tiếng gắn với vẻ đẹp thiên nhiên và lịch sử văn hóa của (.+)\.$/, en: '{S} are famous places tied to the natural beauty and cultural history of {X}.' },
  craft: { vi: /^Chính sự kiên nhẫn, tôn trọng nguyên liệu tự nhiên và đạo đức nghề nghiệp truyền thống đã làm nên danh tiếng cho sản vật (.+)\.$/, en: 'Patience, respect for natural ingredients and a traditional work ethic are what built the reputation of {X}’s local products.' }
};
// Peoples named in the heritage explanations (names not listed stay as they are).
exports.PEOPLES = { 'Lào': 'Lao', 'Bru - Vân Kiều': 'Bru-Vân Kiều', 'Khmer (chiếm hơn 31%)': 'Khmer (over 31%)', 'Khmer (hơn 30%)': 'Khmer (over 30%)' };

// Correct answers.
exports.ANSWERS = {
  'Cam sành Hàm Yên và Cá chiên sông Lô': 'Hàm Yên king oranges and Lô River cá chiên catfish',
  'Khu di tích Quốc gia Đặc biệt Tân Trào': 'Tân Trào Special National Relic Site',
  'Khu di tích lịch sử Tân Trào và Khu bảo tồn thiên nhiên Na Hang - Lâm Bình': 'Tân Trào Historic Site and Na Hang - Lâm Bình Nature Reserve',
  'Sự tỉ mỉ chọn nguyên liệu tự nhiên tại địa phương và kinh nghiệm truyền nghề từ ông bà sang con cháu': 'Careful choice of local natural ingredients and skills handed down from grandparents to grandchildren',
  'Thắng cố Bắc Hà và Cá hồi & Cá tầm Sa Pa': 'Bắc Hà thắng cố stew and Sa Pa salmon & sturgeon',
  'Ruộng bậc thang Sa Pa': 'Sa Pa rice terraces',
  'Đỉnh Fansipan và Thị xã sương mù Sa Pa': 'Fansipan Peak and the misty town of Sa Pa',
  'Chè Tân Cương và Bánh chưng Bờ Đậu': 'Tân Cương tea and Bờ Đậu bánh chưng',
  'Khu di tích Quốc gia Đặc biệt ATK Định Hóa': 'ATK Định Hóa Special National Relic Site',
  'Hồ Núi Cốc và Đồi chè Tân Cương': 'Núi Cốc Lake and the Tân Cương tea hills',
  'Thịt chua Thanh Sơn và Cá anh vũ ngã ba Bạch Hạc': 'Thanh Sơn fermented pork and anh vũ fish from the Bạch Hạc confluence',
  'Tín ngưỡng thờ cúng Hùng Vương ở Phú Thọ': 'Worship of the Hùng Kings in Phú Thọ',
  'Khu di tích lịch sử Đền Hùng và Vườn Quốc gia Xuân Sơn': 'Hùng Temple Historic Site and Xuân Sơn National Park',
  'Bánh phu thê Đình Bảng và Nem Bùi': 'Đình Bảng phu thê wedding cakes and Bùi nem fermented pork',
  'Dân ca Quan họ Bắc Ninh': 'Bắc Ninh Quan họ folk songs',
  'Đền Đô và Chùa Dâu': 'Đô Temple and Dâu Pagoda',
  'Nhãn lồng Hưng Yên và Gà Đông Tảo': 'Hưng Yên longans and Đông Tảo chickens',
  'Khu di tích Quốc gia Đặc biệt Phố Hiến': 'Phố Hiến Special National Relic Site',
  'Đô thị cổ Phố Hiến và Đền Mẫu': 'Phố Hiến ancient town and Mẫu Temple',
  'Bánh đa cua Hải Phòng và Nem cua bể': 'Hải Phòng bánh đa cua crab noodle soup and sea-crab spring rolls',
  'Lễ hội chọi trâu Đồ Sơn': 'Đồ Sơn buffalo fighting festival',
  'Quần đảo Cát Bà & Vịnh Lan Hạ và Đảo tiền tiêu Bạch Long Vĩ': 'Cát Bà Archipelago & Lan Hạ Bay and the outpost island of Bạch Long Vĩ',
  'Thịt dê núi Ninh Bình và Cơm cháy Hoa Lư': 'Ninh Bình mountain goat and Hoa Lư crispy rice',
  'Quần thể Danh thắng Tràng An': 'Tràng An Scenic Landscape Complex',
  'Khu du lịch sinh thái Tràng An và Tam Cốc - Bích Động & Hang Múa': 'Tràng An eco-tourism area and Tam Cốc - Bích Động & Múa Cave',
  'Bánh cuốn Cao Bằng và Phở chua': 'Cao Bằng rice rolls and sour phở',
  'Công viên Địa chất Toàn cầu Non nước Cao Bằng': 'Non nước Cao Bằng Global Geopark',
  'Thác Bản Giốc và Động Ngườm Ngao': 'Bản Giốc Waterfall and Ngườm Ngao Cave',
  'Vịt quay Lạng Sơn mắc mật và Phở chua xứ Lạng': 'Lạng Sơn roast duck with mắc mật leaves and Lạng sour phở',
  'Công viên Địa chất Lạng Sơn': 'Lạng Sơn Geopark',
  'Đỉnh Mẫu Sơn tuyết phủ và Động Tam Thanh & Nàng Tô Thị': 'Snow-capped Mẫu Sơn Peak and Tam Thanh Cave & the Nàng Tô Thị stone',
  'Lợn cắp nách Sìn Hồ và Cá bống vùi tro': 'Sìn Hồ lợn cắp nách pork and gobies baked in embers',
  'Lễ hội Nàng Han': 'Nàng Han Festival',
  'Cao nguyên Sìn Hồ và Đỉnh Pu Ta Leng & Pu Si Lung': 'Sìn Hồ Plateau and the Pu Ta Leng & Pu Si Lung peaks',
  'Gạo Điện Biên và Thịt trâu gác bếp': 'Điện Biên rice and smoked buffalo meat',
  'Chiến trường Điện Biên Phủ - Di tích Quốc gia Đặc biệt': 'Điện Biên Phủ battlefield - Special National Relic Site',
  'Đồi A1, Hầm Đờ Cát, Tượng đài Chiến thắng Điện Biên Phủ và Sở chỉ huy chiến dịch Mường Phăng': 'Hill A1, De Castries’ bunker, the Điện Biên Phủ Victory Monument and the Mường Phăng campaign headquarters',
  'Sữa tươi & Chè Mộc Châu và Bê chao Mộc Châu': 'Mộc Châu fresh milk & tea and Mộc Châu bê chao fried veal',
  'Di tích Quốc gia Đặc biệt Nhà tù Sơn La': 'Sơn La Prison Special National Relic Site',
  'Cao nguyên Mộc Châu và Thiên đường mây Tà Xùa': 'Mộc Châu Plateau and Tà Xùa, the cloud paradise',
  'Chả mực Hạ Long và Sá sùng Quan Lạn': 'Hạ Long squid cakes and Quan Lạn sá sùng sea worms',
  'Vịnh Hạ Long - Quần đảo Cát Bà': 'Hạ Long Bay - Cát Bà Archipelago',
  'Vịnh Hạ Long và Non thiêng Yên Tử': 'Hạ Long Bay and sacred Yên Tử mountain',
  'Nem chua Thanh Hóa và Chả tôm': 'Thanh Hóa nem chua fermented pork and shrimp cakes',
  'Trò Xuân Phả': 'Xuân Phả folk plays',
  'Thành nhà Hồ và Khu di tích Lam Kinh': 'Citadel of the Hồ Dynasty and Lam Kinh relic site',
  'Cháo lươn & Súp lươn Nghệ An và Nhút Thanh Chương': 'Nghệ An eel porridge & eel soup and Thanh Chương nhút pickles',
  'Dân ca Ví, Giặm Nghệ Tĩnh': 'Ví and Giặm folk songs of Nghệ Tĩnh',
  'Làng Sen & Làng Hoàng Trù và Bãi biển Cửa Lò & Đảo Hòn Ngư': 'Sen Village & Hoàng Trù Village and Cửa Lò Beach & Hòn Ngư Island',
  'Kẹo cu đơ Hà Tĩnh và Gỏi cá đục': 'Hà Tĩnh cu đơ peanut candy and gỏi cá đục fish salad',
  'Ngã ba Đồng Lộc và Chùa Hương Tích': 'Đồng Lộc Junction and Hương Tích Pagoda',
  'Cháo canh Quảng Bình và Bánh bột lọc Đồng Hới': 'Quảng Bình cháo canh noodle soup and Đồng Hới tapioca dumplings',
  'Vườn Quốc gia Phong Nha - Kẻ Bàng': 'Phong Nha - Kẻ Bàng National Park',
  'Hang Sơn Đoòng và Động Phong Nha - Tiên Sơn & Động Thiên Đường': 'Sơn Đoòng Cave and the Phong Nha - Tiên Sơn caves & Paradise Cave',
  'Mì Quảng Đà Nẵng và Bánh tráng cuốn thịt heo': 'Đà Nẵng mì Quảng noodles and pork rolled in rice paper',
  'Danh thắng Quốc gia Đặc biệt Ngũ Hành Sơn': 'Ngũ Hành Sơn (Marble Mountains) Special National Scenic Site',
  'Cầu Rồng & Cầu Vàng và Bán đảo Sơn Trà & Chùa Linh Ứng': 'Dragon Bridge & Golden Bridge and Sơn Trà Peninsula & Linh Ứng Pagoda',
  'Tỏi cô đơn Lý Sơn và Cá bống sông Trà': 'Lý Sơn single-clove garlic and Trà River gobies',
  'Văn hóa Sa Huỳnh': 'Sa Huỳnh culture',
  'Đảo Lý Sơn và Núi Ấn - Sông Trà': 'Lý Sơn Island and Ấn Mountain - Trà River',
  'Phở khô Gia Lai và Bò một nắng muối kiến vàng Krông Pa': 'Gia Lai dry phở and Krông Pa sun-dried beef with yellow-ant salt',
  'Không gian Văn hóa Cồng chiêng Tây Nguyên': 'Space of Gong Culture in the Central Highlands',
  'Biển Hồ Pleiku và Núi lửa Chư Đăng Ya': 'Pleiku’s Biển Hồ Lake and Chư Đăng Ya volcano',
  'Cà phê Buôn Ma Thuột và Bún đỏ Đắk Lắk': 'Buôn Ma Thuột coffee and Đắk Lắk bún đỏ red noodles',
  'Hồ Lắk & Buôn Jun và Cụm thác Dray Nur - Dray Sáp': 'Lắk Lake & Jun Village and the Dray Nur - Dray Sáp waterfalls',
  'Yến sào Khánh Hòa và Bún chả cá & Bún sứa Nha Trang': 'Khánh Hòa bird’s nest and Nha Trang fish-cake & jellyfish noodles',
  'Tháp Bà Ponagar': 'Po Nagar Cham Towers',
  'Vịnh Nha Trang, Vịnh Vân Phong & Vịnh Cam Ranh và Quần đảo Trường Sa': 'Nha Trang Bay, Vân Phong Bay & Cam Ranh Bay and the Trường Sa Islands',
  'Rau củ quả & Dâu tây Đà Lạt và Trà B\'Lao & Cà phê Arabica Cầu Đất': 'Đà Lạt vegetables & strawberries and B’Lao tea & Cầu Đất Arabica coffee',
  'Thành phố ngàn hoa Đà Lạt & Hồ Xuân Hương và Đỉnh Langbiang': 'Đà Lạt, city of flowers, & Xuân Hương Lake and Langbiang Peak',
  'Bưởi Tân Triều và Gà hấp bưởi': 'Tân Triều pomelos and pomelo-steamed chicken',
  'Văn miếu Trấn Biên': 'Trấn Biên Temple of Literature',
  'Vườn Quốc gia Cát Tiên và Hồ Trị An & Đảo Ó': 'Cát Tiên National Park and Trị An Lake & Ó Island',
  'Bánh tráng phơi sương Trảng Bàng và Bánh canh Trảng Bàng': 'Trảng Bàng dew-dried rice paper and Trảng Bàng bánh canh noodle soup',
  'Di tích Quốc gia Đặc biệt Căn cứ Trung ương Cục miền Nam': 'Central Office for South Vietnam Base Special National Relic Site',
  'Núi Bà Đen và Tòa Thánh Cao Đài Tây Ninh': 'Bà Đen Mountain and the Tây Ninh Cao Đài Holy See',
  'Hủ tiếu Sa Đéc và Nem Lai Vung': 'Sa Đéc hủ tiếu noodle soup and Lai Vung nem fermented pork',
  'Di tích Quốc gia Đặc biệt Gò Tháp': 'Gò Tháp Special National Relic Site',
  'Vườn Quốc gia Tràm Chim và Làng hoa Sa Đéc': 'Tràm Chim National Park and Sa Đéc flower village',
  'Bưởi Năm Roi Bình Minh và Khoai lang Bình Tân': 'Bình Minh Năm Roi pomelos and Bình Tân sweet potatoes',
  'Văn Thánh Miếu Vĩnh Long': 'Vĩnh Long Temple of Literature (Văn Thánh Miếu)',
  'Cù lao An Bình và Vương quốc gạch gốm đỏ Mang Thít': 'An Bình Islet and Mang Thít, kingdom of red brick and pottery',
  'Bánh cống Cần Thơ và Lẩu vịt nấu chao': 'Cần Thơ bánh cống fritters and duck hotpot with fermented tofu',
  'Văn hóa Chợ nổi Cái Răng': 'Cái Răng floating market culture',
  'Bến Ninh Kiều & Cầu đi bộ Cần Thơ và Chợ nổi Cái Răng': 'Ninh Kiều Wharf & Cần Thơ pedestrian bridge and Cái Răng floating market',
  'Bún cá Long Xuyên & Châu Đốc và Mắm Châu Đốc': 'Long Xuyên & Châu Đốc fish noodle soup and Châu Đốc mắm fermented fish',
  'Lễ hội Vía Bà Chúa Xứ núi Sam': 'Vía Bà Chúa Xứ Festival on Sam Mountain',
  'Miếu Bà Chúa Xứ Núi Sam và Rừng tràm Trà Sư': 'Bà Chúa Xứ Temple on Sam Mountain and Trà Sư cajuput forest',
  'Cua Cà Mau và Mật ong rừng U Minh Hạ': 'Cà Mau crabs and U Minh Hạ forest honey',
  'Khu dự trữ sinh quyển Thế giới Mũi Cà Mau': 'Cà Mau Cape World Biosphere Reserve',
  'Mũi Cà Mau và Vườn Quốc gia U Minh Hạ': 'Cà Mau Cape and U Minh Hạ National Park'
};
// A note in brackets after the whole answer, in the explanation.
exports.NOTES = {
  'UNESCO': 'UNESCO',
  'Di sản Văn hóa Phi vật thể UNESCO': 'UNESCO Intangible Cultural Heritage',
  'Ngôi chùa cổ nhất Việt Nam': 'the oldest pagoda in Vietnam',
  'Di sản văn hóa phi vật thể quốc gia': 'National Intangible Cultural Heritage',
  'Di sản Văn hóa & Thiên nhiên Thế giới Hỗn hợp UNESCO': 'UNESCO mixed cultural and natural World Heritage',
  'Di sản Thiên nhiên Thế giới UNESCO': 'UNESCO World Natural Heritage',
  'Hoan Châu đệ nhất danh lam': 'the finest scenic site of old Hoan Châu',
  'Di tích Quốc gia Đặc biệt': 'Special National Relic Site',
  'Văn miếu đầu tiên tại phương Nam': 'the first Temple of Literature in the South',
  'Văn hóa Óc Eo': 'Óc Eo culture',
  'Di sản Văn hóa Phi vật thể Quốc gia': 'National Intangible Cultural Heritage',
  'Lẩu mắm': 'fermented fish hotpot',
  'Di sản Văn hóa Phi vật thể Đại diện của Nhân loại UNESCO': 'UNESCO Representative Intangible Cultural Heritage of Humanity'
};
// Explanation subjects with notes inside (not only after the whole answer).
exports.SUBJECTS = {
  'Khu di tích lịch sử Tân Trào (Cây đa, Lán Nà Nưa, Đình Tân Trào) và Khu bảo tồn thiên nhiên Na Hang - Lâm Bình': 'Tân Trào Historic Site (the banyan tree, Nà Nưa hut and Tân Trào communal house) and Na Hang - Lâm Bình Nature Reserve',
  'Đỉnh Fansipan (Nóc nhà Đông Dương 3.147,3m) và Thị xã sương mù Sa Pa': 'Fansipan Peak (the Roof of Indochina, 3,147.3 m) and the misty town of Sa Pa',
  'Chè Tân Cương (Đệ nhất danh trà) và Bánh chưng Bờ Đậu': 'Tân Cương tea (the finest of teas) and Bờ Đậu bánh chưng',
  'Khu di tích lịch sử Đền Hùng (Núi Nghĩa Lĩnh) và Vườn Quốc gia Xuân Sơn': 'Hùng Temple Historic Site (Nghĩa Lĩnh Mountain) and Xuân Sơn National Park',
  'Đô thị cổ Phố Hiến (\'Thứ nhất Kinh Kỳ, thứ nhì Phố Hiến\') và Đền Mẫu': 'Phố Hiến ancient town (‘first the capital, second Phố Hiến’) and Mẫu Temple',
  'Thác Bản Giốc (thác nước biên giới hùng vĩ) và Động Ngườm Ngao': 'Bản Giốc Waterfall (a majestic border waterfall) and Ngườm Ngao Cave',
  'Gạo Điện Biên (Cánh đồng Mường Thanh) và Thịt trâu gác bếp': 'Điện Biên rice (from the Mường Thanh fields) and smoked buffalo meat',
  'Trò Xuân Phả (Di sản văn hóa phi vật thể quốc gia) ở làng Xuân Phả': 'Xuân Phả folk plays (National Intangible Cultural Heritage) of Xuân Phả village',
  'Làng Sen & Làng Hoàng Trù (Kim Liên, Nam Đàn) và Bãi biển Cửa Lò & Đảo Hòn Ngư (Song Ngư)': 'Sen Village & Hoàng Trù Village (Kim Liên, Nam Đàn) and Cửa Lò Beach & Hòn Ngư Island (Song Ngư)',
  'Hang Sơn Đoòng (Hang động tự nhiên lớn nhất thế giới) và Động Phong Nha - Tiên Sơn & Động Thiên Đường': 'Sơn Đoòng Cave (the largest natural cave in the world) and the Phong Nha - Tiên Sơn caves & Paradise Cave',
  'Cầu Rồng & Cầu Vàng (Bà Nà Hills) và Bán đảo Sơn Trà & Chùa Linh Ứng': 'Dragon Bridge & Golden Bridge (Bà Nà Hills) and Sơn Trà Peninsula & Linh Ứng Pagoda',
  'Đảo Lý Sơn (Vương quốc tỏi & Cổng Tò Vò) và Núi Ấn - Sông Trà': 'Lý Sơn Island (kingdom of garlic & Tò Vò Arch) and Ấn Mountain - Trà River',
  'Phở khô Gia Lai (Phở hai tô) và Bò một nắng muối kiến vàng Krông Pa': 'Gia Lai dry phở (two-bowl phở) and Krông Pa sun-dried beef with yellow-ant salt',
  'Biển Hồ Pleiku (Đôi mắt Pleiku) và Núi lửa Chư Đăng Ya': 'Pleiku’s Biển Hồ Lake (the Eyes of Pleiku) and Chư Đăng Ya volcano',
  'Rau củ quả & Dâu tây Đà Lạt và Trà B\'Lao (Bảo Lộc) & Cà phê Arabica Cầu Đất': 'Đà Lạt vegetables & strawberries and B’Lao (Bảo Lộc) tea & Cầu Đất Arabica coffee',
  'Bưởi Tân Triều (Gỏi bưởi) và Gà hấp bưởi': 'Tân Triều pomelos (pomelo salad) and pomelo-steamed chicken',
  'Núi Bà Đen (Nóc nhà Nam Bộ 986m) và Tòa Thánh Cao Đài Tây Ninh': 'Bà Đen Mountain (the Roof of the South, 986 m) and the Tây Ninh Cao Đài Holy See',
  'Vườn Quốc gia Tràm Chim (Khu Ramsar - Sếu đầu đỏ) và Làng hoa Sa Đéc': 'Tràm Chim National Park (Ramsar site - Sarus cranes) and Sa Đéc flower village',
  'Miếu Bà Chúa Xứ Núi Sam (Châu Đốc) và Rừng tràm Trà Sư': 'Bà Chúa Xứ Temple on Sam Mountain (Châu Đốc) and Trà Sư cajuput forest',
  'Cua Cà Mau (Cua gạch, Cua thịt) và Mật ong rừng U Minh Hạ': 'Cà Mau crabs (roe crabs, meat crabs) and U Minh Hạ forest honey',
  'Mũi Cà Mau (Cột mốc tọa độ Quốc gia GPS 0001 - Điểm cực Nam Tổ quốc) và Vườn Quốc gia U Minh Hạ': 'Cà Mau Cape (national GPS coordinate marker 0001 - the country’s southernmost point) and U Minh Hạ National Park'
};
// Wrong options.
exports.DISTRACTORS = {
  'Bún nước lèo Sóc Trăng nấu từ mắm bò hóc và ngải bún thơm dịu miền Tây': 'Sóc Trăng bún nước lèo, a noodle soup made with bò hóc fish paste and fragrant fingerroot from the Mekong Delta',
  'Mì Quảng tôm thịt ăn kèm bánh tráng nướng giòn và rau sống xứ Quảng': 'Mì Quảng noodles with shrimp and pork, served with crisp grilled rice crackers and Quảng herbs',
  'Điệu múa Trống Chhay-dăm rộn ràng trong các lễ hội truyền thống vùng Nam Bộ': 'The lively Chhay-dăm drum dance of traditional festivals in Southern Vietnam',
  'Làn điệu Hát Xoan cổ truyền gắn với các ngôi đình làng vùng đất Tổ': 'Ancient Xoan singing, performed at the village communal houses of the ancestral land',
  'Tháp Chăm cổ kính nằm trên đồi cao nhìn ra vùng vịnh biển miền Trung': 'Ancient Cham towers on a hilltop overlooking a bay in Central Vietnam',
  'Cánh đồng quạt gió ven biển kết hợp khu bảo tồn rừng ngập mặn phương Nam': 'A coastal wind farm beside a southern mangrove reserve',
  'Quy trình ươm tơ dệt lụa thủ công trên khung cửi gỗ truyền thống ven sông': 'Hand-reeling silk and weaving it on traditional wooden looms by the river',
  'Dùng máy móc công nghiệp thay cho mọi công đoạn làm tay để sản xuất thật nhanh': 'Replacing every handmade step with industrial machines to produce as fast as possible',
  'Phở chua Lạng Sơn trộn khoai môn chiên giòn và nước sốt mắc mật đậm đà': 'Lạng Sơn sour phở tossed with crispy fried taro and a rich mắc mật sauce',
  'Nghệ thuật diễn xướng Cồng chiêng bên ánh lửa nhà rông vùng cao nguyên': 'Gong performances by the firelight of a highland rông communal house',
  'Đèo đá tai mèo hiểm trở trên công viên địa chất vùng núi biên cương': 'A perilous pass of jagged ‘cat-ear’ rocks in a border mountain geopark',
  'Phương pháp chạm khắc gỗ mít và sơn thếp vàng truyền thống ở các làng nghề cổ': 'Traditional jackfruit-wood carving and gold-leaf lacquering in old craft villages',
  'Bánh cáy làng Nguyễn và canh cá Quỳnh Côi nấu theo lối đồng bằng Bắc Bộ': 'Nguyễn village bánh cáy sweets and Quỳnh Côi fish soup, cooked the Northern Delta way',
  'Nghệ thuật hát Bài chòi dân gian trình diễn trên các chòi tre ngày xuân': 'Folk Bài chòi singing, performed from bamboo huts in spring',
  'Khu di tích Cố đô Hoa Lư và quần thể hang động đá vôi vùng châu thổ': 'The Hoa Lư ancient capital relic site and the limestone caves of the delta',
  'Kỹ thuật nung gốm không tráng men bằng củi rừng truyền thống suốt nhiều ngày đêm': 'Firing unglazed pottery with forest wood for many days and nights, the traditional way',
  'Trực thuộc tỉnh Quảng Ngãi': 'Part of Quảng Ngãi Province',
  'Trực thuộc tỉnh Khánh Hòa': 'Part of Khánh Hòa Province',
  'Trực thuộc thành phố Đà Nẵng': 'Part of Đà Nẵng City',
  'Côn Đảo, Hòn Bảy Cạnh và Hòn Tre Lớn ở vùng biển Côn Sơn': 'Côn Đảo, Hòn Bảy Cạnh and Hòn Tre Lớn in the Côn Sơn waters',
  'Phú Quốc, Thổ Chu và Nam Du trong vịnh Thái Lan': 'Phú Quốc, Thổ Chu and Nam Du in the Gulf of Thailand',
  'Cột cờ Lũng Cú nơi cực Bắc Tổ quốc': 'Lũng Cú Flag Tower at the country’s northernmost point',
  'Cột mốc tọa độ quốc gia ở Mũi Cà Mau': 'The national coordinate marker at Cà Mau Cape',
  'Lá dong rừng như cách gói bánh quen thuộc ở đồng bằng Bắc Bộ': 'Forest dong leaves, as cakes are usually wrapped in the Northern Delta',
  'Lá chuối hột phơi héo như bánh tét miền Nam': 'Wilted seeded-banana leaves, as for bánh tét in the South'
};

// ---- Cards written one by one: id → { question, options (in data order), explanation }.
const HS = 'Hoàng Sa (Paracel) Islands (Hoàng Sa Special Zone)', TS = 'Trường Sa (Spratly) Islands (Trường Sa Special Zone)';
const LEAF_Q = 'At Tết on the distant islands, which signature tree’s leaves do soldiers and islanders use to wrap bánh chưng?';
const LEAF_OPTIONS = ['Bàng vuông (sea-almond) leaves — from a tree that stands firm against the storms of Biển Đông (East Sea)', 'Forest dong leaves, as cakes are usually wrapped in the Northern Delta', 'Wilted seeded-banana leaves, as for bánh tét in the South'];
const LEAF_E = 'Bánh chưng wrapped in bàng vuông leaves is a special food tradition of the distant islands, warm with the bond between soldiers and people each spring.';
const SITE = 'Which landmark or structure shows Vietnam’s enduring spirit and sovereignty in the ';
const SITE_E = ' is a symbol affirming the historic sovereignty and enduring spirit of the Vietnamese people on the nation’s seas and islands.';
const GROUP_WRONG = ['Côn Đảo, Hòn Bảy Cạnh and Hòn Tre Lớn in the Côn Sơn waters', 'Phú Quốc, Thổ Chu and Nam Du in the Gulf of Thailand'];
const MARK_WRONG = ['Lũng Cú Flag Tower at the country’s northernmost point', 'The national coordinate marker at Cà Mau Cape'];
const HS_ISLANDS = 'An Vĩnh group (east): Phú Lâm Island (the largest), Cây Island, Bắc Island, Trung Island, Nam Island, Linh Côn (Lincoln) Island, Bông Bay Reef; Lưỡi Liềm (Crescent) group (west): Hoàng Sa (Pattle) Island, Quang Hòa Island, Duy Mộng Island, Hữu Nhật Island, Quang Ảnh Island, Bạch Quy Island, Tri Tôn Island, Lồi Reef';
const TS_ISLANDS = '8 main island clusters: Song Tử (Song Tử Tây, Song Tử Đông), Thị Tứ, Loại Ta, Nam Yết (Nam Yết, Sơn Ca, Đá Lớn, Phan Vinh), Sinh Tồn (Sinh Tồn, Sinh Tồn Đông, Cô Lin, Len Đao, Gạc Ma), Trường Sa (Trường Sa Lớn, Đá Tây, Đá Lát, Trường Sa Đông), Thám Hiểm (An Bang, Thuyền Chài, Tiên Nữ) and Bình Nguyên';
exports.CARDS = {
  'hoang-sa-c1': { question: `Which Vietnamese province or city are the ${HS} part of today?`, options: ['Part of Đà Nẵng City', 'Part of Quảng Ngãi Province', 'Part of Khánh Hòa Province'], explanation: `The ${HS} are a sacred part of Vietnam’s territory, belonging to Đà Nẵng City.` },
  'hoang-sa-c2': { question: `Which of these islands belong to Vietnam’s ${HS}?`, options: [HS_ISLANDS, ...GROUP_WRONG], explanation: `These islands — ${HS_ISLANDS} — are notable geographic features of Vietnam’s ${HS}.` },
  'hoang-sa-c3': { question: SITE + HS + '?', options: ['The Hoàng Sa sovereignty stele (1816 – 1938)', ...MARK_WRONG], explanation: 'The Hoàng Sa sovereignty stele (1816 – 1938)' + SITE_E },
  'hoang-sa-c4': { question: LEAF_Q, options: LEAF_OPTIONS, explanation: LEAF_E },
  'truong-sa-c1': { question: `Which Vietnamese province or city are the ${TS} part of today?`, options: ['Part of Khánh Hòa Province', 'Part of Đà Nẵng City', 'Part of Quảng Ngãi Province'], explanation: `The ${TS} are a sacred part of Vietnam’s territory, belonging to Khánh Hòa Province.` },
  'truong-sa-c2': { question: `Which of these islands belong to Vietnam’s ${TS}?`, options: [TS_ISLANDS, ...GROUP_WRONG], explanation: `These islands — ${TS_ISLANDS} — are notable geographic features of Vietnam’s ${TS}.` },
  'truong-sa-c3': { question: SITE + TS + '?', options: ['The sovereignty marker on Trường Sa Lớn Island', ...MARK_WRONG], explanation: 'The sovereignty marker on Trường Sa Lớn Island' + SITE_E },
  'truong-sa-c4': { question: LEAF_Q, options: LEAF_OPTIONS, explanation: LEAF_E },

  // The twelve verified cards of Hà Nội, Huế and Hồ Chí Minh City.
  'hn-c1': {
    question: 'In the traditional way of wrapping fresh cốm (young green rice) in Hà Nội, which two layers of leaves do cốm makers combine to keep it soft and moist while scenting it naturally?',
    options: ['An inner layer of young ráy leaves keeps it moist, and an outer layer of lotus leaves adds a fresh fragrance', 'An inner layer of dry banana leaves soaks up water, and an outer layer of tropical almond leaves keeps it warm', 'An inner layer of canna leaves holds its shape, and an outer layer of bamboo leaves shields it from the wind'],
    explanation: 'Young ráy leaves keep the cốm grains moist and supple, while fresh lotus leaves tied outside with sticky-rice straw give it the gentle fragrance of a Hà Nội autumn.' },
  'hn-c2': {
    question: 'In traditional water puppetry, how do the artists move the puppets across the water?',
    options: ['Standing behind a bamboo screen in the puppet house, using bamboo poles and strings hidden under the water', 'Standing on a floating bridge above the pond, lowering thin nylon strings straight down from the pavilion roof', 'Sitting in small boats beside the stage, paddling to make waves that push the wooden puppets along'],
    explanation: 'The artists stand behind a bamboo screen (the buồng trò), working bamboo poles and underwater strings together so the fig-wood puppets move in time with the chèo drums.' },
  'hn-c3': {
    question: 'In the legend and rituals of the Gióng Festival at Phù Đổng Temple, which humble dish do the villagers prepare together to stand for feeding the army as one?',
    options: ['Plain white rice and salted eggplant, prepared together by families from every hamlet', 'Mung bean bánh chưng and lean pork sausage on finely carved bronze trays', 'Red gấc sticky rice and molasses sweet soup served at grand royal ceremonies'],
    explanation: 'The trays of white rice and salted eggplant at the Gióng Festival recall the simple, united effort of the villagers in the legend of fighting foreign invaders.' },
  'hn-c4': {
    question: 'In handmade Bát Tràng pottery, why must pieces shaped on the wheel be dried evenly before they go into the kiln?',
    options: ['So the water in the clay escapes slowly, making the body firm and preventing cracks at high temperature', 'So the clay turns into a glossy glaze by itself, with no outer glaze needed', 'So the pieces lose half their weight and potters can stack hundreds without saggars'],
    explanation: 'If wet clay suddenly meets a strong fire, the steam expands fast and cracks the piece; so drying takes patience and a careful eye on the weather.' },
  'hue-c1': {
    question: 'Nhã nhạc, Huế royal court music — inscribed by UNESCO in 2003 — was mainly performed in which setting?',
    options: ['Played by the Great and Small orchestras at solemn rituals in the Nguyễn dynasty’s imperial palace', 'Simple call-and-response singing with no instruments between boat rowers on the Perfume River at night', 'A solo on a single đàn bầu monochord at country markets on the outskirts in early spring'],
    explanation: 'Nhã nhạc is ritual court music played by an ensemble of traditional instruments at major ceremonies in the Huế Imperial City.' },
  'hue-c2': {
    question: 'In Huế cuisine, what does serving many cakes and dishes in small, dainty portions give the diner?',
    options: ['A chance to enjoy colour, fragrance and many layers of flavour in harmony without tiring of them', 'A way to cook every dish together in one single broth from morning to night', 'A way to do without fresh herbs and dipping sauces in the meal altogether'],
    explanation: 'Small, carefully prepared portions let a Huế meal balance taste, smell and sight.' },
  'hue-c3': {
    question: 'Which handcraft technique do Huế hat makers use so that a poem and a picture of Trường Tiền Bridge appear when the “poem hat” is held up to the sun?',
    options: ['Placing thin paper cut-outs of patterns and words between two layers of white palm leaves before stitching', 'Carving the lines deep into the old bamboo frame and brushing golden lacquer over the surface', 'Embroidering the whole poem in thick silk thread on the outside of the hat after oiling it'],
    explanation: 'The patterns and verses are cut from thin paper and pressed flat between two layers of hat leaves, so they stay hidden until light shines through.' },
  'hue-c4': {
    question: 'What is the signature setting of the Điện Huệ Nam (Hòn Chén Temple) Festival in Huế?',
    options: ['A procession of paired boats decked with flags and flowers along the Perfume River toward Ngọc Trản Mountain', 'Horse races over high passes on limestone slopes far from the Perfume River', 'Releasing sky lanterns from ancient brick towers deep in primeval forest'],
    explanation: 'The boat procession on the Perfume River is the signature river culture of the Điện Huệ Nam Festival, held each third and seventh lunar month.' },
  'hcm-c1': {
    question: 'What is the familiar, traditional setting of Đờn ca tài tử music of Southern Vietnam?',
    options: ['Kindred spirits gathering on a porch, in a garden or on a boat to play and sing together simply', 'It may only be performed in closed symphony halls with orchestras of over a hundred musicians', 'Singers must sing while doing acrobatics on a high wire, with no instruments to accompany them'],
    explanation: 'Đờn ca tài tử is woven into everyday life, prizing harmony and the sharing of music among close friends in familiar places.' },
  'hcm-c2': {
    question: 'What cultural exchange does the “Trên bến dưới thuyền” (wharf and boats) Tết flower market at Bình Đông Wharf, Hồ Chí Minh City, reflect?',
    options: ['Boats carry flowers and ornamental plants from Mekong Delta gardens along rivers and canals to the Tàu Hủ Canal to trade with the city', 'Large sailing fleets from far offshore bring coral and pearls to trade right in the central square', 'A night-only market on highland hilltops that shows temperate wild flowers'],
    explanation: 'The “Trên bến dưới thuyền” spring flower market links the river life of the Mekong Delta orchards with the city life of Hồ Chí Minh City every traditional Tết.' },
  'hcm-c3': {
    question: 'The “broken rice” (gạo tấm) used for the familiar cơm tấm of Sài Gòn and the South originally comes from which part of the rice grain?',
    options: ['The ends of rice grains broken into small pieces during traditional milling', 'Young sticky rice grains steamed, then flattened in a stone mortar right after harvest', 'Plain rice flour kneaded with coconut milk and rolled into small balls'],
    explanation: 'Out of farmers’ respect for every grain, the broken pieces left from milling were turned by people in the South into fragrant, tender cơm tấm.' },
  'hcm-c4': {
    question: 'Why do Phú Bình craft village artisans choose thin strips of mature bamboo for the frames of traditional cellophane lanterns?',
    options: ['Because mature bamboo is light yet flexible, easy to bend into stars and carp, and holds its shape well', 'Because mature bamboo glows in the dark by itself, with no candle or small light inside', 'Because mature bamboo never catches fire, even placed directly in a pottery kiln'],
    explanation: 'Dried, thinly split mature bamboo is springy, so artisans can bend it into many lively shapes before stretching coloured cellophane over it.' }
};

// ---- Activities (connection side). The 【kind】 prefix comes from the activity kind labels.
exports.ACTIVITY_KINDS = { 'Kể chuyện': 'Storytelling', 'Đoán': 'Guessing', 'Chăm sóc tự nguyện': 'Caring (optional)', 'Quan sát': 'Observation', 'Phối hợp': 'Teamwork', 'Sáng tạo đơn giản': 'Simple creativity' };
exports.ACTIVITIES = {
  'Mời một người cùng chơi kể về một thức quà quê hoặc món ăn theo mùa mà họ nhớ nhất, rồi gợi ý một địa danh gắn với món ăn đó trên bản đồ.': 'Invite one player to tell about the home-town treat or seasonal dish they remember most, then suggest a place on the map linked to that dish.',
  'Một người chọn thầm một món ăn truyền thống và tả 3 đặc điểm (màu sắc, mùi thơm, cách gói bằng lá) để những người còn lại cùng đoán tên món.': 'One player secretly picks a traditional dish and describes 3 features (colour, smell, how it is wrapped in leaves) for the others to guess its name.',
  'Nếu thuận tiện, hãy mời người ngồi cạnh một ngụm nước hoặc trà ấm và hỏi xem họ thích thưởng thức món quà vặt nào nhất vào ngày mát trời.': 'If convenient, offer the person next to you a sip of water or warm tea and ask which snack they like best on a cool day.',
  'Cả nhóm cùng nhìn một đồ vật quanh bàn (hoặc ảnh danh thắng trong khung ga) trong 10 giây, sau đó mỗi người gọi tên một chi tiết màu sắc hoặc hình khối mình chú ý đầu tiên.': 'Everyone looks at one object around the table (or the landmark photo in the station frame) for 10 seconds, then each names the first colour or shape they noticed.',
  'Một người dùng bàn tay mô phỏng chuyển động của một con vật quen thuộc ở làng quê Việt Nam (cá bơi, cò vỗ cánh, trâu cày...) để mọi người đoán trong 15 giây.': 'One player uses their hands to mimic a familiar Vietnamese village animal (a swimming fish, a stork flapping its wings, a buffalo ploughing...) for the others to guess within 15 seconds.',
  'Một người gõ nhẹ một nhịp vỗ tay ngắn như tiếng trống mở màn rối nước, những người còn lại cùng vỗ tay đáp lại đúng nhịp đó.': 'One player claps a short rhythm like the drum that opens a water puppet show, and the others clap the same rhythm back.',
  'Trong 20 giây, cả nhóm cùng lần lượt kể tên các nguyên liệu giản dị để chuẩn bị một bữa cơm nhanh gọn mà ai trong nhóm cũng dễ ăn.': 'In 20 seconds, take turns naming simple ingredients for a quick meal that everyone in the group would enjoy.',
  'Mời một người chia sẻ kỷ niệm về một dịp lễ hội địa phương, ngày hội trường hoặc buổi tụ họp đông vui mà họ từng tham gia.': 'Invite one player to share a memory of a local festival, a school fair or a happy gathering they took part in.',
  'Mỗi người góp một từ khóa để cùng đặt một tên gọi vui cho đội chơi của mình trong hành trình khám phá bản đồ hôm nay.': 'Each player adds one keyword to make up a fun name for your team on today’s map journey.',
  'Hãy tìm quanh phòng một món đồ làm bằng gốm, sứ, gỗ hoặc mây tre và cùng đoán xem công đoạn nào khi làm món đồ đó cần nhiều sự tỉ mỉ nhất.': 'Find something in the room made of pottery, porcelain, wood or rattan and bamboo, and guess together which step in making it needs the most care.',
  'Nếu được tự vẽ hoa văn lên một chiếc cốc gốm tặng cho nhóm chơi hôm nay, mỗi người sẽ chọn vẽ hình ảnh gì?': 'If you could paint a pattern on a ceramic cup as a gift for today’s group, what would each of you paint?',
  'Mời một người kể về một món đồ thủ công hoặc vật dụng bền bỉ đã gắn bó lâu năm trong sinh hoạt thường ngày.': 'Invite one player to tell about a handmade item or a long-lasting object that has been part of their daily life for years.',
  'Hãy nhìn tên các món đặc sản trên thẻ tỉnh thành và chọn ra món ăn có tên gọi gợi sự tò mò nhất đối với bạn.': 'Look at the names of the specialities on the province cards and pick the dish whose name makes you most curious.',
  'Cả nhóm cùng kể nhanh tên 4 loại rau thơm hoặc gia vị tự nhiên thường tạo nên hương thơm đặc trưng cho món Việt.': 'Together, quickly name 4 herbs or natural spices that give Vietnamese dishes their signature aroma.',
  'Nếu thuận tiện, hãy rót mời người ngồi cạnh một ngụm nước mát và hỏi xem họ thích vị chua thanh, ngọt dịu hay đậm đà trong bữa ăn.': 'If convenient, pour the person next to you a sip of cool water and ask whether they prefer mildly sour, gently sweet or rich flavours in a meal.',
  'Một người vỗ tay một nhịp ngắn (như nhịp phách dân gian), những người cùng chơi lắng nghe rồi vỗ tay lặp lại đúng tiết tấu đó.': 'One player claps a short rhythm (like a folk clapper beat); the others listen, then clap exactly the same pattern back.',
  'Một người đọc 1 câu ca dao, tục ngữ hoặc lời bài hát quen thuộc có nhắc tới một vùng đất để mọi người cùng đoán hoặc đọc nối câu tiếp theo.': 'One player recites a folk verse, proverb or familiar song line that mentions a place, and the others guess the place or carry on with the next line.',
  'Cùng nhìn quanh nơi cả nhà đang ngồi (hoặc ảnh danh thắng trong khung ga) và chia sẻ chi tiết hoặc gam màu nào mang lại cảm giác bình yên nhất cho bạn.': 'Look around where the family is sitting (or at the landmark photo in the station frame) and share which detail or colour feels most peaceful to you.',
  'Hãy nhìn vị trí của tỉnh thành đang chọn trên bản đồ 3D (gần biển, đồng bằng hay miền núi) và đoán xem khí hậu nơi đó mùa này thế nào.': 'Look at where the chosen province sits on the 3D map (by the sea, on a plain or in the mountains) and guess what its weather is like this season.',
  'Nếu cả nhóm cùng thực hiện một chuyến tàu du lịch tới vùng đất này vào dịp cuối tuần, mỗi người sẽ mang theo một vật dụng gì?': 'If the whole group took a weekend train trip to this place, what one thing would each of you bring?',
  'Mỗi người chia sẻ một địa danh trên dải đất chữ S mà mình từng nghe tên qua sách báo, âm nhạc hoặc lời kể của bạn bè.': 'Each player shares a place in S-shaped Vietnam that they have heard of through books, music or friends’ stories.',
  'Hãy tìm xung quanh phòng một đồ vật được làm thủ công hoặc có họa tiết trang trí đẹp mắt và cùng nhận xét điểm khéo léo của món đồ đó.': 'Find a handmade object or one with a pretty pattern around the room, and together point out what makes it skilfully made.',
  'Nếu được học thử một nghề thủ công truyền thống trong một buổi chiều (như làm gốm, đan tre, làm bánh, vẽ tranh...), bạn muốn thử nghề nào nhất?': 'If you could try a traditional craft for one afternoon (pottery, bamboo weaving, cake making, painting...), which would you most like to try?',
  'Hai người cùng chơi phối hợp miêu tả các bước đơn giản để làm ra một món đồ thủ công hoặc món bánh quê mà cả hai cùng biết.': 'Two players team up to describe the simple steps for making a handicraft or a country cake they both know.',
  'Mời một người chia sẻ về một món ăn địa phương mà họ từng thưởng thức (hoặc muốn thử một lần), rồi gợi ý vùng đất tiếp theo trên bản đồ.': 'Invite one player to share a local dish they have tasted (or would like to try once), then suggest the next place on the map.',
  'Một người mô tả nguyên liệu chính và hương vị của một món ăn quê hương trong 3 câu ngắn để những người cùng chơi đoán tên món.': 'One player describes the main ingredients and flavour of a home-town dish in 3 short sentences for the others to guess the dish.',
  'Nếu được kết hợp đặc sản của vùng đất đang chọn với một món ăn quen thuộc hằng ngày, cả nhóm sẽ tạo ra món mới tên là gì?': 'If you combined a speciality of the chosen place with an everyday dish, what would the group call the new dish?',
  'Mời một người kể về một buổi biểu diễn văn nghệ, một làn điệu dân ca hoặc một bài hát gắn với kỷ niệm đẹp mà họ còn nhớ.': 'Invite one player to tell about a performance, a folk song or a song tied to a lovely memory they still keep.',
  'Mỗi người chọn một tính từ miêu tả âm thanh (như ngân vang, êm đềm, rộn ràng...) phù hợp nhất với vùng đất đang khám phá.': 'Each player picks a word for a sound (ringing, gentle, lively...) that best suits the place you are exploring.',
  'Hãy dành tặng người vừa đọc câu hỏi hoặc trả lời câu đố một tràng vỗ tay khích lệ nhẹ nhàng.': 'Give the person who just read the question or answered the riddle a gentle round of encouraging applause.',
  'Mời một người nhắc tới một danh thắng, ngọn núi hoặc bãi biển mà họ từng đi qua (hoặc mong muốn ghé thăm), rồi chọn điểm đến tiếp theo trên bản đồ.': 'Invite one player to mention a landmark, mountain or beach they have been to (or would like to visit), then choose the next destination on the map.',
  'Trong 15 giây, cả nhóm cùng liệt kê 3 hoạt động vui khỏe thường có trong các dịp hội xuân hoặc chuyến dã ngoại chung.': 'In 15 seconds, list together 3 fun, healthy activities often found at spring festivals or group outings.',
  'Một người chọn thầm một địa danh nổi tiếng trên bản đồ Việt Nam và đưa ra 2 gợi ý về miền đất đó để mọi người cùng tìm trên bản đồ.': 'One player secretly picks a famous place on the map of Vietnam and gives 2 clues about that region for everyone to find it on the map.',
  'Một người diễn tả động tác của một nghề truyền thống (như dệt vải, chằm nón, xoay bàn gốm, đánh cá...) để mọi người đoán tên nghề.': 'One player acts out the movements of a traditional trade (weaving cloth, stitching a palm-leaf hat, throwing pottery, fishing...) for the others to guess the trade.',
  'Mời một người chia sẻ về một sản vật địa phương hoặc món quà quê mà họ thường thấy mọi người mua làm quà sau mỗi chuyến đi.': 'Invite one player to share a local product or home-town gift they often see people buy as presents after a trip.',
  'Hãy gửi một lời cảm ơn ngắn gọn tới người đang giữ lượt vì đã cùng cả nhóm mở thêm một trạm dừng mới trên bản đồ.': 'Send a short thank-you to the player whose turn it is for opening a new stop on the map with the group.',
  'Mọi người cùng giữ yên lặng trong 10 giây để lắng nghe và gọi tên 2 âm thanh tự nhiên đang có xung quanh nơi mình ngồi.': 'Everyone stays quiet for 10 seconds to listen, then names 2 natural sounds around where you are sitting.',
  'Một người ngân nga giai điệu một bài hát quen thuộc (không hát lời) trong 10 giây để những người cùng chơi đoán tên bài hát hoặc chủ đề bài hát.': 'One player hums the tune of a familiar song (without the words) for 10 seconds while the others guess its title or theme.',
  'Mỗi người nhắc tên một nhạc cụ truyền thống Việt Nam mà mình biết (như đàn bầu, đàn tranh, sáo trúc, trống...) sao cho không trùng với người trước.': 'Each player names a traditional Vietnamese instrument they know (đàn bầu, đàn tranh, bamboo flute, drum...) without repeating the one before.',
  'Mời một người chia sẻ về một món chè, món bánh hoặc món nước mà họ thích nhất khi đi du lịch hoặc ở quê nhà, rồi gợi ý một địa danh tiếp theo.': 'Invite one player to share their favourite sweet soup, cake or drink from their travels or from home, then suggest the next place.',
  'Nếu cả nhóm cùng mở một quán chè nhỏ theo mùa, mỗi người hãy đề xuất một nguyên liệu tự nhiên (hạt sen, nhãn lồng, đậu xanh, gừng ấm...) để tạo thành món chè chung.': 'If the group opened a small seasonal sweet-soup stall together, each player suggests one natural ingredient (lotus seeds, longans, mung beans, warm ginger...) for a shared bowl.',
  'Hãy hỏi người ngồi cạnh xem hôm nay họ thích đồ ăn thanh mát hay ấm nóng, và dành tặng họ một lời chúc sức khỏe nhẹ nhàng.': 'Ask the person next to you whether they feel like something cool and fresh or something warm today, and offer them a gentle wish for good health.',
  'Nếu được lồng một câu ngắn (4 đến 6 chữ) vào chiếc nón kỷ niệm của buổi chơi hôm nay, bạn sẽ chọn những chữ gì?': 'If you could tuck a short phrase (4 to 6 words) into a souvenir conical hat from today’s game, which words would you choose?',
  'Hãy quan sát ánh sáng trong căn phòng hiện tại và chỉ ra một góc có ánh sáng dịu mắt hoặc ấm áp nhất.': 'Look at the light in the room right now and point out the corner where it feels softest or warmest.',
  'Mời một người kể về một món quà lưu niệm thủ công (như chiếc nón, chiếc quạt, cành hoa giấy, bức tranh...) mà họ từng thấy hoặc từng tặng ai đó.': 'Invite one player to tell about a handmade souvenir (a conical hat, a fan, a paper flower, a painting...) they have seen or given to someone.',
  'Mời một người nhắc tới một dòng sông, bến nước hoặc vùng biển đảo mà họ từng ghé qua (hoặc muốn đến), rồi mời họ chọn trạm tiếp theo trên bản đồ.': 'Invite one player to mention a river, wharf or island they have visited (or want to visit), then ask them to choose the next stop on the map.',
  'Một người miêu tả ngắn gọn một cảnh đẹp sông nước ở Việt Nam mà không nói tên tỉnh để mọi người cùng đoán xem đó là vùng nào.': 'One player briefly describes a beautiful river scene in Vietnam without naming the province, and the others guess which region it is.',
  'Cả nhóm cùng kể nối tiếp 3 từ gợi nhớ vẻ đẹp của cố đô Huế (ví dụ: sông Hương, cầu Trường Tiền, nón bài thơ...).': 'Take turns adding 3 words that recall the beauty of the old capital Huế (for example: Perfume River, Trường Tiền Bridge, poem hat...).',
  'Mời một người chia sẻ về một vùng đất phương Nam hoặc một chuyến đi đáng nhớ của họ, rồi gợi ý điểm dừng tiếp theo trên bản đồ.': 'Invite one player to share about a place in the South or a memorable trip of theirs, then suggest the next stop on the map.',
  'Cả nhóm cùng chọn một bài hát quen thuộc về quê hương hoặc tuổi thơ và cùng đọc nhịp nhàng 2 câu đầu của bài hát đó.': 'Together, choose a familiar song about the homeland or childhood and recite its first 2 lines in rhythm.',
  'Một người mô tả âm thanh hoặc hình dáng của một nhạc cụ (như đàn tranh, đàn bầu, guitar...) để mọi người cùng đoán tên.': 'One player describes the sound or shape of an instrument (đàn tranh, đàn bầu, guitar...) for the others to guess its name.',
  'Mỗi người hãy chọn một sắc màu tươi tắn đang có trên màn hình bản đồ và nói xem màu đó gợi nhớ đến loài hoa hay loại quả nào dịp Tết.': 'Each player picks a bright colour on the map screen and says which Tết flower or fruit it brings to mind.',
  'Mời một người kể về một phiên chợ Tết, chợ quê hoặc khu phố nhộn nhịp mà họ từng ghé thăm và ghi dấu địa danh đó nếu muốn.': 'Invite one player to tell about a Tết market, a country market or a busy street they have visited, and mark that place if they wish.',
  'Mỗi thành viên hãy gửi một lời chúc ngắn gọn, tốt lành cho tuần mới tới người đang ngồi cạnh mình.': 'Each member sends a short, kind wish for the new week to the person sitting next to them.',
  'Mời một người kể về món ăn sáng quen thuộc nhất của mình hoặc một món ăn gắn với kỷ niệm, rồi mời họ chọn địa danh tiếp theo.': 'Invite one player to tell about their most familiar breakfast or a dish tied to a memory, then ask them to choose the next place.',
  'Một người nghĩ về một món ăn Việt Nam có dùng nước chấm đặc trưng và gợi ý hương vị bát nước chấm đó để mọi người đoán tên món ăn.': 'One player thinks of a Vietnamese dish with a signature dipping sauce and hints at the flavour of that sauce for the others to guess the dish.',
  'Cùng nhau liệt kê 3 món đặc sản từ 3 miền Bắc – Trung – Nam để ghép thành một “thực đơn du hành” trong mơ của cả nhóm.': 'Together, list 3 specialities from the North, Centre and South to make the group’s dream “travel menu”.',
  'Nếu cả nhóm cùng thiết kế một chiếc lồng đèn giấy kiếng cho buổi tối hôm nay, mọi người sẽ chọn hình dáng gì và phối những màu nào?': 'If the group designed a cellophane lantern together for this evening, what shape and colours would you choose?',
  'Hai người cùng dùng bàn tay tạo thành một hình ảnh đơn giản (ngôi sao, mái nhà, cánh chim...) để người còn lại đoán tên hình.': 'Two players use their hands to form a simple picture (a star, a roof, a bird’s wing...) for the others to guess.',
  'Hãy nhìn các quân cờ dân gian trong trò chơi và cho biết bạn thích kiểu dáng hoặc màu sắc của biểu tượng nào nhất.': 'Look at the folk game pieces and say which one’s shape or colour you like best.'
};

// ---- Verse glosses: the six-eight verses stay Vietnamese, an English line gives their meaning.
exports.VERSE_GLOSS = {
  // FOLK_VERSES_BY_ID in the page.
  byId: {
    hn: 'Thăng Long, a thousand years of learning; the scent of lotus and new cốm warms the hearts of loved ones.',
    hue: 'The Perfume River flows gently; court music lingers on the steps of the old capital.',
    hcm: 'Bustling wharves from dawn to noon; a generous kindness that never fades in sun or rain.',
    'hoang-sa': 'Waves break on far-off Hoàng Sa; the sovereignty marker, engraved for all time.',
    'truong-sa': 'Trường Sa, wide sea and high sky; the phong ba tree stands proud at the frontier.'
  },
  // No station.
  none: 'Our beloved homeland of three regions; every land opens up so much kindness.',
  // getFolkVerseForPlace's verse for every other station.
  template: 'A visit to dear {place}; remembering {landmark}, longing for {cuisine}.',
  landmarkFallback: 'its beautiful sights',
  cuisineFallback: 'the taste of home'
};

// ---- Map geography (plan point 7): neighbouring countries, the sea, archipelagos and island features.
// Names keep their Vietnamese spelling; only the feature word is translated ("Đảo Phú Quốc" → "Phú Quốc Island").
exports.GEO = {
  exact: {
    'LÀO': 'LAOS', 'CAMPUCHIA': 'CAMBODIA', 'THÁI LAN': 'THAILAND', 'TRUNG QUỐC': 'CHINA',
    'BIỂN ĐÔNG': 'BIỂN ĐÔNG (EAST SEA)', 'Biển Đông': 'Biển Đông (East Sea)',
    'QUẦN ĐẢO HOÀNG SA': 'HOÀNG SA (PARACEL) ISLANDS', 'QUẦN ĐẢO TRƯỜNG SA': 'TRƯỜNG SA (SPRATLY) ISLANDS',
    'Quần đảo Hoàng Sa': 'Hoàng Sa (Paracel) Islands', 'Quần đảo Trường Sa': 'Trường Sa (Spratly) Islands',
    // Unnamed land and reefs in the island chart ("Đất nổi · 16.5°N · 111.6°E").
    'Đất nổi': 'Land', 'Rạn': 'Reef'
  },
  // Feature word in front of a name → English word after it. Only the first word is translated: "Đảo Cồn Cỏ" →
  // "Cồn Cỏ Island". Names written with Hòn / Cù Lao stay as they are.
  prefixes: [['Quần đảo', 'Islands'], ['QUẦN ĐẢO', 'ISLANDS'], ['Đảo', 'Island'], ['ĐẢO', 'ISLAND'], ['Cồn', 'Cay'], ['Đá', 'Reef'], ['Bãi', 'Bank'], ['Rạn', 'Reef']]
};
