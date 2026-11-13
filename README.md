# BABEL ON site

This folder is the BABEL ON landing page. It is one static page with no build step.

- `index.html`: the page
- `styles.css`: the styles
- `main.js`: the glow, the demo and the copy button
- `assets/`: the tower mark, the share image and the favicon

## Preview the page

1. Open a terminal in this folder.
2. Run `python3 -m http.server`.
3. Open `http://localhost:8000` in a browser.

## Change the GitHub link

1. Open `main.js`.
2. Change the `REPO_URL` constant on the first code line.

`main.js` sets each GitHub link and the `git clone` line from this constant.
`index.html` has the same address as a fallback for browsers without JavaScript.
To change the fallback, replace `https://github.com/BABEL-ON-APP/babel-on` in `index.html`.

## Publish the page

Push the contents of this folder to the root of the repository `BABEL-ON-APP/babel-on-app.github.io`.
GitHub Pages serves the page at `https://babel-on-app.github.io/`.
`PROMPT-fable-5.2.md` is the build brief. Do not publish it.
