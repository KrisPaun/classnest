import { Host } from "@/data/hosts";

const sizes = {
  sm: "h-12 w-12 text-lg",
  md: "h-16 w-16 text-2xl",
  lg: "h-28 w-28 text-5xl",
};

export default function HostAvatar({
  host,
  size = "md",
}: {
  host: Host;
  size?: keyof typeof sizes;
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white ${host.gradient} ${sizes[size]}`}
      aria-hidden
    >
      {host.name[0]}
    </div>
  );
}
