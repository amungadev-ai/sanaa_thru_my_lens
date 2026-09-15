/**
 * Google AdSense ad slot.
 * Uses real AdSense code with the publisher ID.
 *
 * Usage: <AdSlot slotId="1234567890" className="..." />
 *
 * To get slot IDs:
 * 1. Go to AdSense → Ads → By ad unit → Create ad unit
 * 2. Choose "Display ads" (responsive)
 * 3. Copy the data-ad-slot number from the generated code
 * 4. Pass it as slotId prop
 *
 * Until you have specific slot IDs, the component shows a labeled placeholder.
 */

interface AdSlotProps {
  slotId?: string;
  className?: string;
  label?: string;
  format?: string;
}

export function AdSlot({
  slotId,
  className,
  label = "Advertisement",
  format = "auto",
}: AdSlotProps) {
  // If no slotId, show a placeholder (ads are configured but no specific ad unit created yet)
  if (!slotId) {
    return (
      <div
        className={`flex min-h-[250px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-secondary/20 p-4 text-center ${className ?? ""}`}
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/40">
          {label}
        </span>
        <span className="mt-1 text-xs text-muted-foreground/30">
          Google Ad · Create an ad unit in AdSense to display ads here
        </span>
      </div>
    );
  }

  // Real AdSense ad unit
  return (
    <div className={className}>
      <span className="mb-1 block text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/40">
        {label}
      </span>
      <ins
        className="adsbygoogle"
        style={{ display: "block", minHeight: 250 }}
        data-ad-client="ca-pub-8031704055036556"
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
      <script dangerouslySetInnerHTML={{
        __html: "(adsbygoogle = window.adsbygoogle || []).push({});"
      }} />
    </div>
  );
}
