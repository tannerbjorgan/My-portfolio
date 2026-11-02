# Tanner Bjorgan — Portfolio

Personal portfolio built with plain HTML, CSS and JavaScript modules. There is no build step and no runtime dependencies.

Behind the content is a hand-built pixel-art scene: a developer coding at a desk under an autumn tree with his dog, looking out over a valley where an overland rig crawls along a creek. It's rendered to low-resolution canvases and scaled up, follows the light/dark theme (sunset or harvest moon), and pauses entirely for visitors who prefer reduced motion.

## Running locally

The page uses ES modules and fetches JSON, so serve it over HTTP rather than opening the file directly:

```sh
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

## Project structure

```
index.html                 Page markup
css/styles.css             All styles, with theme tokens at the top
js/
  content.js               Experience, projects and tools — edit this to update the site
  main.js                  Entry point
  sections.js              Renders experience, projects and the tools marquee
  contributions.js         GitHub contribution calendar
  theme.js                 Light/dark toggle
  scene/                   Pixel-art background
    index.js               Layout, draw order and animation loop
    state.js               Shared layout and theme state
    palette.js             Colour ramps and per-theme palettes
    pixels.js              Noise, colour and pixel-drawing helpers
    lighting.js            Sunlight grading and light rays
    valley.js              Mountains, ridges, creek, trees, clouds and stars
    hillside.js            Hill, the big tree, falling leaves and grass
    raytrace.js            Small ray tracer used for the desk scene
    desk.js                Desk, coder and dog models, monitor and animation
    rig.js                 The 4x4 on the creek
    bird.js                Swallow flight
data/contributions.json    Saved copy of the contribution calendar
scripts/                   Calendar updater used by the GitHub Action
assets/                    Images, icons and fonts
```

## Updating content

Everything that changes over time lives in [`js/content.js`](js/content.js):

- **Experience** — add an object to `experience` with the company, role, dates, a logo (`{ image }` or `{ text, color }`), the tech stack and highlight bullets.
- **Projects** — add an object to `projects`. Include `url` to make the card a link and `id` to link to it from elsewhere on the page.
- **Tools** — add a name to `tools`. If it's new, add its icon to `assets/skills/` and register it in `technologies`.

The introduction and contact links are in `index.html`.

## Contribution calendar

GitHub doesn't expose the contribution calendar through an unauthenticated API, so the page loads it live from [github-contributions-api](https://github.com/grubersjoe/github-contributions-api), a public mirror of the profile calendar. If that service is unavailable it falls back to `data/contributions.json`, which [a scheduled GitHub Action](.github/workflows/update-contributions.yml) refreshes daily using `scripts/update-contributions.py`.

## Deployment

The site is served by GitHub Pages from the `main` branch root (**Settings → Pages → Deploy from a branch**). Every push to `main` redeploys it. All paths are relative, so it also works under a project path such as `/My-portfolio/`.

## Credits

Technology logos in `assets/skills/` are from [Simple Icons](https://simpleicons.org/) (CC0), except the CloudFront icon from the [AWS Architecture Icons](https://aws.amazon.com/architecture/icons/) and the Codex icon, which belongs to OpenAI. Fonts are [Geist](https://vercel.com/font), [JetBrains Mono](https://www.jetbrains.com/lp/mono/) and [Instrument Serif](https://fonts.google.com/specimen/Instrument+Serif), all under the SIL Open Font License.
