"use client"
// import DotPattern from "@/components/ui/dot-pattern";
// import Meteors from "@/components/ui/meteors";
import { RainbowButton} from "./ui/fancy-button"
// import { GlobeDemo } from "./globe";
import SparklesText from "./ui/sparkles-text";
import { MarqueeDemo } from "./marque-demo";
// import { NeonGradientCard } from "@/components/ui/neon-gradient-card";
// import RetroGrid from "@/components/ui/retro-grid";
// import { GlobeDemo } from "./globedemo";
// import { Cover } from "@/components/ui/cover";
// import { motion } from "framer-motion";
import AnimatedShinyText from "./ui/chamki-text";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import {  Highlight } from "./ui/highlight";
import { GeistMono } from "geist/font/mono";
const Hero = () => {
  return (
    <div className="mt-0 w-full md:mt-16">

     
      <div className={GeistMono.className}>

      <h1 className="z-10 text-4xl sm:text-xl lg:text-xl font-bold mb-4 text-center" style={{ fontFamily: 'GeistMono' }}>
        <SparklesText text="Charge Up Your Workflow," className="text-4xl sm:text-5xl block" sparklesCount={2}/>
        <SparklesText text="Unlock " className="text-4xl sm:text-5xl inline" sparklesCount={2}/>
        <span className="text-4xl sm:text-5xl"> 100x Team Potential! </span>
      </h1>
      </div>
      <div className="z-10 text-lg sm:text-xl lg:text-xl mb-8 text-center">
        <p className="inline mr-2">
        Collabrixo is an all-in-one GTD-based work management app,
        with a       
        </p>
        <Highlight>

         personalized Digital Garden 
        </Highlight>
        <p className="inline ml-1">

        to store insights, track learnings, and organize team – all powered by AI to boost productivity.
        </p>
      </div>
      
      <div className="z-10 flex mt-4 justify-center space-x-4">
        {/* <RainbowButton>Coming Soon</RainbowButton> */}
        <div className="flex flex-col items-center space-y-2 sm:space-y-0 sm:flex-row sm:space-x-4">
          <RainbowButton>Coming Soon</RainbowButton>
          <div
            className={cn(
              "z-30 group rounded-full border border-black/5 bg-neutral-100 text-base text-white transition-all ease-in hover:cursor-pointer hover:bg-neutral-200 dark:border-white/5 dark:bg-neutral-900 dark:hover:bg-neutral-800",
            )}
          >
            <AnimatedShinyText className="z-30 flex items-center justify-center px-4 py-2 transition ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400">
              <span><a href="#team">📰 Subscribe to get notified</a></span>
              <ArrowRightIcon className="ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
            </AnimatedShinyText>
          </div>
        </div>
      </div>



      <div className="mt-20">
      {/* <span className="pointer-events-none whitespace-pre-wrap bg-gradient-to-b from-black to-gray-300/80 bg-clip-text text-center text-8xl font-semibold leading-none text-transparent dark:from-white dark:to-slate-900/10">
        share your experience through Digital Garden
      </span> */}
      <MarqueeDemo/>
        <p className="pointer-events-none whitespace-pre-wrap bg-gradient-to-b from-black to-gray-300/80 bg-clip-text text-center text-xl font-semibold leading-none text-transparent dark:from-white dark:to-slate-900/10 mb-4">
        Let the world know your story through Digital Garden
        </p>
        {/* <div className="flex justify-center">
          <GlobeDemo/>
        </div> */}
          
      </div>
    </div>
  );
};

export default Hero;