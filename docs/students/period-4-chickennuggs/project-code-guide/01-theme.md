# 1. Colours, fonts, icons and roles: set once

No em dashes anywhere in this document or any copy it generates.

Everything on every screen of your design is made from one orange, three
greys, two fonts and about six shapes: a pill button, a bordered card, a chip,
a small capitals label, a big capitals title, a search box. Anvil lets you
define each of those **once** and then point components at them by name. That
is the whole trick, and it takes twenty minutes.

Do not skip this page and go and colour buttons one at a time. You will colour
thirty of them, and the day the team changes the orange you will do it again.

## 1. Colours, into the theme

In the App Browser on the left, open **Theme**, then **Colour Scheme**. You
will see a list of named colours. Type the hex codes in.

Your design is dark. Anvil's themes start light, and you make them dark by
giving the background and surface colours dark values, which is what the
tables below do. If your theme offers a dark scheme, switch it on first and
then type these over the top.

Which names you see depends on which theme your app was made with. Look at the
first name in the list:

**If the list says "Primary", "On Primary", "Surface"** you are on Anvil's
Material 3 theme.

| Theme colour | Hex |
|---|---|
| Primary | `#ff5a00` |
| On Primary | `#ffffff` |
| Primary Container | `#1a1d1a` |
| On Primary Container | `#ff5a00` |
| Secondary | `#3e6b35` |
| On Secondary | `#ffffff` |
| Tertiary | `#e57373` |
| Background | `#0f110f` |
| Surface | `#0f110f` |
| On Surface | `#f5f6f5` |
| Surface Variant | `#1a1d1a` |
| On Surface Variant | `#a3aaa3` |
| Outline | `#2a302a` |
| Outline Variant | `#3d453d` |
| Error | `#e57373` |

**If the list says "Primary 500", "Primary 700", "Secondary 500"** you are on
the older Material Design theme.

| Theme colour | Hex |
|---|---|
| Primary 500 | `#ff5a00` |
| Primary 700 | `#ef6c00` |
| Primary 100 | `#1a1d1a` |
| Secondary 500 | `#3e6b35` |
| Background | `#0f110f` |
| Text | `#f5f6f5` |
| Disabled | `#6b726b` |
| Divider | `#2a302a` |
| Error | `#e57373` |

If a name in your list is not in the table, leave it. If a name in the table
is not in your list, put the hex on whichever of yours is closest.

From now on, when a page says *background: Primary*, you pick that named
colour from the dropdown on the component. You do not type the hex again.

**Two colours the theme has no slot for**, so they are typed by hand where
they appear: the quiet text `#6b726b` for small capitals labels and
timestamps, and the raised grey button `#242a24`. Both are in the roles on
page 6 so you will rarely need to.

## 2. Fonts, into theme.css

Two fonts. **Archivo** for anything in capitals: titles, buttons, values,
chips. **DM Sans** for everything else. Both are free from Google Fonts.

Open **Theme**, then **theme.css**, and put this at the very top of the file:

```css
@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@700;800;900&family=DM+Sans:wght@400;600&display=swap');
```

The rest of the CSS is on page 6, in one block. It sets DM Sans as the font
for everything and gives you a role for the Archivo pieces.

## 3. Icons, from Anvil

The design uses about twenty small line icons: a compass, a shopping bag, a
star, a magnifying glass. **Do not export them from Figma.** Anvil has a set
of line icons built in, and every Label, Button and Link has an **icon**
property where you type one. The look is close enough that nobody will tell,
and it means the icon changes colour with the text, which an exported picture
never will.

| In the Figma | Type this in the icon property |
|---|---|
| compass (Explore tab) | `fa:compass` |
| shopping-bag (Shop tab, shop header) | `fa:shopping-bag` |
| activity-square (Ride tab) | `fa:heartbeat` |
| users (Feed tab) | `fa:users` |
| user-round (Profile tab) | `fa:user` |
| star (ratings) | `fa:star` |
| search | `fa:search` |
| sliders-horizontal (filters) | `fa:sliders` |
| bike (the map marker) | `fa:bicycle` |
| plus-circle (add to cart), plus (new post) | `fa:plus-circle`, `fa:plus` |
| chevron-left (back) | `fa:chevron-left` |
| bookmark (save) | `fa:bookmark-o` |
| arrow-down-right (start ride) | `fa:arrow-right` |
| pause, stop-circle | `fa:pause`, `fa:stop-circle` |
| trophy, mountain, droplets (badges) | `fa:trophy`, `fa:flag`, `fa:tint`. There is no mountain. |
| map-pin-check (a ride done) | `fa:map-marker` |
| heart, message-circle (likes, comments) | `fa:heart-o`, `fa:comment-o` |
| circle-x (the logo mark on the home screen) | `fa:times-circle-o` |

The one real picture in the design is the forest photo behind the home
screen. If you want it, the designer exports it as a PNG and it goes in as an
Image component. Page 2 says whether you want it.

## 4. Roles

A role is a name you give a component so that a rule in theme.css applies to
it. It is how one button can be told to be a pill, and how the next one can
too, without either of them knowing the CSS.

Open **Theme**, then **Roles**, and add each of these by name. Then set the
role on a component from its role property. The CSS that makes each one work
is on page 6.

| Role | Put it on | What it does |
|---|---|---|
| `display` | The app name, screen titles | Archivo Black, capitals |
| `heading` | Section titles like TRAIL OVERVIEW | Archivo ExtraBold, 14, capitals |
| `strong` | Values, card titles, chip text | Archivo ExtraBold |
| `eyebrow` | Small capitals labels like DISTANCE | 10, capitals, quiet grey |
| `pill` | The orange buttons | Orange, white capitals text, fully rounded, 50 tall |
| `pill-dark` | The grey Pause button | Raised grey, bordered, fully rounded |
| `card` | A ColumnPanel used as a card | Card grey, border, radius 12, padding 12 |
| `card-big` | A ColumnPanel with more room | Same, radius 16, padding 16 |
| `chip` | Difficulty badges, category tabs | Small capitals in a small rounded box |
| `chip-active` | The selected chip | Orange with white text |
| `chip-expert` | The Expert badge | Red text on a red tint |
| `field` | TextBoxes and DropDowns | Card grey, border, rounded, grey placeholder |

Twelve. Do them all now, in one go, and every page after this is just
picking names from a dropdown.
