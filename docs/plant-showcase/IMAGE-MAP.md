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

## Why they are not identified, and what unblocks it

Identifying a flower from a photo means looking at the photo, and moving a photo
into this repository means copying its bytes. Neither is possible from the
Claude Code web environment as it stands:

- Its network egress policy blocks `drive.google.com` and
  `googleusercontent.com`, so the files cannot be downloaded.
- The Drive tool that returns file contents returns them as base64 text, which
  for a folder of this size is far too large to pass through a conversation.
- The Drive tool that reads a file returns text found in it. These are
  photographs with no text, so it returns nothing.

Any one of these fixes it:

1. **Rename the files in Drive** to include the plant name. Identification is
   then done and only the copying is left.
2. **Download the folder and drop the files in** under
   `apps/platform/public/plant-showcase/<plant>/`. One bulk download, then drag.
3. **Allow `drive.google.com` and `googleusercontent.com`** in the environment's
   network egress settings, and share the folder as "anyone with the link".
   Both halves can then be done here.

## Photo credits are required

Several filenames name a source: Proven Winners, Heydens Gardens, Direct
Gardening. Those are commercial nursery photos, and a school site republishing
them needs either permission or a credit, depending on the site. Whoever adds
them should fill in `photoAuthor` and `photoLicense` in the plant's front matter.
A reference photo with no credit renders a visible warning on the page rather
than shipping quietly, which is the intended behaviour.
