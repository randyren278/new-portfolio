# Mobile photo flow mockup

Standalone, disposable interaction sketch. It does not change the production portfolio.

Serve the repository root so this page can read the site's existing photo and résumé assets:

```sh
python3 -m http.server 3888 --directory .
```

Open `http://localhost:3888/explorations/mobile-photo-flow/`.

The Index stays first. Other sections change order on reload or with the preview control; Projects stays within the first three positions after Index. The two photo cards move as one section, with a sticky Shuffle control that loads and decodes both replacements before changing them. The top Photos link jumps to that section.
