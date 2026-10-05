# Claude Obeid – the book of a life (website)

An Arabic, right-to-left website for the artist Dr. Claude Obeid.
Her paintings are shown as a book called **«كتاب العمر»**. Each **period of life** is a section of the book with its own paintings, and a page-turn sound plays on every page.

Everything that changes is a plain file: pictures in `media/`, words in `content/`. Nobody needs to touch the code.

---

## 1. Put it online (one time, about 30 minutes, free)

You need two free accounts: **GitHub** (keeps the files) and **Cloudflare** (shows the website).

### A. GitHub
1. Sign up at github.com. Click **New repository**, name it `claude-obeid-site`, choose **Private**, create it.
2. Unzip this folder, then click **uploading an existing file** and drag the contents in.
   * GitHub accepts **100 files per upload**. This site has about 120 files, so do it in two or three rounds (first `media/paintings`, then the rest). Click **Commit changes** after each round.
   * Do **not** upload `node_modules`, `dist` or `preview` (they are not in the zip).
   * Easier: install **GitHub Desktop**, add the folder, click **Publish repository**. No limit, no rounds.

### B. Cloudflare Pages
1. Sign up at cloudflare.com. Go to **Workers & Pages → Create → Pages → Connect to Git** and pick the repository.
2. Fill in:
   * **Build command:** `node build.mjs`
   * **Build output directory:** `dist`
   * **Environment variable:** `NODE_VERSION` = `20` (the file `.node-version` already says this; the variable is a safety net)
3. Click **Save and Deploy**. After about two minutes you get an address like `claude-obeid.pages.dev`. That is the live site.

From now on, **every change saved to GitHub updates the website by itself** within two minutes.

### C. Her own address (optional, about 10 USD a year)
In Cloudflare: **Domain Registration → Register Domains**, search for `claudeobeid.com` (or `.org`, `.art`) and buy it. Then in the Pages project open **Custom domains → Set up a domain** and pick it.
Afterwards put the address in **Titles and links → Website address** (for example `https://claudeobeid.com`). This makes link previews on WhatsApp and Facebook show her portrait.

---

## 2. How she (or you) edits the site: Pages CMS

[Pages CMS](https://pagescms.org) is a free editor that works directly on the GitHub files, with forms and buttons. Nobody needs to know GitHub.

1. Go to pagescms.org and sign in with GitHub. Choose the repository. It reads the file `.pages.yml` and shows these menus:

| Menu | What it is for |
|---|---|
| **1. The book (periods and paintings)** | add, rename and reorder the periods of life; add and reorder the paintings of each period |
| **2. Books** | the books shelf |
| **3. Articles** | articles written about her or by her |
| **4. Videos** | interviews and programmes |
| **5. About her (عنها)** | the text under «عنها», the photos beside it, the opening portrait |
| **6. Titles and links** | the book title, calligraphy phrases, tagline, contact and social links |
| **7. Captions (optional)** | words under a picture. Nothing is shown unless you add one |
| **Media** | every picture, in folders |

2. To let **Dr. Obeid** (or anyone) edit: on GitHub open the repository → **Settings → Collaborators → Add people**, enter her GitHub username (she creates a free account). She then signs in at pagescms.org and sees the same menus.
3. After pressing **Save** in the editor, the website updates by itself in about two minutes.

---

## 3. Everyday jobs

### Add a new period of life, with its paintings
Menu **1. The book** → at the bottom of the list press **Add an item** → a new period opens:
* **Name of the period** (required) and, if you want, **Few words about this period** and **Years**.
* **Paintings:** drag the picture files from the computer onto the box (many at once), or press **Upload**. The pictures appear as small thumbnails. Drag a thumbnail to move it, press the trash icon to take it out of this period.
* **Snapshots of her** (optional): photos of her in this period. They appear as framed snapshots at the end of the period.
* Press **Save** (top right).

The period appears in the book in the same place it has in the list. Drag a period up or down in the list to change where it comes in the book.

### Add paintings to a period that already exists
Menu **1. The book** → click the period to open it → drop the new pictures on the **Paintings** box → **Save** (top right). New pictures are added at the end; drag them wherever you like.
Press **Select** instead of Upload to choose a picture that is already in the media library.

### Rename a period, or change its few words
Menu **1. The book** → click the period → change the text → **Save**. The names in the book now are only **suggestions**, to be reviewed with Dr. Obeid, who knows the real periods and years.

### Add a book, an article or a video
Menus **2. Books**, **3. Articles**, **4. Videos** → **Add an item** at the bottom → fill the form → **Save**.
* Only the title is required. Everything else is optional.
* A link (starting with `https://`) makes the card clickable.
* For a book cover use the **Cover picture** box.
* The Kind of an article is a short label above its title. Write `كُتب عنها` for an article written about her, or `بقلمها` for one she wrote.
* Drag items to change their order. Open an item and use the trash icon to remove it.

### Edit the text under «عنها», and its photos
Menu **5. About her**:
* **Text:** write or paste. Leave an empty line between paragraphs.
* **Photos beside the text:** drop pictures on the box, drag to reorder, trash icon to remove. They are shown **without any caption**.
* **Opening portrait:** the picture in the arch on the first screen.

### Book title and calligraphy phrases
Menu **6. Titles and links**. The title on the cover is *Book title*. *Calligraphy phrases* are the short lines written in calligraphy on the decorative pages: add, remove or rewrite them freely.

### Contact and social links
Menu **6. Titles and links**: fill email, Instagram, Facebook, YouTube. An empty field is simply not shown. They are empty now on purpose, until she decides what to show publicly.

### Captions
Menu **7. Captions** → **Add an item** → pick the picture, write the caption. It shows under the picture when it is opened large. There are none now; pictures are shown without words unless you add one.

### Sound
The page-turn sounds are `src/sound/page1.mp3`, `page2.mp3`, `page3.mp3`. Visitors can switch the sound off with the button under the book (their choice is remembered). To use a recording of a real page turn, replace those three files with yours, keeping the names.

---

## 4. Good to know

* **Order.** The order of periods, of paintings inside a period, of books, articles and photos is the order in the editor's list. Drag to change it.
* **Picture size.** The build makes two sizes of every picture (a light one for the book, a large one for the full-screen view). Upload the best originals you have; they are shrunk automatically. GitHub refuses single files over 25 MB.
* **Uploaded files get a random name** (for example `mgx4k2a-abc12345.jpg`). That is on purpose, so two pictures with the same name can never overwrite each other. The right order is the one in the form, not the file names.
* **Pictures that are in the media library but not placed in any period** are not shown. The build log lists them as a hint.
* **Limits.** Cloudflare Pages free plan: 20,000 files, 25 MB per file, unlimited visitors. This site uses about 100 files and 6 MB.
* **Phone.** On a phone the book shows one page at a time (swipe or use the arrows). On a computer it is an open two-page book.
* **If a build fails**, Cloudflare shows the reason in plain words (for example "content/books.yml line 12"). The usual cause is a missing quotation mark or a tab in a `.yml` file when editing by hand. A value with a colon `:` in it must be inside quotation marks. Using the editor avoids this.
* **Privacy.** The site has no cookies, no analytics and no outside requests. Fonts and sounds are part of the site.

## 5. The one-file preview (to show people before it is online)

`Claude-Obeid-book-preview.html` is the same site in one file that opens in any browser, without internet. It has a **تحرير الموقع** button to try adding periods, pictures, books, articles and videos and to type in the «عنها» text. What is added there stays **in that browser only**, it is a trial, it never reaches the real website. The real site is edited with Pages CMS as described above.

To make a new preview file from the current content:

```
npm install
npm run preview      # writes preview/Claude-Obeid-book-preview.html
npm run build        # builds the website into the folder "dist"
```
(Node 20 or newer is needed.)

## 6. What is in the folder

| Folder / file | What it is |
|---|---|
| `media/` | all pictures (paintings, portrait, album, book covers) |
| `content/` | all words: periods, books, articles, videos, about, titles, captions |
| `.pages.yml` | tells Pages CMS which menus and forms to show |
| `build.mjs` | the builder (runs on Cloudflare) |
| `src/` | design, code, fonts, sounds |
| `public/` | files copied as they are (favicon, robots.txt, cache rules) |
