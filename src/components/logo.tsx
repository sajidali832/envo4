import Link from "next/link";

export const EnvoEarnLogo = ({ inHeader = false }: { inHeader?: boolean }) => {
  const content = (
      <div className="flex items-center gap-2">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="8" fill="hsl(var(--primary))"/>
          <path d="M12.216 24V8.016H14.16L19.464 19.344V8.016H21.216V24H19.272L13.968 12.672V24H12.216Z" fill="hsl(var(--primary-foreground))"/>
        </svg>
        <span className="text-xl font-bold font-headline">ENVO-EARN</span>
      </div>
  );

  return inHeader ? <Link href="/">{content}</Link> : content;
};
