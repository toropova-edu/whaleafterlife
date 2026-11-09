# Whale Afterlife

A gentle, paper-cut guide to what happens after a whale dies, and the new life it brings to the deep sea.
Pick a whale and follow her story.

**Live site:** https://toropova-edu.github.io/whaleafterlife/

## Stories

| Whale | Page | Status |
|---|---|---|
| Fin whale | `fin-whale.html` | ready |
| Right whale | `right-whale.html` | ready |
| Blue whale | not yet | still being drawn |
| Humpback whale | not yet | still being drawn |

## How it works

A plain static site: no build step, no dependencies. Open `index.html` in a browser, or serve the folder:

```
python -m http.server 5173
```

- `index.html` + `hub.js`: the whale chooser
- `fin-whale.html` + `main.js`: the fin whale story (scroll to sink, then button-driven steps)
- `right-whale.html` + `right.js` + `right.css`: the right whale story (button-driven)
- `styles.css`: shared styles and design tokens (Deep Reef)
- `assets/`: the illustrations (paper-cut sprites)

The header has a **Motion** switch. It follows the system "reduce motion" setting by default, and the choice is remembered.

Based on Sasha's whale notes. Facts were checked against public sources (Smithsonian Ocean, Scientific American, NOAA Fisheries); the numbers are rounded on purpose.
