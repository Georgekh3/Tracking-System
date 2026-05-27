import { ImageIcon } from "lucide-react";

export function ItemPhoto({
  imagePath,
  name,
  size = "md"
}: {
  imagePath: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const className =
    size === "sm"
      ? "h-12 w-12"
      : size === "lg"
        ? "h-28 w-36"
        : "h-16 w-16";

  return (
    <div className={`${className} overflow-hidden rounded-md border border-atelier-line bg-slate-100`}>
      {imagePath ? (
        <img
          src={`/api/item-images/${imagePath}`}
          alt={name}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-slate-400">
          <ImageIcon className="h-5 w-5" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
