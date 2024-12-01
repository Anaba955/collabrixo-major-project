// "use client"

import Hero from "./_components/hero";

import { Featuresbox } from "./_components/features";
import { BoxRevealDemo } from "./_components/animated-box";
import { AnimatedBeamMultipleOutputDemo } from "./_components/beam-demo";
// mport { AnimatedBeamMultipleOutputDemo
// import GradualSpacing from "@/components/ui/gradual-spacing";

import { GeistMono } from "geist/font/mono";
import { cn } from "@/lib/utils";
import { DotPatternDemo } from "./_components/newsletter";

import { AnimatedTooltipPreview } from "./_components/team";
export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4 sm:px-6 lg:px-8">

      {/* <DotPattern /> */}
      {/* <RetroGrid/> */}
      <Hero />
      <div id="features">

      {/* <GradualSpacing
        className={cn(GeistMono.className,"mt-12 font-display text-center text-xl font-semibold -tracking-widest  text-black dark:text-white md:text-7xl md:leading-[5rem]")}
        text="What we offer"
      /> */}
      <h4 className="mt-12 font-display text-center text-xl font-semibold -tracking-widest  text-black dark:text-white md:text-7xl md:leading-[5rem]">What we offer</h4>
      <Featuresbox />
      </div>
      <div className="flex flex-wrap justify-center gap-16 mt-8">

        <div className="flex-1 min-w-[300px]">
          <BoxRevealDemo />
        </div>
        <div className="flex-1 min-w-[300px]">
          <AnimatedBeamMultipleOutputDemo />
        </div>
      </div>
      <div className={cn(GeistMono.className,"flex-1 mt-28 min-w-[300px]")} id="team">
        <h1 className="mb-7 text-xl font-semibold">Meet the team</h1>
        <AnimatedTooltipPreview />
      </div>
      {/* <div id="newsletter"> */}

      <DotPatternDemo />
      {/* </div> */}
    </div>
  );
}