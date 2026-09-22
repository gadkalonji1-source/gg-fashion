export function BrandLogo({
  className = "h-14 w-14",
  alt = "G.G FASHION",
}: {
  className?: string;
  alt?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.jpg"
      alt={alt}
      className={`object-contain ${className}`}
      width={112}
      height={112}
    />
  );
}
