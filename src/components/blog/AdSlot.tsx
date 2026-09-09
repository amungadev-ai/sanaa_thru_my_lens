/**
 * Google AdSense placeholder slot.
 * Replace the placeholder content with real AdSense code when ready.
 *
 * Usage: <AdSlot slotId="sidebar-1" className="..." />
 *
 * When you have AdSense approved:
 * 1. Add the AdSense script to layout.tsx <head>
 * 2. Replace the placeholder div with an <ins className="adsbygoogle"> tag
 */

interface AdSlotProps {
  slotId: string;
  className?: string;
  label?: string;
}

export function AdSlot({ slotId, className, label = "Advertisement" }: AdSlotProps) {
  return (
    <div
      data-ad-slot={slotId}
      className={`flex min-h-[250px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-secondary/20 p-4 text-center ${className ?? ""}`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/40">
        {label}
      </span>
      <span className="mt-1 text-xs text-muted-foreground/30">
        Google Ad · {slotId}
      </span>
      {/* 
        When AdSense is approved, replace with:
        <ins className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
          data-ad-slot={slotId}
          data-ad-format="auto"
          data-full-width-responsive="true">
        </ins>
      */}
    </div>
  );
}
