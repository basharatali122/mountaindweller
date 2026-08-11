import { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { FadeIn, AuroraBackground } from "@/components/anim/Primitives";

interface PolicyPageProps {
  title: string;
  subtitle?: string;
  updated?: string;
  children: ReactNode;
}

export function PolicyPage({ title, subtitle, updated, children }: PolicyPageProps) {
  return (
    <>
      <section className="relative pt-36 pb-20 overflow-hidden bg-gradient-hero">
        <AuroraBackground />
        <div className="container mx-auto px-4 relative z-10">
          <FadeIn className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6 text-sm">
              <ShieldCheck className="w-4 h-4 text-primary" /> Legal
            </span>
            <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-5">
              {title}
            </h1>
            {subtitle && (
              <p className="text-muted-foreground text-lg leading-relaxed">{subtitle}</p>
            )}
            {updated && (
              <p className="text-muted-foreground/70 text-sm mt-4">{updated}</p>
            )}
          </FadeIn>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-card border border-border rounded-3xl p-6 md:p-12 shadow-sm">
            <div className="policy-prose">{children}</div>
          </div>
        </div>
      </section>
    </>
  );
}
