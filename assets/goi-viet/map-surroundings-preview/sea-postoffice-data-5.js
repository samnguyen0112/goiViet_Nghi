/* Preview-5 desktop presentation. Short invitations complement, and do not replace, the source decks. */
(() => {
  'use strict';
  const b=(vi,en)=>({vi,en});
  const ui={
    brand:b('GÓI VIỆT · BƯU ĐIỆN BIỂN ĐẢO','GÓI VIỆT · SEA POST OFFICE'),
    play:b('Bàn thư','Letter desk'),atlas:b('Hải đồ','Sea chart'),album:b('Sổ thư','Letter book'),
    pause:b('Tạm dừng','Pause'),more:b('Khám phá thêm','Explore more'),
    closeMore:b('Gấp lại','Fold away'),entry:b('Nhà mình có thư','A letter for us'),
    entryLabel:b('Mở bưu điện biển đảo tại {place}','Open the sea post office in {place}'),
    sealedTitle:b('Nhà mình có thư','A letter for our family'),
    openLetter:b('Mở thư','Open letter'),
    to:b('Gửi đến','To'),
    send:b('Đóng dấu & gửi','Stamp & send'),sent:b('Thư đã gửi','Letter sent'),
    nextLetter:b('Mở lá thư tiếp','Open the next letter'),collect:b('Nhận bưu thiếp của nhà mình','Collect our family postcard'),
    keepLine:b('Ghi một câu để nhớ','Keep a sentence'),
    note:b('Lời nhà mình','Our family’s words'),noteHint:b('Điều nhà mình muốn giữ lại…','Something our family wants to keep…'),
    draftOnly:b('Lời nhập chỉ giữ trong phiên này.','Your words stay for this page session.'),
    mainland:b('Câu chuyện gợi nhớ nơi nào?','Where does the story take you?'),
    alternate:b('Đổi lời mời','Another invitation'),later:b('Để lần sau','Another time'),
    deck:b('Rút thẻ gợi chuyện','Draw a conversation card'),backMap:b('Về bàn thư','Back to the letter desk'),
    tide:b('Minh họa một chuyến chơi cùng nhau','An illustrated voyage together'),
    wordHint:b('Chọn một lời, rồi kể vì sao bạn muốn gửi.','Choose a word, then share why you want to send it.'),
    wordAfter:b('Mời người bên cạnh nối thêm một ý.','Invite someone beside you to add a thought.'),
    bagHint:b('Mỗi người góp một điều thân thuộc.','Let everyone add something that feels like home.'),
    bagAfter:b('Vì sao nhà mình muốn gửi những điều này?','Why do we want to send these things?'),
    bagCount:b('{n} / 3 điều gửi đi','{n} / 3 things to send'),
    listenHint:b('Một người kể, một người nghe rồi nhắc lại điều mình nhớ.','One tells a story; another listens and recalls a detail.'),
    letterHint:b('Người đầu mở lời, người tiếp theo nối ý.','One begins; the next adds a thought.'),
    owner:b('Mời {name} mở lời','Invite {name} to begin'),
    progress:b('Ba lá thư','Three letters'),currentLetter:b('Lượt này','This turn'),
    pendingLetter:b('Chưa mở','Unopened'),draftLetter:b('Đang viết','In progress'),
    language:b('Ngôn ngữ','Language'),references:b('Nguồn tham khảo','References'),
    listen:b('Hẹn giờ 1 phút','Set a 1-minute timer'),
    resumeCard:b('Mở lại thẻ','Resume card'),
    albumTitle:b('Sổ thư nhà mình','Our family letter book'),
    options:b('Sửa và tải thêm','Edit and download more'),
    download:b('Tải bưu thiếp','Download postcard'),
    continue:b('Về lá thư đang mở','Return to our letter'),
    originals:b('Bộ thẻ quen thuộc','The original card deck'),
    source:b('Câu chuyện & nguồn','Story & sources'),
    session:b('Sổ thư giữ trong phiên này. Tải về để giữ lâu hơn.','Letters stay for this session. Download to keep them.'),
    chosen:b('Đã gửi: {items}','Sent: {items}'),
    letterType:b('Thư nhà mình','Family letter'),
    postmarkCue:b('Xem tư liệu','Read the story'),
    postmarkLabel:b('Xem tư liệu về {place}','Read the story of {place}'),
  };
  /* Each postmark names a real place from the voyage data; `story` points at the matching stop reading and source. */
  const routes={
    'hoang-sa':{
      title:b('Thư nhà theo sóng','Letters on the tide'),subtitle:b('Gửi lời dặn theo sóng, giữ một chuyện nhà.','Send a caring word with the tide, keep a family story.'),
      envelope:b('Gửi theo sóng','Sent with the tide'),
      letters:[
        {title:b('Một lời dặn','A caring word'),kind:'words',icon:'letter',
          postmark:{place:b('Lý Sơn','Lý Sơn'),detail:b('Khao lề thế lính','Khao lề thế lính ritual'),story:1},
          prompts:[b('Nếu người thân sắp đi biển xa, nhà mình sẽ dặn điều gì?','If someone dear were about to go far out to sea, what would we tell them?'),b('Chọn một lời chúc cho chuyến đi tưởng tượng của cả nhà.','Choose a wish for an imagined family voyage.'),b('Một lời nào luôn làm bạn thấy yên tâm?','Which words always put you at ease?')],
          words:[b('Bình an','Peace'),b('Nhớ về nhà','Come home'),b('Cứ vui nhé','Find joy'),b('Có mình đây','I am here')]},
        {title:b('Một chuyện để nghe','A story to hear'),kind:'listen',icon:'shell',
          postmark:{place:b('Đảo Hoàng Sa','Hoàng Sa Island'),detail:b('Trên hải đồ','On the sea chart'),story:0},
          prompts:[b('Kể một lời dặn ở nhà mà bạn vẫn nhớ.','Share a caring word from home that stayed with you.'),b('Ai từng giúp bạn yên tâm trước một chuyến đi?','Who helped you feel at ease before a journey?'),b('Nghe người bên cạnh kể, rồi nhắc lại một chi tiết bạn quý.','Listen to a neighbour’s story, then recall one detail you treasure.')]},
        {title:b('Một điều muốn giữ','Something to keep'),kind:'letter',icon:'photo',
          postmark:{place:b('Nhà Trưng bày Hoàng Sa','Hoàng Sa Exhibition House'),detail:b('Đà Nẵng','Đà Nẵng'),story:2},
          prompts:[b('Nếu nhà mình có một tủ trưng bày, mình sẽ giữ chuyện gì?','If our family had a display case, which story would we keep in it?'),b('Một chuyện nhỏ nào bạn muốn kể lại cho người thân?','Which small story would you like to pass on?'),b('Mỗi người góp một từ để đặt tên cho chuyến chơi này.','Let each person add a word to name this voyage.')]}
      ]
    },
    'truong-sa':{
      title:b('Gói một chút nhà','Pack a little home'),subtitle:b('Gói điều thân thuộc, gửi ra đảo xa.','Pack something familiar, send it to the far islands.'),
      envelope:b('Gửi ra đảo','Off to the islands'),
      letters:[
        {title:b('Một điểm hẹn','A meeting place'),kind:'words',icon:'home',
          postmark:{place:b('Đảo Song Tử Tây','Song Tử Tây Island'),detail:b('Trên hải đồ','On the sea chart'),story:0},
          prompts:[b('Nếu người ở đảo xa về thăm, nhà mình hẹn nhau ở đâu?','If someone from the far islands came home to visit, where would we meet?'),b('Góc nào ở nhà mình muốn kể cho người ở đảo nghe?','Which corner of home would you describe to someone on the islands?'),b('Chọn một nơi, rồi mời người bên cạnh kể một kỷ niệm.','Choose a place, then invite someone beside you to share a memory.')],
          words:[b('Bên mâm cơm','At dinner'),b('Dưới bóng bàng','Under the bàng tree'),b('Ngoài hiên nhà','On the porch'),b('Cạnh người thân','Beside family')]},
        {title:b('Túi nếp nhà','A bag of home'),kind:'bag',icon:'bag',
          postmark:{place:b('Bóng bàng vuông','Bàng vuông shade'),detail:b('Trường Sa','Trường Sa'),story:1},
          prompts:[b('Cùng chọn ba điều thân thuộc để gói gửi ra đảo.','Choose three familiar things to pack and send to the islands.'),b('Nếu mỗi người góp một điều, gói quà của nhà mình sẽ có gì?','If everyone adds something, what goes in our family parcel?'),b('Một âm thanh, một đồ vật, một lời nhắn — bạn muốn gửi gì ra đảo?','A sound, an object, a message — what would you send to the islands?')]},
        {title:b('Lời gửi ra đảo','A message to the islands'),kind:'letter',icon:'letter',
          postmark:{place:b('Đảo Trường Sa','Trường Sa Island'),detail:b('Trên hải đồ','On the sea chart'),story:2},
          prompts:[b('Cùng nối một lời nhắn gửi ra đảo xa.','Build a message to the far islands together.'),b('Người ở đảo xa có lẽ nhớ điều nhỏ nào nhất ở nhà?','What small thing from home might someone on the islands miss most?'),b('Mỗi người góp một ý cho bưu thiếp gửi Trường Sa.','Let everyone add a thought to our postcard for Trường Sa.')],
          starters:[b('Gửi người ở đảo xa…','To someone on the far islands…'),b('Ở nhà mình hôm nay…','At home today…'),b('Nhà mình muốn chúc…','Our family wishes you…')]}
      ]
    }
  };
  window.GoiVietSeaPostOffice=Object.freeze({ui,routes});
  window.GoiVietI18n?.add({vi:{'sea.stampSkipped':'Để lá thư này lần sau'},en:{'sea.stampSkipped':'Leave this letter for another time'}});
})();
