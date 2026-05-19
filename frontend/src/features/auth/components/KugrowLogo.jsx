import kugrowLogo from "../../../assets/kugrow logo.svg";

export default function KugrowLogo({
  layout = "stacked",
  className = "",
  imageClassName = "",
  wordmarkClassName = "",
}) {
  const markClassName =
    imageClassName ||
    (layout === "horizontal"
      ? "h-11 w-auto sm:h-12"
      : "mx-auto h-20 w-auto sm:h-24");
  const sharedWordmarkClassName =
    wordmarkClassName ||
    (layout === "horizontal"
      ? "text-[1.15rem] font-black tracking-[0.14em] text-slate-950 sm:text-[1.3rem]"
      : "mt-3 text-center text-[1.05rem] font-black tracking-[0.22em] text-slate-950 sm:text-[1.15rem]");

  if (layout === "horizontal") {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <img src={kugrowLogo} alt="Kugrow OS mark" className={markClassName} />
        <span className={sharedWordmarkClassName}>KUGROW_OS</span>
      </div>
    );
  }

  return (
    <div className={className}>
      <img src={kugrowLogo} alt="Kugrow OS mark" className={markClassName} />
      <div className={sharedWordmarkClassName}>KUGROW_OS</div>
    </div>
  );
}
