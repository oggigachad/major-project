"use client";

const LOGOS = [
  "Loopwork",
  "Northbeam",
  "Fernwood",
  "Kestrel",
  "Alderline",
  "Mosaic Labs",
  "Brightfold",
  "Tidepool",
  "Cobalt & Co",
  "Hearthside",
  "Junepath",
  "Ravel Systems",
];

export function LogoBand() {
  return (
    <section aria-label="Trusted by teams" className="bg-[#1c1a14] py-14">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <p className="text-center text-[13px] font-medium uppercase tracking-[0.18em] text-[#8a8578]">
          Trusted by teams we admire
        </p>

        {/* Marquee */}
        <div
          className="relative mt-8 overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
          }}
        >
          <div className="nota-marquee flex w-max items-center gap-16 pr-16">
            {[...LOGOS, ...LOGOS].map((name, i) => (
              <span
                key={`${name}-${i}`}
                className="font-serif-display whitespace-nowrap text-[26px] font-medium tracking-tight text-[#f4f2ea]/45 transition-colors hover:text-[#f4f2ea]/80"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
