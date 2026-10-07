export function Footer() {
  return (
    <footer className="mt-16 bg-bms text-white/85">
      <div aria-hidden className="tape h-2" />
      <div className="mx-auto flex max-w-content flex-col gap-2 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>A BMS Beautification Committee fundraiser. Staff spots only. Students keep their crayons.</p>
        <p>
          Built by{" "}
          <a href="https://doubleblaze.solutions" className="underline decoration-tape underline-offset-4 hover:text-tape">
            Double Blaze Solutions
          </a>
        </p>
      </div>
    </footer>
  );
}
