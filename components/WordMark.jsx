export default function WordMark({ dark = false, className = "" }) {
  const color = dark ? "text-slate-900" : "text-white";
  return (
    <div className={`inline-flex flex-col leading-none select-none ${color} ${className}`}>
      <span className="text-[8px] font-bold tracking-[0.45em] uppercase opacity-70 ml-px">THE</span>
      <span className="text-[1.35rem] font-black tracking-tighter uppercase -mt-px">STARTUP</span>
    </div>
  );
}
