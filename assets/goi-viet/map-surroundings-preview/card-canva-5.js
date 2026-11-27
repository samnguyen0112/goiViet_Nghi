/* P5-06 (2026-11-21): the back of the group's Canva cards (Canva design by Nghi Phương), on the web.
   One card per deck below has the Canva content: the card whose label matches the Canva cover (Văn hóa for 12 decks,
   Nét đẹp for Cần Thơ and An Giang, Địa danh for Đà Nẵng). Instead of A/B/C it asks one open question for locals
   ("Người địa phương") and one for visitors ("Không phải người địa phương"); the challenge under each question opens on
   the connection face, before the card's own activities. The other three cards of each deck keep the web questions.
   Text is the Canva text. Only obvious slips were fixed (sồng → sống, búng tráng → búng trán, thương trộm nhớ →
   thương thầm nhớ trộm, "một 1", missing or stray quotes and question marks, the film title "Vĩ tuyến 17 ngày và đêm"),
   and two Huế lines name what the web shows ("mặt bìa" for the photo side, "danh sách sau" for the hidden list).
   English and the answer hints ("hint") were written for the web and should be checked by the group. Gaps left as in Canva: the two Hà Nội
   questions are the same, the Quảng Trị visitor challenge ends mid-sentence, Huế (visitor) and An Giang (visitor)
   have no challenge, so those cards start with their own activities. */
(function () {
  'use strict';
  const CARDS = {
    'hn-c2': {
      local: {
        q: { vi: 'Theo bạn, điều gì làm nên nét đặc trưng của người Tràng An / người Hà Nội?', en: 'What do you think makes the people of Tràng An – Hà Nội – who they are?' },
        act: { vi: 'Vòng tròn: hỏi người chơi rằng Hà Nội có sáp nhập với tỉnh nào không? Nếu câu trả lời sai, người chơi phải thực hiện theo yêu cầu của mọi người.', en: 'Round the circle: ask each player whether Hà Nội was merged with another province. Whoever answers wrong does what everyone asks.' },
        hint: { vi: 'Vòng tròn: Hà Nội không sáp nhập với tỉnh nào trong đợt sắp xếp năm 2025.', en: 'The circle: Hà Nội was not merged with any province in the 2025 reorganisation.' },
      },
      visitor: {
        q: { vi: 'Theo bạn, điều gì làm nên nét đặc trưng của người Tràng An / người Hà Nội?', en: 'What do you think makes the people of Tràng An – Hà Nội – who they are?' },
        act: { vi: 'Vòng tròn: hỏi người chơi rằng Hà Nội có sáp nhập với tỉnh nào không? Nếu câu trả lời sai, người chơi phải thực hiện theo yêu cầu của mọi người.', en: 'Round the circle: ask each player whether Hà Nội was merged with another province. Whoever answers wrong does what everyone asks.' },
        hint: { vi: 'Vòng tròn: Hà Nội không sáp nhập với tỉnh nào trong đợt sắp xếp năm 2025.', en: 'The circle: Hà Nội was not merged with any province in the 2025 reorganisation.' },
      },
    },
    'th-c2': {
      local: {
        q: { vi: 'Theo bạn, giọng nói người Thanh Hóa khác biệt như thế nào? Hãy minh họa bằng một câu chuyện hoặc cách nói đặc trưng.', en: 'How is the Thanh Hóa accent different? Show it with a story or a typical way of saying things.' },
        act: { vi: 'Cả vòng thử nói theo giọng Thanh Hóa, ai nói không giống nhất sẽ phải đấm lưng cho 2 người bên cạnh.', en: 'Everyone tries the Thanh Hóa accent; whoever sounds least like it gives the two people beside them a back rub.' },
      },
      visitor: {
        q: { vi: 'Món đặc sản có vị chua nhẹ, thường được gói bằng lá chuối và được nhiều người mua làm quà khi đến Thanh Hóa là gì?', en: 'Which mildly sour speciality, wrapped in banana leaves, do visitors to Thanh Hóa often buy as a gift?' },
        act: { vi: 'Nếu trả lời đúng, bạn được next lượt, nếu trả lời sai, kể tên một món đặc sản quê bạn và hứa sẽ mua cho người bên trái ăn.', en: 'Right: your turn is done. Wrong: name a speciality from your hometown and promise to buy it for the person on your left.' },
        hint: { vi: 'Nem chua Thanh Hóa.', en: 'Thanh Hóa nem chua (fermented pork rolls).' },
      },
    },
    'hcm-c1': {
      local: {
        q: { vi: 'Kể về nơi bạn thường tụ tập cùng bạn bè ngày trước. Sau đó, hỏi người trẻ nhất bàn về địa điểm tụ tập yêu thích của họ.', en: 'Tell us where you used to hang out with friends. Then ask the youngest at the table about their favourite hangout.' },
        act: { vi: 'Người trẻ nhất bàn chọn một địa điểm tụ tập yêu thích và rủ cả bàn cùng đến đó!', en: 'The youngest at the table picks a favourite hangout and invites everyone to go there together!' },
      },
      visitor: {
        q: { vi: 'Kể tên 3 món đi từ Sài Gòn về Sài Gòn mà vẫn được tính là đặc sản tỉnh khác?', en: 'Name 3 dishes you can find all over Sài Gòn that still count as another province’s speciality.' },
        act: { vi: 'Nếu bạn không trả lời được thì phải làm tour guide dẫn cả bàn đi 2 nơi hoặc thử 2 điều theo mặt trước lá bài.', en: 'If you can’t, be the tour guide: take the table to 2 places, or try 2 things shown on the front of the card.' },
        hint: { vi: 'Ví dụ: bún bò Huế, mì Quảng, hủ tiếu Mỹ Tho, bánh canh Trảng Bàng.', en: 'For example: bún bò Huế, mì Quảng, hủ tiếu Mỹ Tho, bánh canh Trảng Bàng.' },
      },
    },
    'dn-c3': {
      local: {
        q: { vi: 'Hãy phân biệt cao lầu và mì Quảng, và so sánh mì Quảng quê mình với thành phố hiện tại bạn đang sống khác nhau gì.', en: 'Tell cao lầu from mì Quảng, then compare the mì Quảng back home with the one in the city where you live now.' },
        act: { vi: 'Vòng tròn: Lần lượt kể nguyên liệu của Mì Quảng. Ai làm vòng tròn dừng lại sẽ dẫn người lớn tuổi nhất đi ăn Mì Quảng!', en: 'Round the circle: name the ingredients of mì Quảng one by one. Whoever breaks the chain takes the eldest out for mì Quảng!' },
        hint: { vi: 'Cao lầu là món riêng của Hội An, sợi vàng và dai, ăn gần như khô; mì Quảng sợi to, bản dẹt, chan ít nước dùng.', en: 'Cao lầu belongs to Hội An: chewy golden noodles served almost dry. Mì Quảng has wide flat noodles with a little broth.' },
      },
      visitor: {
        q: { vi: 'Bãi biển đẹp nhất hành tinh là bãi biển nào?', en: 'Which beach is the most beautiful on the planet?' },
        act: { vi: 'Nếu bạn trả lời sai, bạn phải tập nói giọng miền Trung trong vòng 10 phút, nếu bạn nói không giống, bạn sẽ phải rửa chén/dọn dẹp cho vòng tròn.', en: 'Wrong answer: speak with a Central accent for 10 minutes. If it doesn’t sound right, you wash up or tidy up for the circle.' },
        hint: { vi: 'Bãi biển Mỹ Khê, thuộc dải bờ biển Đà Nẵng được tạp chí Forbes giới thiệu năm 2005 dưới tên “China Beach”.', en: 'Mỹ Khê Beach, part of the Đà Nẵng coastline that Forbes featured in 2005 as “China Beach”.' },
      },
    },
    'hue-c1': {
      local: {
        coverDescriptions: {
          vi: [
            'Trên trái: Người đội nón và người mặc áo lễ bên bàn thắp nến.',
            'Trên giữa: Lối đi bằng đá dẫn tới cổng lớn có nhiều tầng mái.',
            'Trên phải: Cổng đỏ mái ngói mở vào sân có cây và đèn lồng.',
            'Giữa trái: Lớp bột vàng giòn phủ tôm và thịt băm, bên cạnh có rau xanh.',
            'Giữa phải: Nhóm người mặc áo lễ nhiều màu, cầm nhạc cụ trước cửa đỏ.',
            'Dưới trái: Dãy nhà sáng màu và lầu tròn trên sườn đồi có nhiều cây.',
            'Dưới giữa: Cầu thép nhiều nhịp bắc qua sông lúc hoàng hôn.',
            'Dưới phải: Tô nước dùng đỏ với sợi trắng, thịt thái lát và rau thơm.',
          ],
          en: [
            'Top left: A person in a conical hat and people in ceremonial robes beside a candlelit table.',
            'Top centre: A stone walkway leads to a grand gate with several tiers of roofs.',
            'Top right: A red tiled gate opens onto a courtyard with trees and lanterns.',
            'Middle left: Crisp golden batter topped with shrimp and minced meat, with greens beside it.',
            'Middle right: A group in colourful ceremonial robes holds instruments in front of red doors.',
            'Bottom left: Pale buildings and a round pavilion on a wooded hillside.',
            'Bottom centre: A steel bridge with several spans crosses a river at sunset.',
            'Bottom right: A bowl of red broth with white noodles, sliced meat and herbs.',
          ],
        },
        q: { vi: 'Hãy quan sát mặt bìa lá bài, nếu đoán đúng hết bạn có quyền búng trán nguyên vòng tròn.', en: 'Look closely at the cover of the card and guess what its photos show. Get them all right and you may flick the whole circle’s foreheads.' },
        act: { vi: 'Nếu đoán không đúng trên 4 cái, bạn hãy kể về kỷ niệm đau buồn với người bạn từng thương thầm nhớ trộm với 1 địa điểm trên.', en: 'If you miss more than 4, tell a sad memory with someone you once secretly loved, at one of the places above.' },
      },
      visitor: {
        q: { vi: 'Hãy đọc danh sách sau sao cho không ai nghe và không ai thấy rồi diễn tả cho mọi người đoán được.', en: 'Read the list below so that nobody hears or sees it, then act it out until everyone guesses.' },
        secret: { vi: ['Bánh bột lọc', 'Cơm hến', 'Bánh ép'], en: ['Bánh bột lọc (tapioca dumplings)', 'Cơm hến (baby clam rice)', 'Bánh ép (pressed crispy cake)'] },
      },
    },
    'ct-c4': {
      local: {
        q: { vi: 'Kể tên đặc sản, điểm nổi bật từ Cần Thơ, Hậu Giang và Sóc Trăng.', en: 'Name specialities and highlights of Cần Thơ, Hậu Giang and Sóc Trăng.' },
        act: { vi: 'Nếu bạn kể được tất cả 3 tỉnh thành, bạn có thể kể 3 điểm xấu của người bên phải, còn nếu không thì người bên phải có quyền kể 3 điểm xấu của bạn.', en: 'Covered all 3? You may name 3 flaws of the person on your right. If not, they get to name 3 of yours.' },
      },
      visitor: {
        q: { vi: 'Vòng tròn chia thành 2 đội, mỗi đội lần lượt kể nguyên liệu thành phần trong lẩu mắm.', en: 'Split the circle into 2 teams; take turns naming the ingredients of lẩu mắm (fermented fish hotpot).' },
        act: { vi: 'Team nào thua phải dẫn team còn lại đi ăn lẩu mắm.', en: 'The losing team treats the other team to lẩu mắm.' },
      },
    },
    'bn-c2': {
      local: {
        q: { vi: 'Ngôi làng nào từ xưa nổi tiếng với nghề nấu rượu truyền thống, gắn với giai thoại “rượu tiến vua” và câu nói “vua biết mặt, chúa biết tên”?', en: 'Which village has long been famous for its traditional rice wine, linked to the tale of “wine offered to the king” and the saying “known by face to the king, by name to the lords”?' },
        act: { vi: 'Không biết? Chuyển lượt quanh vòng tròn. Ai trả lời đúng, bạn phải đút người đó ăn!', en: 'Don’t know? Pass it round the circle. Whoever gets it right, you feed them a bite!' },
        hint: { vi: 'Làng Vân (Vân Hà, Việt Yên, Bắc Giang cũ) với rượu làng Vân.', en: 'Vân village (Vân Hà, Việt Yên, formerly Bắc Giang) and its làng Vân rice wine.' },
      },
      visitor: {
        q: { vi: '“Yêu nhau cởi áo ối à trao nhau\nVề nhà dối rằng cha dối mẹ a ối a\nRằng a ối a là qua cầu\nTình tình tình gió bay\nTình tình tình gió bay.”\nBài hát này thuộc thể loại gì?', en: '“Yêu nhau cởi áo ối à trao nhau\nVề nhà dối rằng cha dối mẹ a ối a\nRằng a ối a là qua cầu\nTình tình tình gió bay\nTình tình tình gió bay.”\nWhat kind of song is this?' },
        act: { vi: 'Nếu bạn không trả lời được, bạn và 2 người nhỏ tuổi nhất phải hát bài Bắc Bling của Hòa Minzy.', en: 'Can’t answer? You and the 2 youngest sing “Bắc Bling” by Hòa Minzy.' },
        hint: { vi: 'Dân ca quan họ Bắc Ninh (bài “Qua cầu gió bay”).', en: 'Bắc Ninh quan họ folk song (“Qua cầu gió bay”).' },
      },
    },
    'ag-c4': {
      local: {
        q: { vi: '“An Giang – xứ sở thần tiên” gắn với nhiều câu chuyện tâm linh. Vì sao lại có câu nói này?', en: '“An Giang, land of immortals” is tied to many spiritual tales. Why do people say this?' },
        act: { vi: 'Lần lượt kể một điều bạn biết hoặc đã nghe về An Giang. Ai không kể được sẽ phải đăng story khen một người trong nhà với nội dung do cả vòng duyệt trước.', en: 'Take turns sharing something you know or have heard about An Giang. Whoever runs out posts a story praising a family member, wording approved by the circle.' },
      },
      visitor: {
        q: { vi: 'Theo bạn, An Giang có những món đặc sản nào? Kể tên một món mà bạn muốn thử nhất! Đồng thời hãy phân biệt cơm tấm Long Xuyên và cơm tấm nơi bạn ở có gì khác nhau cho mọi người cùng nghe nhé!', en: 'Which specialities does An Giang have? Name the one you most want to try! Then tell everyone how Long Xuyên broken rice differs from the one where you live.' },
      },
    },
    'dl-c2': {
      local: {
        q: { vi: '“Hàng vạn cột đá hình lục giác, hình vuông hoặc tròn xếp khít lên nhau như những chiếc đĩa hay tổ ong khổng lồ vươn ra biển” đang miêu tả địa danh nào?', en: '“Thousands of hexagonal, square or round stone columns packed together like giant plates or a honeycomb reaching into the sea”: which place is this?' },
        act: { vi: 'Trả lời sai? Gọt trái cây hoặc chuẩn bị món ăn nhẹ cho mọi người!', en: 'Wrong? Peel some fruit or make a snack for everyone!' },
        hint: { vi: 'Gành Đá Đĩa (Phú Yên cũ, nay thuộc Đắk Lắk).', en: 'Gành Đá Đĩa, in the former Phú Yên Province, now part of Đắk Lắk.' },
      },
      visitor: {
        q: { vi: 'Ở Đắk Lắk, một gia đình người ... vừa chào đón một em bé. Đố bạn: theo phong tục mẫu hệ, em bé sẽ mang họ của ai — bố hay mẹ?', en: 'In Đắk Lắk, a “…” family has just welcomed a baby. Under the matrilineal custom, whose family name does the baby take: the father’s or the mother’s?' },
        act: { vi: 'Nếu trả lời đúng thì hãy điền vào ... là người gì?', en: 'If you got it right, fill in the “...”: which people is it?' },
        hint: { vi: 'Họ mẹ. Chỗ trống có thể là người Ê Đê hoặc M’nông, các dân tộc theo chế độ mẫu hệ.', en: 'The mother’s. The blank can be the Ê Đê or M’nông, peoples with matrilineal customs.' },
      },
    },
    'nb-c2': {
      local: {
        q: { vi: '“Ở vùng đất này có một loại hình nghệ thuật dân gian gắn với trống và múa, thường xuất hiện trong các lễ hội lớn. Bạn có biết tên gọi của nó không?”', en: 'This land has a folk art of drums and dance, often seen at big festivals. Do you know its name?' },
        act: { vi: 'Cả nhà tìm hiểu về màn trình diễn này.\nTập vỗ tay theo nhịp trống trong 15s.', en: 'Look the performance up together, then clap along to the drum beat for 15 seconds.' },
      },
      visitor: {
        q: { vi: '“Thuyền con soi bóng dặm ngàn núi sông.\nMây trời xa cũng chung dòng thế gian.”\nĐó là đâu?', en: '“A little boat mirrors a thousand miles of mountains and rivers.\nThe far-off clouds share the same stream of the world.”\nWhere is this?' },
        act: { vi: 'Chọn 2 người đóng vai “người chèo đò”. Trong 45 giây, mỗi người phải miêu tả cảnh vật xung quanh để cả nhà tưởng tượng đang ngồi trên thuyền. Ai miêu tả hay hơn được cả nhà khiêng kiệu đi một vòng.', en: 'Pick 2 people to play “boat rowers”. In 45 seconds each describes the scenery so the family feels they are on the boat. The better one gets carried around like royalty.' },
      },
    },
    'pt-c2': {
      local: {
        q: { vi: '“Có một loại hát đối đáp rất mộc mạc, thường vang lên vào mùa xuân, được UNESCO công nhận. Đó là gì?”', en: 'A simple call-and-response singing heard every spring, recognised by UNESCO. What is it?' },
        act: { vi: 'Cả nhà cùng tìm 1 đoạn hát này và tập hát theo đúng 1 câu.', en: 'Find a clip of it together and learn to sing one line.' },
        hint: { vi: 'Hát Xoan Phú Thọ (di sản UNESCO).', en: 'Xoan singing of Phú Thọ (UNESCO heritage).' },
      },
      visitor: {
        q: { vi: '“Có một hồ nước lớn nằm giữa núi, mùa nước dâng trông như biển, mùa cạn lộ ra những tảng đá kỳ lạ. Tên hồ là gì?”', en: 'A large lake among the mountains looks like a sea when the water is high and shows strange rocks when it is low. What is it called?' },
        act: { vi: 'Mỗi người kể một kỷ niệm đi chơi (riêng hoặc chung) mà “không ngờ nơi đó lại đẹp/lạ đến thế”. Người có câu chuyện khiến cả nhà ngạc nhiên nhất được quyền chọn địa điểm đi chơi tiếp theo.', en: 'Everyone shares a trip (alone or together) where “I never thought it would be so beautiful or strange”. The most surprising story picks the next outing.' },
      },
    },
    'qng-c2': {
      local: {
        q: { vi: '“Món don là món gì?”', en: 'What is “món don”?' },
        act: { vi: 'Ai trả lời chậm nhất phải rửa bát bữa ăn hôm nay.', en: 'The slowest to answer washes the dishes today.' },
        hint: { vi: 'Món nấu từ con don, loài giống hến nhỏ ở sông Trà Khúc, thường ăn kèm bánh tráng.', en: 'A dish of don, a tiny clam-like shellfish from the Trà Khúc river, usually eaten with toasted rice paper.' },
      },
      visitor: {
        q: { vi: '“Lý Sơn là một đảo nhỏ ngoài khơi Quảng Ngãi, nổi tiếng với tỏi và đất núi lửa đen. Ai có tiềm năng là người đánh bắt cá giỏi nhất?”', en: '“Lý Sơn is a small island off Quảng Ngãi, famous for garlic and black volcanic soil. Who has what it takes to be the best fisher?”' },
        act: { vi: 'Mỗi người kể 1 kỹ năng đặc biệt của thành viên này mà mọi người rất trân trọng.', en: 'Everyone names one special skill of that person that the family truly values.' },
      },
    },
    'qn-c2': {
      local: {
        q: { vi: '“Nếu phải chọn một hình ảnh để đại diện cho con người nơi đây, bạn sẽ chọn hình ảnh nào?”', en: 'If you had to pick one image to stand for the people here, what would it be?' },
        act: { vi: 'Người nói từ khiến cả nhà đồng ý nhất được quyền chọn bài hát cả nhà cùng hát.', en: 'Whoever’s word the family agrees with most picks a song for everyone to sing.' },
      },
      visitor: {
        q: { vi: '“Món hải sản có lớp vỏ cứng, thịt ngọt, thường được hấp hoặc nướng, rất nổi tiếng ở vùng vịnh. Tên gọi của món này là gì?”', en: 'A hard-shelled seafood with sweet meat, usually steamed or grilled, famous around the bay. What is it called?' },
        act: { vi: 'Người kể ra được tên đúng và nhanh nhất sẽ được miễn việc nhà hôm nay.', en: 'The first to name it correctly is excused from chores today.' },
      },
    },
    'qt-c2': {
      local: {
        q: { vi: '“Các hang động ở Phong Nha - Kẻ Bàng tổng chiều dài khoảng hơn 80 km nhưng các nhà thám hiểm hang động Anh và Việt Nam mới chỉ thám hiểm ... km”', en: '“The caves of Phong Nha – Kẻ Bàng are over about 80 km long in total, but British and Vietnamese cavers have explored only ... km”' },
        act: { vi: 'Người nói đoán đúng được cả nhà đấm lưng cho.', en: 'Whoever guesses the number gets a back rub from the family.' },
        hint: {
          vi: '259 km đã được khảo sát trong 473 hang thuộc Vườn quốc gia Phong Nha – Kẻ Bàng, theo tổng hợp đến năm 2026. Mốc hơn 80 km là số liệu của riêng hệ thống động Phong Nha trong tài liệu trước đây. Nguồn: Ban Quản lý Vườn quốc gia Phong Nha – Kẻ Bàng, “Kết quả khảo sát hang động khu vực Phong Nha – Kẻ Bàng”.',
          en: 'By 2026, surveys covered 259 km across 473 caves in Phong Nha – Kẻ Bàng National Park. The older figure of over 80 km refers to the Phong Nha cave system alone. Source: Phong Nha – Kẻ Bàng National Park Management Board, “Cave survey results for the Phong Nha – Kẻ Bàng area”.',
        },
      },
      visitor: {
        q: { vi: 'Vĩ tuyến 17 ngày và đêm là một bộ phim kinh điển trong thời kỳ kháng chiến chống Mỹ. Bối cảnh phim diễn ra ở đâu?', en: '“Vĩ tuyến 17 ngày và đêm” (The 17th Parallel, Day and Night) is a classic film of the resistance war against the US. Where is it set?' },
        act: { vi: 'Chơi 1 vòng game Bắc cầu nối chữ, người thắng cuối cùng sẽ được…', en: 'Play a round of word chain; the final winner gets…' },
        hint: { vi: 'Đôi bờ sông Bến Hải (cầu Hiền Lương), Quảng Trị.', en: 'Both banks of the Bến Hải river (Hiền Lương bridge), Quảng Trị.' },
      },
    },
    'sl-c2': {
      local: {
        q: { vi: '“Người Thái có một điệu múa vòng tròn rất vui, thường nhảy trong các ngày lễ hội. Tên điệu múa là gì?”', en: 'The Thái people have a joyful circle dance for festival days. What is it called?' },
        act: { vi: 'Cả nhà cùng đứng dậy tập 1 động tác xòe đơn giản. Ai làm đúng và vui nhất được quyền “ban rượu cần” (nước lọc) cho mọi người theo nghi thức vui.', en: 'Stand up and learn one simple xòe step. The best and happiest dancer gets to “serve rượu cần” (water) to everyone in a playful ritual.' },
        hint: { vi: 'Múa xòe (Nghệ thuật Xòe Thái, UNESCO ghi danh năm 2021).', en: 'Xòe dance (the Art of Xòe Thái, UNESCO-listed in 2021).' },
      },
      visitor: {
        q: { vi: '“Có một cao nguyên nổi tiếng với đồi chè, rừng thông và mùa hoa ban trắng xóa. Tên cao nguyên là gì?”', en: 'A plateau famous for tea hills, pine forests and a season of white ban flowers. What is it called?' },
        act: { vi: 'Mỗi người kể một kỷ niệm đi chơi mà quên mang một thứ quan trọng. Người có câu chuyện hài nhất được quyền chọn địa điểm đi chơi tiếp theo.', en: 'Everyone tells of a trip where they forgot something important. The funniest story picks the next outing.' },
        hint: { vi: 'Cao nguyên Mộc Châu.', en: 'The Mộc Châu plateau.' },
      },
    },
  };

  const ROLES = ['local', 'visitor'];
  const ROLE_KEY = { local: 'canva.role.local', visitor: 'canva.role.visitor' };
  const TAB_KEY = { local: 'canva.tab.local', visitor: 'canva.tab.visitor' }; // short labels on the card's tabs
  const byId = id => document.getElementById(id);
  const lang = () => (window.GoiVietI18n ? window.GoiVietI18n.lang() : 'vi');
  const T = (key, vars) => (window.GoiVietI18n ? window.GoiVietI18n.t(key, vars) : key);
  const pick = value => (value ? value[lang()] || value.vi : '');
  const has = card => Boolean(card && Object.prototype.hasOwnProperty.call(CARDS, card.id));
  const roles = new Map();   // the side chosen for each card in this session
  const secretOpen = new Set();
  const roleOf = card => roles.get(card.id) || 'local';
  const entry = (card, role = roleOf(card)) => CARDS[card.id][role];

  function questionFor(card, role = roleOf(card)) { return has(card) && entry(card, role) ? pick(entry(card, role).q) : null; }
  function question(card) { return questionFor(card); }
  function hintFor(card, role = roleOf(card)) { return has(card) && entry(card, role)?.hint ? pick(entry(card, role).hint) : ''; }
  function secretFor(card, role = roleOf(card)) { return has(card) && entry(card, role)?.secret ? pick(entry(card, role).secret) : null; }
  const coverDescriptionsFor = (card, role = roleOf(card)) => (has(card) && entry(card, role)?.coverDescriptions && pick(entry(card, role).coverDescriptions)) || [];
  const coverDescriptions = card => coverDescriptionsFor(card);
  // The Canva challenge for the chosen side, or null (then the card's own activities are used).
  function activityFor(card, role = roleOf(card)) {
    if (!has(card) || !entry(card, role).act) return null;
    return { text: pick(entry(card, role).act), vi: entry(card, role).act.vi, role, kind: T('canva.challenge', { role: T(ROLE_KEY[role]) }) };
  }
  const activity = card => activityFor(card);

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function setRole(card, role) {
    if (!ROLES.includes(role) || roleOf(card) === role) return;
    roles.set(card.id, role);
    if (typeof window.onCanvaRoleChange === 'function') window.onCanvaRoleChange(card);
    render(card);
    window.GoiVietCardTable?.render(card);
    const button = document.querySelector(`[data-canva-role="${role}"]`);
    if (button) button.focus();
  }

  function roleSwitch(card) {
    const wrap = el('div', 'canva-roles');
    wrap.setAttribute('role', 'radiogroup');
    wrap.setAttribute('aria-label', T('canva.rolePrompt'));
    ROLES.forEach(role => {
      const button = el('button', 'canva-role', T(TAB_KEY[role]));
      button.type = 'button';
      button.setAttribute('aria-label', T(ROLE_KEY[role]));
      button.dataset.canvaRole = role;
      button.setAttribute('role', 'radio');
      const on = roleOf(card) === role;
      button.setAttribute('aria-checked', String(on));
      button.tabIndex = on ? 0 : -1;
      button.addEventListener('click', () => setRole(card, role));
      button.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
        event.preventDefault();
        setRole(card, role === 'local' ? 'visitor' : 'local');
      });
      wrap.append(button);
    });
    return wrap;
  }

  // Shows (or removes) the Canva question face. Called by renderActiveCard and after a language change.
  function render(card, place = typeof getDeckPlace === 'function' ? getDeckPlace() : null) {
    const front = byId('cardFrontState');
    const questionEl = byId('cardQuestionText');
    if (!front || !questionEl) return false;
    const standard = [byId('cardOptionsList'), byId('cardHintBox'), byId('cardSelectHint')?.parentElement].filter(Boolean);
    const on = has(card);
    front.classList.toggle('is-canva-card', on);
    standard.forEach(node => { node.style.display = on ? 'none' : ''; });
    questionEl.classList.toggle('canva-question', on);
    byId('canvaCardTop')?.remove();
    byId('canvaCardBottom')?.remove();
    if (!on) return false;
    const data = entry(card);

    const top = el('div', 'canva-card-top');
    top.id = 'canvaCardTop';
    top.append(el('p', 'canva-prompt', T('canva.rolePrompt')), roleSwitch(card));
    questionEl.before(top);
    questionEl.textContent = pick(data.q);

    const bottom = el('div', 'canva-card-bottom');
    bottom.id = 'canvaCardBottom';
    if (data.secret) {
      const open = secretOpen.has(card.id);
      const box = el('div', 'canva-secret');
      const toggle = el('button', 'btn-lg btn-secondary canva-secret-toggle', T(open ? 'canva.secretHide' : 'canva.secretShow'));
      toggle.type = 'button';
      toggle.setAttribute('aria-expanded', String(open));
      const list = el('ol', 'canva-secret-list');
      list.hidden = !open;
      pick(data.secret).forEach(item => list.append(el('li', '', item)));
      toggle.addEventListener('click', () => {
        if (secretOpen.has(card.id)) secretOpen.delete(card.id); else secretOpen.add(card.id);
        render(card, place);
        byId('canvaCardBottom')?.querySelector('.canva-secret-toggle')?.focus();
      });
      box.append(toggle, list);
      bottom.append(box);
    }
    const extras = el('div', 'canva-card-extras');
    if (data.hint) {
      const details = el('details', 'canva-hint');
      details.append(el('summary', '', T('canva.hint')), el('p', '', pick(data.hint)));
      extras.append(details);
    }
    if (extras.childElementCount) bottom.append(extras);
    const actions = el('div', 'canva-card-actions');
    actions.append(el('span', 'canva-card-note', T(activity(card) ? 'canva.openNote' : 'canva.openNoteOwn')));
    const open = el('button', 'btn-lg btn-teal canva-open', T('canva.open'));
    open.type = 'button';
    open.addEventListener('click', () => { if (typeof flipCardToBack === 'function') flipCardToBack(); });
    actions.append(open);
    bottom.append(actions);
    questionEl.after(bottom);
    return true;
  }

  document.addEventListener('goiviet:langchange', () => {
    if (typeof state !== 'undefined' && state.activeCard && has(state.activeCard)) render(state.activeCard);
  });
  window.GoiVietCanvaCards = { has, render, question, questionFor, hintFor, secretFor, activity, activityFor, coverDescriptions, coverDescriptionsFor, role: roleOf, cards: Object.keys(CARDS) };
})();
