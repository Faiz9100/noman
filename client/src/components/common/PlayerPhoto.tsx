import { useEffect, useState } from "react";
import { Avatar } from "./Avatar";
import { resolveUploadUrl, cn } from "../../utils/helpers";

interface PlayerPhotoProps {
  name: string;
  photoUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeStyles = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
  xl: "h-24 w-24",
};

/**
 * The single reusable player-photo renderer used on every page (Players,
 * Team Roster, Live Auction, Projector, Auction History, Dashboard) so
 * there's exactly one place that knows how to resolve and fall back a
 * photo. If the URL is missing, or the image fails to actually load (a
 * 404 from storage, a network hiccup), this always falls back to the
 * initials avatar — never a broken-image icon.
 */
export function PlayerPhoto({ name, photoUrl, size = "md", className }: PlayerPhotoProps) {
  const url = resolveUploadUrl(photoUrl);
  const [failed, setFailed] = useState(false);

  // Re-arm the fallback whenever the photo actually changes (e.g. an admin
  // edit swaps a previously-broken photo for a working one) instead of
  // permanently sticking on the avatar after one failure.
  useEffect(() => setFailed(false), [url]);

  if (!url || failed) return <Avatar name={name} size={size} className={className} />;

  return (
    <img
      src={url}
      alt={name}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("shrink-0 rounded-full object-cover ring-1 ring-white/10", sizeStyles[size], className)}
    />
  );
}
