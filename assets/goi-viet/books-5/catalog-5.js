/* Preview-5 book catalog (P5-01): the only place that says which stations have a book and its status.
   status: 'draft'     → visitors see the coming-soon page; the team previews the book with ?sach=nhap
           'published' → open to everyone (only after tools/check-books-5.cjs passes in Vietnamese and English)
   A station that is not listed here shows the coming-soon page. src is relative to the HTML page; bump v after
   editing a book so browsers fetch the new file. Book content itself lives in <placeId>/book.js. */
window.GoiVietBookCatalog = {
  hn:  { status: 'draft', src: 'assets/goi-viet/books-5/hn/book.js',  v: '20261109-9' },
  hue: { status: 'draft', src: 'assets/goi-viet/books-5/hue/book.js', v: '20261109-1' },
  hcm: { status: 'draft', src: 'assets/goi-viet/books-5/hcm/book.js', v: '20261109-1' },
  th:  { status: 'draft', src: 'assets/goi-viet/books-5/th/book.js',  v: '20261109-1' }
};
