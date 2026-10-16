import { Host } from "@/data/hosts";
import { avatarKey, listPhotoUrls } from "@/lib/photos";

const sizes = {
  sm: "h-12 w-12 text-lg",
  md: "h-16 w-16 text-2xl",
  lg: "h-28 w-28 text-5xl",
};

/** Профилна фотографија ако е качена, инаку почетна буква на градиент. */
export default async function HostAvatar({
  host,
  size = "md",
}: {
  host: Host;
  size?: keyof typeof sizes;
}) {
  const urls = await listPhotoUrls(avatarKey(host.slug));
  const photo = urls[urls.length - 1];

  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photo}
        alt={host.name}
        className={`shrink-0 rounded-full object-cover ${sizes[size]}`}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white ${host.gradient} ${sizes[size]}`}
      aria-hidden
    >
      {host.name[0]}
    </div>
  );
}
