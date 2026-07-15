// context:
//  "auto"     (default) — sits on a surface that follows the site theme; picks the right
//              logo variant via CSS so it flips instantly with the theme toggle, no JS/flicker.
//  "light-bg" — always sits on a light surface regardless of site theme (e.g. inside a card
//              that's intentionally white in both themes).
//  "dark-bg"  — always sits on a dark surface regardless of site theme (e.g. inside a panel
//              that's intentionally black in both themes).
export default function WordMark({ context = "auto", className = "" }) {
  // NOTE: display is driven by the Tailwind classes below, NOT inline style — an inline
  // `display: block` would beat `hidden`/`dark:hidden` (inline styles outrank classes) and
  // both variants would render at once, stacking two logos in the bar.
  const lightBgImg = (
    <img
      src="/logo-light.png"
      alt="The Startup"
      height={72}
      style={{ height: 72, width: "auto", mixBlendMode: "multiply" }}
      className={context === "auto" ? "block dark:hidden" : "block"}
    />
  );
  const darkBgImg = (
    <img
      src="/logo-dark.png"
      alt="The Startup"
      height={72}
      style={{ height: 72, width: "auto", mixBlendMode: "screen" }}
      className={context === "auto" ? "hidden dark:block" : "block"}
    />
  );

  if (context === "light-bg") return <span className={`inline-block leading-none ${className}`}>{lightBgImg}</span>;
  if (context === "dark-bg") return <span className={`inline-block leading-none ${className}`}>{darkBgImg}</span>;
  return (
    <span className={`inline-block leading-none ${className}`}>
      {lightBgImg}
      {darkBgImg}
    </span>
  );
}
