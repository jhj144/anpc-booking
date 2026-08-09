import Image from "next/image";

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 32, className = "" }: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="ANPC"
      width={size}
      height={size}
      className={`rounded-lg ${className}`}
      priority
    />
  );
}
