import Image from "next/image";

interface HamoLogoProps {
  className?: string;
  priority?: boolean;
}

const LOGO_WIDTH = 2066;
const LOGO_HEIGHT = 507;

export default function HamoLogo({
  className = "block h-8 w-auto",
  priority = false,
}: HamoLogoProps) {
  return (
    <Image
      src="/hamo-logo.svg"
      alt="HAMO"
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      className={className}
      priority={priority}
      unoptimized
    />
  );
}
