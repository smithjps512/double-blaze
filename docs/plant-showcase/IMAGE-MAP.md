# Site images: what goes where

The "site images" folder in Drive holds 27 photos to use as reference pictures.
This file records which ones have been identified and where each belongs.

<https://drive.google.com/drive/folders/1TDhqL1lWd-k9wCcTWChkUxe_484_VmZi>

Reference photos are photos of the species, not of the plants in our greenhouse,
so every page that shows one says so. Drop a file in as `reference.jpg` (or
`.png`, `.webp`) in the plant's folder under
`apps/platform/public/plant-showcase/`, then add the credit lines to that
plant's front matter or the page will show an uncredited warning.

## Identified from the filename

| Drive file | Species | Goes to |
| --- | --- | --- |
| `Rudbeckia hirta.cmyk.bcwebmerv.20180619_103700__35615.jpg` | *Rudbeckia hirta* | `black-eyed-susan/reference.jpg` |
| `Baptisia-Bicolor-Flower-Heydens-Gardens-400x533.jpg` | *Baptisia* hybrid | `blue-wild-indigo/reference.jpg` |
| `Baptisia-Decadence-Periwinkle-Popsicle-Photo-Credit-Proven-Winners-400x533.jpg` | *Baptisia* cultivar | spare for blue wild indigo |
| `Tickseed-Coreopsis-Butterfly-5.jpg` | *Coreopsis* with a butterfly | `tickseed-coreopsis/reference.jpg` |
| `Coreopsis pubescens cmykbcweb. sw__00958.webp` | *Coreopsis pubescens* | spare for tickseed |
| `spiderwort.png` | *Tradescantia* | `virginia-spiderwort/reference.png` |
| `Lobelia-cardinalis.webp` | *Lobelia cardinalis* | `cardinal-flower/reference.webp` |
| `Viola_sororiaP4160003BCWEB__90757.jpg` | *Viola sororia* | `common-blue-violet/reference.jpg` |

The last two had no page, so `cardinal-flower.md` and `common-blue-violet.md`
were created for them. Both are marked `source: unclaimed`, which makes the page
say that no student has written the plant up and invite one to claim it.

## Not identified

Twenty files carry no species in the name and could not be identified:

`27399_1800x1800.jpg`, `direct-gardening-perennials-09062-64_1000.jpg`,
`IMG_7577-1920x1012.jpg`, `images (16).jpeg`, `images (17).jpeg`, `image.png`,
`image (1).png`, `image (2).png`, `image (3).png`, `image (4).png`,
`image (5).png`, `image (6).png`, `image (7).png`, `unnamed.png`,
`unnamed (1).png`, `Screenshot 2026-09-02 10.15.45.png`,
`Screenshot 2026-09-09 10.31.43 AM.png`,
`Screenshot 2026-09-09 10.31.43 AM (1).png`,
`Screenshot 2026-09-09 10.37.43 AM.png`.

Note that the two `10.31.43 AM` screenshots are the same size to the byte and
are almost certainly duplicates of each other.

## How the unidentified ones get named

There is a classroom page for this, "Name That Plant":

<https://claude.ai/code/artifact/d1e882a3-f864-44f2-ad1e-c0807c50c343>

It lists all 23 photos by the filename they have in Drive. A student types what
they think a plant is, or votes for a name someone else put up, and votes appear
live on every open device. The four nursery photos get their own tab, where the
species is already known and students submit somewhere a usable photo can be
found instead. Names and votes are anonymous, one vote per plant per device.

The page is shared read-only with the class. Teacher tools are visible only to
someone with edit access: attach a photo to a specimen, ask Claude for a second
opinion on what it is, and settle a name once the class agrees.

That page is also how the photos reach this repository. Once a specimen is
settled, its confirmed name and its uploaded image can both be read back out of
the artifact and committed here, which is the step that Drive could not do.

## Why this was not done directly

Identifying a flower means looking at the photo, and moving a photo into this
repository means copying its bytes. Neither is possible from the Claude Code web
environment as it stands:

- Its network egress policy blocks `drive.google.com` and
  `googleusercontent.com`, so the files cannot be downloaded.
- The Drive tool that returns file contents returns them as base64 text, which
  for a folder of this size is far too large to pass through a conversation.
- The Drive tool that reads a file returns text found in it. These are
  photographs with no text, so it returns nothing.

Renaming the files in Drive to include the plant name, or downloading the folder
and dropping the files into `apps/platform/public/plant-showcase/<plant>/`, both
also work and need no classroom time.

## Photo credits are required

Several filenames name a source: Proven Winners, Heydens Gardens, Direct
Gardening. Those are commercial nursery photos, and a school site republishing
them needs either permission or a credit, depending on the site. Whoever adds
them should fill in `photoAuthor` and `photoLicense` in the plant's front matter.
A reference photo with no credit renders a visible warning on the page rather
than shipping quietly, which is the intended behaviour.
