# Tanner Bjorgan — Portfolio

Personal portfolio built with plain HTML, CSS and JavaScript modules. There is no build step and no runtime dependencies.

Behind the content is a hand-built pixel-art scene: a developer coding at a desk under an autumn tree with his dog, looking out over a valley where an overland rig crawls along a creek. It's rendered to low-resolution canvases and scaled up, follows the light/dark theme (sunset or harvest moon), and pauses entirely for visitors who prefer reduced motion.

## Running locally

The page uses ES modules and fetches JSON, so serve it over HTTP rather than opening the file directly:

```sh
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

## Credits

Technology logos in `assets/skills/` are from [Simple Icons](https://simpleicons.org/) (CC0), except the CloudFront icon from the [AWS Architecture Icons](https://aws.amazon.com/architecture/icons/) and the Codex icon, which belongs to OpenAI. Fonts are [Geist](https://vercel.com/font), [JetBrains Mono](https://www.jetbrains.com/lp/mono/) and [Instrument Serif](https://fonts.google.com/specimen/Instrument+Serif), all under the SIL Open Font License.
