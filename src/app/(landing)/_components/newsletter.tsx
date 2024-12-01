"use client";
// import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

import { cn } from "@/lib/utils";
// import { DotPattern } from "../../../components/ui/dot-pattern";
import { RainbowButton } from './ui/fancy-button';
// import GradualSpacing from "@/components/ui/gradual-spacing";
// import Particles from "@/components/ui/particles";
import { VelocityScroll } from "@/app/(landing)/_components/ui/scroll-based-velocity";
// impoer VelocityScroll from "@/components/ui/scroll-
export function DotPatternDemo() {
  return (
  

    <div className={cn(GeistMono.className, "relative flex h-[500px] w-full flex-col items-center justify-center overflow-hidden rounded-lg border bg-white bg-opacity-30 dark:bg-black dark:bg-opacity-30 md:shadow-xl")}>
      <span className="pointer-events-none mb-5 whitespace-pre-wrap bg-gradient-to-b from-black to-gray-300/80 bg-clip-text text-center text-5xl font-semibold leading-none text-transparent dark:from-white dark:to-slate-900/10">
      Subscribe to our newsletter
      </span>
      <VelocityScroll
      text="Get latest updates and changelogs"
      default_velocity={2}
      className="font-display text-center text-xl font-semibold tracking-[-0.02em] text-black drop-shadow-sm dark:text-white md:text-3xl md:leading-[3rem]"
    />
      <form
        action="https://api.web3forms.com/submit"
        method="POST"
        className="mt-4 flex flex-col items-center space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const formData = new FormData(form);
          try {
        const response = await fetch(form.action, {
          method: form.method,
          body: formData,
        });
        const data = await response.json();
        if (data.success) {
          const button = form.querySelector('button[type="submit"]') as HTMLButtonElement;
          button.textContent = "Subscribed :)";
        }
          } catch (error) {
        console.error('Error:', error);
          }
        }}
      >
        <input type="hidden" name="access_key" value={process.env.NEXT_PUBLIC_ACCESS_KEY} />

        <input
          name="email_id"
          type="email"
          placeholder="quadeer@collabrixo.com"
          className="z-10 bg-opacity-0 dark:bg-black w-80 p-2 rounded border"
        />
        <RainbowButton type="submit" className="z-10">
          Subscribe
        </RainbowButton>
      </form>
    </div>
  );
}
