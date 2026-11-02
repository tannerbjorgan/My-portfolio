# Tanner Bjorgan — portfolio

Static portfolio built with plain HTML, CSS, and JavaScript. It is designed for GitHub Pages and has no production dependencies or build step.

## Preview locally

```sh
python3 -m http.server 8000
```

Visit `http://127.0.0.1:8000/`. The contribution calendar is loaded from `contributions.json`, so the page should be served over HTTP rather than opened directly as a file.

## Content

- `index.html` contains the introduction, contact links, experience, and resume link.
- `script.js` contains the project cards, skill logos, and page interactions.
- `resume.pdf` is Tanner's software engineering resume.
- `contributions.json` is a snapshot of the public GitHub profile's contribution calendar. It includes the activity GitHub makes publicly visible, which may exclude private work.
- `scripts/update-contributions.py` fetches and validates the calendar. `.github/workflows/update-contributions.yml` refreshes it daily and can be run manually.

## GitHub Pages

In the repository's **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/(root)`, then save. All local asset paths are relative, so the site works under a repository path.

## Assets

The technology logos under `assets/skills/` come from [Simple Icons](https://simpleicons.org/) (CC0), except the CloudFront icon, which comes from the [AWS Architecture Icons](https://aws.amazon.com/architecture/icons/) package via AWS Fundamentals. The profile image is Tanner's public GitHub avatar. The abstract gradient is retained from the reference template.
