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

export function PlayerPhoto({ name, photoUrl, size = "md", className }: PlayerPhotoProps) {
  const url = resolveUploadUrl(photoUrl);
  if (!url) return <Avatar name={name} size={size} className={className} />;

  return (
    <img
      src={url}
      alt={name}
      className={cn("shrink-0 rounded-full object-cover ring-1 ring-white/10", sizeStyles[size], className)}
    />
  );
}
