# Plant showcase images

One folder per plant, named the same as its markdown file in
`docs/plant-showcase/plants`. Drop image files straight in.

Three filenames mean something:

- `drawing.jpg` (or `.png`, `.webp`) is the student's own drawing, scanned or
  photographed. It is the picture the page leads with.
- `reference.jpg` is a photo of the species, standing in until there is a real
  plant to photograph. Pages label it as a stand-in, and it needs credit fields
  in the plant's front matter or the page shows a warning. `npm run
  plant-photos` fetches these and fills the credits in automatically.
- Anything else is a growth log photo. Name it whatever you like and reference
  it from the growth log with a `photo:` line.

A growth log photo beats the drawing, and the drawing beats the reference photo,
so pages improve on their own as real pictures arrive.

Nothing here is resized or processed, so keep photos under about 1 MB. A phone
photo exported at "medium" is fine.

If a growth log entry names a photo that is not in this folder, the site says so
on the page rather than showing a broken image, so a typo is easy to spot.
