# 6. theme.css, in one place

No em dashes anywhere in this document or any copy it generates.

This is the one page in the folder you are meant to paste. Nobody in this class
is writing CSS, and CSS is not what you are learning. What you are learning is
that a look lives in one file and components point at it by name, and that
idea survives whether or not you can read the rules below.

Open **Theme**, then **theme.css**. The `@import` line goes at the very top of
the file, above everything that is already there. The rest goes at the very
bottom. Then add each role name under **Theme**, then **Roles**, spelled as it
is here after `anvil-role-`.

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&family=JetBrains+Mono:wght@400;600&display=swap');
```

```css
/* Math Bros Inc. Everything below is from the Figma. */

body, .anvil-container, .anvil-component {
  font-family: 'DM Sans', system-ui, sans-serif;
}

/* Fonts */
.anvil-role-display, .anvil-role-display * {
  font-family: 'DM Serif Display', Georgia, serif;
  font-weight: 400;
  line-height: 1.1;
}
.anvil-role-eyebrow, .anvil-role-eyebrow * {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}
.anvil-role-mono, .anvil-role-mono *,
.anvil-role-mono input, .anvil-role-mono select {
  font-family: 'JetBrains Mono', Menlo, Consolas, monospace;
}

/* Buttons */
.anvil-role-pill button {
  border-radius: 999px;
  padding: 12px 32px;
  font-weight: 600;
  font-size: 14px;
  text-transform: none;
  box-shadow: none;
}
.anvil-role-pill-outline button {
  border-radius: 999px;
  padding: 12px 32px;
  font-weight: 600;
  font-size: 14px;
  text-transform: none;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: none;
}

/* Boxes */
.anvil-role-panel {
  border-radius: 24px;
  padding: 40px 32px;
}
.anvil-role-card {
  background: #ffffff;
  border: 2px solid #f3f4f6;
  border-radius: 16px;
  padding: 16px 20px;
  margin-bottom: 8px;
}
.anvil-role-card-you {
  background: #e8effe;
  border: 2px solid #1a4fd6;
  border-radius: 16px;
  padding: 16px 20px;
  margin-bottom: 8px;
}
.anvil-role-correct {
  background: #f0fdf4;
  border: 2px solid #86efac;
  border-radius: 16px;
  padding: 16px 24px;
}
.anvil-role-wrong {
  background: #fff1f2;
  border: 2px solid #fda4af;
  border-radius: 16px;
  padding: 16px 24px;
}
.anvil-role-chip {
  display: inline-block;
  border-radius: 999px;
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 600;
}

/* Optional. Do the eleven above first. */
.anvil-role-answer input, .anvil-role-answer select {
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  padding: 16px 20px;
  font-size: 18px;
  font-weight: 600;
  box-shadow: none;
}
.anvil-role-answer input:focus, .anvil-role-answer select:focus {
  border-color: #1a4fd6;
  outline: none;
}
.anvil-role-subject-icon {
  display: inline-block;
  width: 48px;
  height: 48px;
  line-height: 48px;
  border-radius: 12px;
  text-align: center;
  color: #ffffff;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  font-size: 18px;
}
.anvil-role-avatar {
  display: inline-block;
  width: 36px;
  height: 36px;
  line-height: 36px;
  border-radius: 50%;
  background: #f3f4f6;
  color: #6b7280;
  text-align: center;
  font-weight: 700;
  font-size: 14px;
}
.anvil-role-score-ring {
  width: 144px;
  height: 144px;
  line-height: 144px;
  border-radius: 50%;
  margin: 0 auto;
  text-align: center;
  color: #ffffff;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  font-size: 36px;
}
.anvil-role-narrow {
  max-width: 640px;
  margin: 0 auto;
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

If it is still square after those three, bring the role name and a screenshot
to the helper on your design brief page. That one is allowed to talk about
CSS, because there is no Python in it to give away.
