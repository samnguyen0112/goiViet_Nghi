/* Thanh Hóa — tập nháp P5-01, nội dung đang được nhóm soạn (status draft trong catalog-5.js).
   Tạo từ tập mẫu _mau; thay chữ và tranh theo _mau/HUONG-DAN-NHAP-NOI-DUNG.md. */
GoiVietBooks.register({
  placeId: 'th',
  kind: 'fiction',
  title: { vi: 'Thanh Hóa – Tên tập đang soạn', en: 'Thanh Hoa – Title in progress' },
  subtitle: { vi: 'Một câu giới thiệu ngắn về cuốn sách', en: 'One short line that introduces the book' },
  runningHead: { vi: 'Thanh Hóa · Bản nháp', en: 'Thanh Hoa · Draft' },
  stamp: { vi: 'Thanh Hóa', en: 'Thanh Hoa' },
  cover: { art: null },
  back: { text: { vi: ['Hai đến ba dòng ngắn', 'khép lại cuốn sách.'], en: ['Two or three short lines', 'that close the book.'] } },
  art: {
    // 'ma-tranh': { file: 'art/ma-tranh.webp', hi: 'art/ma-tranh@2x.webp', w: 1600, h: 1067, alt: { vi: 'Mô tả tranh', en: 'Picture description' }, focus: '50% 40%' }
  },
  sections: [
    {
      id: 'th-s0',
      label: { vi: 'Mở đầu', en: 'Prologue' },
      title: { vi: 'Tên phần mở đầu', en: 'Prologue title' },
      cardIds: [],
      pages: [
        {
          id: 'th-p01', layout: 'full-art', art: null,
          text: {
            vi: { caption: 'Chú thích một câu cho tranh trọn trang.' },
            en: { caption: 'A one-line caption for the full-page picture.' }
          }
        },
        {
          id: 'th-p02', layout: 'opener', art: null,
          text: {
            vi: { heading: 'Câu mở in đậm', body: ['Trang mở phần: tên phần và nhãn phần lấy từ phần (section) ở trên. Viết 2–4 đoạn ngắn giới thiệu bối cảnh, nhân vật hoặc nét văn hóa của phần này.', 'Tranh bên trái nên vẽ dọc, tỉ lệ 4:5.'] },
            en: { heading: 'A bold opening line', body: ['Part opener: the part label and title come from the section above. Write 2–4 short paragraphs that set the scene, the people or the cultural detail of this part.', 'The picture on the left should be portrait, ratio 4:5.'] }
          }
        },
        {
          id: 'th-p03', layout: 'art-text', variant: 'top', art: null,
          text: {
            vi: { body: ['Trang tranh trên, chữ dưới. Tranh ngang tỉ lệ 3:2. Lời thoại bắt đầu bằng dấu gạch dài:', '— Như thế này ạ?', '“Một câu trích đặt giữa đoạn văn sẽ hiện trong khung màu nhạt.”'] },
            en: { body: ['Picture on top, text below. Landscape picture, ratio 3:2. Dialogue starts with an em dash:', '— Like this?', '“A quotation inside the story is shown in a light panel.”'] }
          }
        },
        {
          id: 'th-p04', layout: 'art-text', variant: 'side', art: null,
          text: {
            vi: { heading: 'Tranh bên, chữ bên', body: ['Trang tranh dọc bên trái (4:5), chữ thành cột bên phải. Bố cục này chứa được nhiều chữ hơn bố cục tranh trên.'] },
            en: { heading: 'Picture beside text', body: ['Portrait picture on the left (4:5), text in a column on the right. This layout holds more text than the picture-on-top layout.'] }
          }
        }
      ]
    },
    {
      id: 'th-s1',
      label: { vi: 'Chương 01', en: 'Chapter 01' },
      title: { vi: 'Tên chương', en: 'Chapter title' },
      cardIds: [],
      pages: [
        {
          id: 'th-p05', layout: 'opener', art: null,
          text: {
            vi: { body: ['Mỗi chương bắt đầu bằng một trang mở phần.'] },
            en: { body: ['Every chapter starts with an opener page.'] }
          }
        },
        {
          id: 'th-p06', layout: 'text-quote',
          text: {
            vi: { heading: 'Trang chữ', body: ['Trang không tranh, nhiều chữ nhất. Có thể kết trang bằng một câu trích lớn ở ô quote bên dưới.'], quote: '“Câu trích lớn khép lại trang.”' },
            en: { heading: 'Text page', body: ['A page without a picture that holds the most text. It can end with a large quotation in the quote field below.'], quote: '“A large quotation that closes the page.”' }
          }
        },
        {
          id: 'th-p07', layout: 'art-text', variant: 'top', art: null,
          text: {
            vi: { body: ['Trang cuối chương.'] },
            en: { body: ['Last page of the chapter.'] }
          }
        }
      ]
    },
    {
      id: 'th-notes',
      label: { vi: 'Phụ lục', en: 'Appendix' },
      title: { vi: 'Ghi chú và nguồn', en: 'Notes and sources' },
      cardIds: [],
      pages: [
        {
          id: 'th-p08', layout: 'notes', sources: ['s1'], credits: true,
          text: {
            vi: { heading: 'Ghi chú văn hóa', body: ['Phần tư liệu có thật, tách khỏi phần hư cấu. Mỗi ý nên có nguồn trong danh sách sources bên dưới.'] },
            en: { heading: 'Cultural notes', body: ['Factual notes, kept apart from the fiction. Each point should have a source in the sources list below.'] }
          }
        }
      ]
    }
  ],
  sources: [
    { id: 's1', title: { vi: 'Tên bài hoặc hồ sơ nguồn', en: 'Source article or record' }, publisher: { vi: 'Nơi đăng', en: 'Publisher' }, url: 'https://example.org/' }
  ],
  credits: [
    { role: { vi: 'Lời', en: 'Text' }, name: 'Tên người viết' },
    { role: { vi: 'Tranh', en: 'Illustrations' }, name: 'Tên người vẽ', license: 'Giấy phép nếu có' }
  ]
});
