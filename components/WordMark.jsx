export default function WordMark({ dark = false, className = "" }) {
  if (dark) {
    // Light-background context — use logo with white bg, blend with multiply so white becomes transparent
    return (
      <img
        src="/logo-light.png"
        alt="The Startup"
        height={36}
        style={{ height: 36, width: "auto", display: "block", mixBlendMode: "multiply" }}
        className={className}
      />
    );
  }
  // Dark-background context — use logo with black bg, blend with screen so black becomes transparent
  return (
    <img
      src="/logo-dark.png"
      alt="The Startup"
      height={36}
      style={{ height: 36, width: "auto", display: "block", mixBlendMode: "screen" }}
      className={className}
    />
  );
}
