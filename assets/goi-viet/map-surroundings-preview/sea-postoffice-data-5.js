/* Preview-5 desktop presentation. Short invitations complement, and do not replace, the source decks. */
(() => {
  'use strict';
  const b=(vi,en)=>({vi,en});
  const ui={
    brand:b('GÓI VIỆT · BƯU ĐIỆN BIỂN ĐẢO','GÓI VIỆT · SEA POST OFFICE'),
    play:b('Bàn thư','Letter desk'),atlas:b('Hải đồ','Sea chart'),album:b('Sổ thư','Letter book'),
    pause:b('Tạm dừng ×','Pause ×'),more:b('Khám phá thêm','Explore more'),
    closeMore:b('Gấp lại','Fold away'),entry:b('Nhà mình có thư','A letter for us'),
    entryLabel:b('Mở bưu điện biển đảo tại {place}','Open the sea post office in {place}'),
    sealedTitle:b('Nhà mình có thư.','A letter for our family.'),
    sealedHint:b('Một lời nhỏ, gửi cùng nhau.','A little message, sent together.'),
    openLetter:b('Chạm dấu sen · mở thư','Touch the lotus · open the letter'),
    letterNumber:b('LÁ THƯ {n} / 3','LETTER {n} / 3'),
    to:b('Gửi đến','To'),from:b('Từ nhà mình','From our family'),
    send:b('Đóng dấu & gửi','Stamp & send'),sent:b('Một chút nhà đã theo sóng.','A little home is on its way.'),
    sentHint:b('Giữ lại điều vừa kể, rồi mở lá thư tiếp nhé.','Keep the story you shared, then open the next letter.'),
    nextLetter:b('Mở lá thư tiếp','Open the next letter'),collect:b('Nhận bưu thiếp của nhà mình','Collect our family postcard'),
    keepLine:b('Ghi một câu để nhớ','Keep a sentence'),
    note:b('Lời nhà mình','Our family’s words'),noteHint:b('Một câu thôi cũng đủ…','One sentence is enough…'),
    draftOnly:b('Lời nhập chỉ giữ trong phiên này.','Your words stay for this page session.'),
    mainland:b('Câu chuyện gợi nhớ nơi nào?','Where does the story take you?'),
    alternate:b('Đổi lời mời','Another invitation'),later:b('Để lần sau','Another time'),
    deck:b('Rút thẻ gợi chuyện','Draw a conversation card'),backMap:b('Về bàn thư','Back to the letter desk'),
    tide:b('Minh họa một chuyến chơi cùng nhau','An illustrated voyage together'),
    wordHint:b('Chọn một lời, rồi kể vì sao bạn muốn gửi.','Choose a word, then share why you want to send it.'),
    wordAfter:b('Mời người bên cạnh nối thêm một ý.','Invite someone beside you to add a thought.'),
    bagHint:b('Mỗi người góp một điều thân thuộc.','Let everyone add something that feels like home.'),
    bagAfter:b('Vì sao nhà mình muốn mang những điều này?','Why do these things feel like home?'),
    bagCount:b('{n} / 3 điều mang theo','{n} / 3 things to bring'),
    listenHint:b('Một người kể, một người nghe rồi nhắc lại điều mình nhớ.','One tells a story; another listens and recalls a detail.'),
    letterHint:b('Người đầu mở lời, người tiếp theo nối ý.','One begins; the next adds a thought.'),
    owner:b('Mời {name} mở lời','Invite {name} to begin'),
    albumTitle:b('Thư nhà mình đã gửi','Letters we sent together'),
    albumHint:b('Những điều nhỏ, giữ lại cho nhau.','Little things, kept for one another.'),
    options:b('Sửa & lưu thêm','Edit & keep more'),
    download:b('Giữ bưu thiếp này','Keep this postcard'),
    continue:b('Về lá thư đang mở','Return to our letter'),
    finish:b('Ba lá thư, một chút nhà.','Three letters, a little home.'),
    originals:b('Bộ thẻ quen thuộc','The original card deck'),
    source:b('Câu chuyện & nguồn','Story & sources'),
    session:b('Sổ thư giữ trong phiên này. Tải về để giữ lâu hơn.','Letters stay for this session. Download to keep them.'),
    chosen:b('Đã gửi: {items}','Sent: {items}'),
    letterType:b('Thư nhà mình','Family letter'),
  };
  const routes={
    'hoang-sa':{
      title:b('Thư nhà theo sóng','Letters on the tide'),subtitle:b('Gửi một lời, giữ một chuyện nhà.','Send a word, keep a family story.'),
      letters:[
        {title:b('Một lời dặn','A caring word'),kind:'words',icon:'letter',
          prompts:[b('Bạn muốn gửi lời dặn nào cho người bên cạnh?','What caring word would you send to someone beside you?'),b('Chọn một lời chúc cho chuyến đi tưởng tượng của cả nhà.','Choose a wish for an imagined family voyage.'),b('Một lời nào luôn làm bạn thấy yên tâm?','Which words always put you at ease?')],
          words:[b('Bình an','Peace'),b('Nhớ về nhà','Come home'),b('Cứ vui nhé','Find joy'),b('Có mình đây','I am here')]},
        {title:b('Một chuyện để nghe','A story to hear'),kind:'listen',icon:'shell',
          prompts:[b('Kể một lời dặn ở nhà mà bạn vẫn nhớ.','Share a caring word from home that stayed with you.'),b('Ai từng giúp bạn yên tâm trước một chuyến đi?','Who helped you feel at ease before a journey?'),b('Nghe người bên cạnh kể, rồi nhắc lại một chi tiết bạn quý.','Listen to a neighbour’s story, then recall one detail you treasure.')]},
        {title:b('Một điều muốn giữ','Something to keep'),kind:'letter',icon:'photo',
          prompts:[b('Cùng ghép một câu mà nhà mình muốn giữ lại.','Build a sentence your family would like to keep.'),b('Một chuyện nhỏ nào bạn muốn kể lại cho người thân?','Which small story would you like to pass on?'),b('Mỗi người góp một từ để đặt tên cho chuyến chơi này.','Let each person add a word to name this voyage.')]}
      ]
    },
    'truong-sa':{
      title:b('Gói một chút nhà','Pack a little home'),subtitle:b('Gói điều thân thuộc, gửi một lời thương.','Pack something familiar, send a caring word.'),
      letters:[
        {title:b('Một điểm hẹn','A meeting place'),kind:'words',icon:'home',
          prompts:[b('Bạn muốn hẹn cả nhà ở đâu trong một ngày bình yên?','Where would you meet your family on a peaceful day?'),b('Góc nào ở nhà khiến bạn muốn ngồi lại lâu hơn?','Which corner of home makes you want to linger?'),b('Chọn một nơi, rồi mời người bên cạnh kể một kỷ niệm.','Choose a place, then invite someone beside you to share a memory.')],
          words:[b('Bên mâm cơm','At dinner'),b('Dưới bóng cây','Under a tree'),b('Ngoài hiên nhà','On the porch'),b('Cạnh người thân','Beside family')]},
        {title:b('Túi nếp nhà','A bag of home'),kind:'bag',icon:'bag',
          prompts:[b('Cùng chọn ba điều thân thuộc để mang ra biển lớn.','Choose three familiar things to carry out to sea.'),b('Nếu mỗi người góp một điều, túi của nhà mình sẽ có gì?','If everyone adds something, what goes in our family bag?'),b('Một âm thanh, một đồ vật, một lời nhắn — bạn chọn gì?','A sound, an object, a message — what would you choose?')]},
        {title:b('Lời gửi về nhà','A message home'),kind:'letter',icon:'letter',
          prompts:[b('Cùng nối một lời nhắn gửi về nhà.','Build a message home together.'),b('Ở xa, bạn sẽ nhớ điều nhỏ nào nhất?','When away, what little thing would you miss most?'),b('Mỗi người góp một ý cho bưu thiếp của nhà mình.','Let everyone add a thought to our family postcard.')]}
      ]
    }
  };
  window.GoiVietSeaPostOffice=Object.freeze({ui,routes});
  window.GoiVietI18n?.add({vi:{'sea.stampSkipped':'Để lá thư này lần sau'},en:{'sea.stampSkipped':'Leave this letter for another time'}});
})();
