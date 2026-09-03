# When Anvil shows you red text

No em dashes anywhere in this document or any copy it generates.

**Red text is not you failing. It is the computer telling you exactly what is
wrong**, in a language you have not learned yet. This page is the translation.

Find the words from your error below. You do not need to understand the whole
message, just the first line.

---

## How to read any error

An error has three useful parts:

1. **The last line** says what kind of problem it is. Read this first.
2. **The line number** says where. Anvil usually highlights it for you.
3. **Everything in the middle** is where the computer went looking. You can
   ignore it for now.

So in `AttributeError: 'NoneType' object has no attribute 'text'`, the part that
matters is `AttributeError` and `text`.

---

## The errors you will actually hit

### `AttributeError: 'Form1' object has no attribute 'lbl_total'`

**What it means:** your code is asking for something that is not on the form.

**Almost always:** the **name** in Design view does not match the name in your
code. `lbl_total` in the code, `label_1` in the designer.

**What to check:** click the component in Design view and look at **name** in
Properties. Make it match your architecture page, then make your code match too.

---

### `AttributeError: 'NoneType' object has no attribute 'text'`

**What it means:** something you expected to exist is empty, so there is nothing
to read `.text` from.

**Usually one of two things:**
- A `.get()` on a table found nothing, so it handed back nothing. Check the
  value you searched for actually exists in the table.
- You are reading a component before the form has finished loading. Move the
  line into your handler instead of the top of the file.

---

### `NameError: name 'app_tables' is not defined`

**What it means:** you used `app_tables` without importing it.

**What to check:** the top of your **Server Module** needs both lines:

```python
import anvil.server
from anvil.tables import app_tables
```

If you are seeing this in a **Form** rather than a server module, that is the
real problem. Database code belongs in a Server Module. See First Steps, Part 2.

---

### Something about no server function with that name

**What it means:** your form asked the server for a function the server does not
have.

**Check both of these, in this order:**
1. Does the name in `anvil.server.call('add_thing')` match the name after
   `def add_thing` **exactly**? Capital letters and underscores count.
2. Is `@anvil.server.callable` on the line directly above the `def`? Without it
   the function exists but nobody outside the server may call it.

---

### `Permission denied` or a table error when you try to save

**What it means:** browser code is not allowed to write to your tables.

**This is Anvil protecting you, not a bug.** Move the database line into a
Server Module and call it from the form. See First Steps, Part 2.

---

### `ValueError: invalid literal for int() with base 10: ''`

**What it means:** you asked `int()` to turn an empty box into a number.

**What to check:** the text box was empty when the button was clicked. This is
exactly what Pattern 6 is for: check before you act.

```python
if self.txt_points.text:
    points = int(self.txt_points.text)
else:
    alert("Type a number first.")
```

---

### `TypeError: unsupported operand type(s) for +: 'str' and 'int'`

**What it means:** you tried to add a word to a number.

**Nearly always:** a text box gives you a **string**, even when it looks like a
number. `"5" + 1` is not a thing. Wrap it in `int()` first.

---

### `IndentationError` or `TabError`

**What it means:** the spaces at the start of your lines are wrong.

**In Python the spaces are part of the code.** Everything inside a function
must be indented the same amount. Do not mix tabs and spaces: pick spaces and
use the Tab key, which Anvil turns into spaces for you.

---

### `SyntaxError: invalid syntax`

**What it means:** Python cannot read the line at all.

**Check, in this order:**
1. A missing `:` at the end of a `def`, `if`, `else`, or `for` line.
2. A bracket you opened and never closed.
3. A quote you opened and never closed.

The highlighted line is sometimes the line *after* the real mistake, so look at
the line above too.

---

### My button does nothing, and there is no error at all

**This is the most confusing one because nothing happens.** Work down the list:

1. **Is the handler wired?** In Design view, click the button, and check the
   **click** event actually points at your function. If you typed the function
   by hand rather than letting Anvil write it, this is almost certainly it.
2. **Did you save and re-run?** Press Run again.
3. **Is anything in the function?** A function with only `pass` in it runs
   perfectly and does nothing.
4. **Put `print("here")` as the first line.** If you do not see `here` in the
   output panel, the function is not being called and it is problem 1. If you
   do see it, the function runs and the problem is further down.

That last step is the single most useful debugging move there is, and it works
on everything for the rest of your life.

---

## If your error is not on this page

Two things, in order:

1. **Read the last line out loud.** Genuinely. Errors are written in words, and
   saying it often makes it obvious.
2. **Ask the helper on your build page, in the "it is not working" box.** Paste
   the whole red message in. That is what it is for, and an error message is the
   one time it will show you code.

And write the error down when you solve it. You will see it again, and the
second time should be thirty seconds instead of ten minutes.
