import Image from "next/image";
import Link from "next/link";

const logoSize = 32;

export function VamoLogo({
  href,
  showName = true,
  className = "",
  size = logoSize,
}: {
  href?: string;
  showName?: boolean;
  className?: string;
  size?: number;
}) {
  const content = (
    <>
      <Image
        src="/vamo-logo.png"
        alt="Vamo"
        width={size}
        height={size}
        className="flex-shrink-0 rounded-full"
        priority
      />
      {showName && (
        <span className="font-heading text-lg sm:text-xl font-bold text-primary whitespace-nowrap">
          Vamo
        </span>
      )}
    </>
  );

  const wrapperClass = `flex items-center gap-2 ${className}`.trim();

  if (href) {
    return (
      <Link href={href} className={wrapperClass}>
        {content}
      </Link>
    );
  }
  return <span className={wrapperClass}>{content}</span>;
}
