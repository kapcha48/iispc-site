import Image from "next/image";
import { withStaticBase } from "../lib/static-path";

export function Logo({
  className = "",
}: {
  className?: string;
  idPrefix?: string;
  showSubtitle?: boolean;
}) {
  return (
    <Image
      className={className}
      src={withStaticBase("/iispc-logo-approved.svg")}
      alt="IISPC — Международный институт социальной психотерапии и консультирования"
      width={1792}
      height={896}
      unoptimized
    />
  );
}
