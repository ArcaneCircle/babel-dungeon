# Babel Dungeon

A gamified tool for vocabulary learning.

## Adding a new pair

To add a new language pair just add a `<lang1>-<lang2>.tsv` file
and `lang_<code>` names in `src/lib/langs/`.

If necessary add localization for the interface strings at
`src/lib/langs` and update `src/lib/i18n.ts` accordingly.

## Contributing

### Installing Dependencies

After cloning this repo, install dependencies:

```
pnpm i
```

### Checking code format

```
pnpm check
```

### Generate sentences

To generate the list of sentences from the raw .tsv data file:

```
pnpm generate
```

### Testing the app in the browser

To test your work in your browser (with hot reloading!) while developing:

```
pnpm start
```

### Building

To package the WebXDC file:

```
pnpm build
```

To package the WebXDC with developer tools inside to debug in Delta Chat, set the `NODE_ENV`
environment variable to "debug":

```
NODE_ENV=debug pnpm build
```

The resulting optimized `.xdc` file is saved in `dist-xdc/` folder.

### Releasing

To automatically build and create a new GitHub release with the `.xdc` file:

```
git tag -a v1.0.1
git push origin v1.0.1
```

### Credits

- The sentences were extracted from the [Tatoeba](https://tatoeba.org/en/downloads) collection (licensed under CC-BY 2.0).

- Font used: [Press Start 2P](https://github.com/fontsource/font-files/tree/main/fonts/google/press-start-2p) by Google (OFL-1.1 licensed)

- Random monster generator inspired by https://masterpose.itch.io/pixelduuuuudesmaker

- UI Icons from "Pixel Icon" by [HackerNoon](https://github.com/hackernoon/pixel-icon-library) ([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/))

- Monster card's background created using tiles from https://cafedraw.itch.io/fantasy-card-assets

- Level-up SFX is "VictorySmall.wav" from https://opengameart.org/content/8-bit-sound-fx (CC0 - public domain)

- Success/error SFX are "1.wav" and "7.wav" from https://opengameart.org/content/8bit-sfx (CC0 - public domain)

- Click/select SFX is "vgmenuselect.ogg" from https://opengameart.org/content/8bit-menu-highlight (CC0 - public domain)
