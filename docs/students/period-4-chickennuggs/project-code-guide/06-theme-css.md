# 6. theme.css, in one place

No em dashes anywhere in this document or any copy it generates.

This is the one page in the folder you are meant to paste. Nobody in this
class is writing CSS, and CSS is not what you are learning. What you are
learning is that a look lives in one file and components point at it by name,
and that idea survives whether or not you can read the rules below.

Open **Theme**, then **theme.css**. The `@import` line goes at the very top of
the file, above everything that is already there. The rest goes at the very
bottom. Then add each role name under **Theme**, then **Roles**, spelled as it
is here after `anvil-role-`.

```css
@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@700;800;900&family=DM+Sans:wght@400;600&display=swap');
```

```css
/* TrailRiders. Everything below is from the Figma. */

body, .anvil-container, .anvil-component {
  font-family: 'DM Sans', system-ui, sans-serif;
  color: #f5f6f5;
}

/* Fonts */
.anvil-role-display, .anvil-role-display * {
  font-family: 'Archivo', system-ui, sans-serif;
  font-weight: 900;
  text-transform: uppercase;
  line-height: 1.1;
}
.anvil-role-heading, .anvil-role-heading * {
  font-family: 'Archivo', system-ui, sans-serif;
  font-weight: 800;
  font-size: 14px;
  text-transform: uppercase;
}
.anvil-role-strong, .anvil-role-strong * {
  font-family: 'Archivo', system-ui, sans-serif;
  font-weight: 800;
}
.anvil-role-eyebrow, .anvil-role-eyebrow * {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #6b726b;
}

/* Buttons */
.anvil-role-pill button {
  font-family: 'Archivo', system-ui, sans-serif;
  font-weight: 800;
  font-size: 15px;
  text-transform: uppercase;
  border-radius: 999px;
  height: 50px;
  padding: 0 24px;
  box-shadow: none;
}
.anvil-role-pill-dark button {
  font-family: 'Archivo', system-ui, sans-serif;
  font-weight: 800;
  font-size: 14px;
  text-transform: uppercase;
  border-radius: 999px;
  height: 50px;
  padding: 0 24px;
  background: #242a24;
  color: #f5f6f5;
  border: 1px solid #3d453d;
  box-shadow: none;
}

/* Boxes */
.anvil-role-card {
  background: #1a1d1a;
  border: 1px solid #2a302a;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 8px;
}
.anvil-role-card-big {
  background: #1a1d1a;
  border: 1px solid #2a302a;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
}

/* Chips */
.anvil-role-chip, .anvil-role-chip-active, .anvil-role-chip-expert {
  display: inline-block;
  font-family: 'Archivo', system-ui, sans-serif;
  font-weight: 700;
  font-size: 11px;
  text-transform: uppercase;
  border-radius: 16px;
  padding: 4px 10px;
}
.anvil-role-chip {
  background: #1a1d1a;
  border: 1px solid #2a302a;
  color: #a3aaa3;
}
.anvil-role-chip-active {
  background: #ff5a00;
  color: #ffffff;
}
.anvil-role-chip-expert {
  background: rgba(198, 40, 40, 0.14);
  color: #e57373;
  border-radius: 6px;
}

/* Boxes you type in */
.anvil-role-field input, .anvil-role-field select {
  background: #1a1d1a;
  color: #f5f6f5;
  border: 1px solid #2a302a;
  border-radius: 12px;
  height: 44px;
  padding: 0 16px;
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 14px;
  box-shadow: none;
}
.anvil-role-field input::placeholder {
  color: #a3aaa3;
}
.anvil-role-field input:focus, .anvil-role-field select:focus {
  border-color: #ff5a00;
  outline: none;
}
```

## If something does not take

Anvil themes differ in how deep the real element sits inside a component, and
a rule that works on one theme can miss on another. Three things to try, in
order, before asking:

1. **Is the role name the same in three places?** In Roles, in the component's
   role property, and after `anvil-role-` in this file. One letter off in any
   of the three and nothing happens, silently.
2. **Did the file save, and did you run again?** theme.css only reaches the
   app when it runs.
3. **Add a star.** If `.anvil-role-pill button` does nothing on your theme,
   change it to `.anvil-role-pill button, .anvil-role-pill .btn` and try
   again. Widening the rule is how you find the element the theme is using.

**If the whole app is still white**, the theme's own background is winning.
Set Background to `#0f110f` in the colour scheme first, which is page 1, step
1. If a TextBox is still white after that, the `field` role above fixes it,
so check that the role is on the component.

If it is still wrong after those, bring the role name and a screenshot to the
helper on your design brief page. That one is allowed to talk about CSS,
because there is no Python in it to give away.
