# Anvil check

Runs a team's project code guide as a real program.

A code guide is the one place in `docs/` where students are handed finished code
rather than patterns with blanks. Code that is only read is code nobody has run,
and a guide with a bug in it is worse than no guide, because the student trusts
it over their own file. So the guide gets executed.

```
python3 tools/anvil-check/run_app.py
```

`anvil_stub.py` stands in for the parts of Anvil the app touches: data tables,
server calls, forms, RepeatingPanels and their item templates, and the `@handle`
decorator. It is deliberately strict in two places where Anvil is strict and a
plain Python object would not be:

- `search()` returns something that is **not** a list, so a server function that
  forgets `list()` fails the way it fails in Anvil.
- A server call to a name nothing registered raises, rather than returning None.

`run_app.py` pulls the seven files straight out of
`06-every-file-in-one-place.md`, so the thing under test is the text a student
reads. It then plays the whole journey: filter the list, open a restaurant, read
a menu, open an item, tick two things, try to order with no address, and check
that nothing was saved.

It found a real bug the first time it ran: Anvil Number columns hold decimals, so
the nutrition screen said **850.0 calories**.

Add a check whenever a guide claims something a student could catch you on.
