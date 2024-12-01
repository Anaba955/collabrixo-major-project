"use client";
import { cn } from "@/lib/utils";

import Marquee from "./ui/marque";
import Image from "next/image";
const reviews = [
  {
    name: "Abdul Rahman",
    username: "beta_tester_1",
    body: "It's easy to manage the team and be productive.",
    img: "https://avatar.vercel.sh/abdul-rahman.svg?text=🕶",
  },
  {
    name: "Syed Faiz",
    username: "beta_tester_2",
    body: "Can't wait for the final product; the beta version is mind-blowing.",
    img: "https://avatar.vercel.sh/faiz.svg?text=☃️",
  },
  {
    name: "Nadaar",
    username: "beta_tester_3",
    body: "I love the insights feature; it makes my work simple.",
    img: "https://avatar.vercel.sh/nadaar.svg?text=♟️",
  },
  {
    name: "Salaar",
    username: "beta_tester_4",
    body: "It's easy to manage the team and be productive.",
    img: "https://avatar.vercel.sh/salaar.svg?text=🌲",
  },
  {
    name: "Mohammad Abdul Aleem",
    username: "@beta_tester_5",
    body: "I'm speechless. This is absolutely fantastic.",
    img: "https://avatar.vercel.sh/aleem.svg?text=👨‍💻",
  },
  {
    name: "Fasi",
    username: "beta_tester_6",
    body: "This is beyond words. I'm impressed.",
    img: "https://avatar.vercel.sh/fasi.svg?text=🌠",
  },
  {
    name: "Summaiya",
    username: "beta_tester_7",
    body: "The idea is amazing, as expected from the development team.",
    img: "https://avatar.vercel.sh/summu.svg?text=🌹",
  },
  {
    name: "Arshad",
    username: "beta_tester_8",
    body: "Great Product, keep it up guys.",
    img: "https://avatar.vercel.sh/summaiya.svg?text=🛼",
  },
];



const firstRow = reviews.slice(0, reviews.length / 2);
const secondRow = reviews.slice(reviews.length / 2);
 
const ReviewCard = ({
    img,
    name,
    username,
    body,
  }: {
    img: string;
    name: string;
    username: string;
    body: string;
  }) => {
    return (
      <figure
        className={cn(
          "relative w-64 cursor-pointer overflow-hidden rounded-xl border p-4",
          // light styles
          "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
          // dark styles
          "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]",
        )}
      >
        <div className="flex flex-row items-center gap-2">
          <Image className="rounded-full" width="32" height="32" alt="" src={img} />
          <div className="flex flex-col">
            <figcaption className="text-sm font-medium dark:text-white">
              {name}
            </figcaption>
            <p className="text-xs font-medium dark:text-white/40">{username}</p>
          </div>
        </div>
        <blockquote className="mt-2 text-sm">{body}</blockquote>
      </figure>
    );
  };
   
  export function MarqueeDemo() {
    return (
      <div className=" flex h-[300px] flex-col items-center justify-center overflow-hidden rounded-lg border  md:shadow-xl">
        <Marquee pauseOnHover className="[--duration:20s]">
          {firstRow.map((review) => (
            <ReviewCard key={review.username} {...review} />
          ))}
        </Marquee>
        <Marquee reverse pauseOnHover className="[--duration:20s]">
          {secondRow.map((review) => (
            <ReviewCard key={review.username} {...review} />
          ))}
        </Marquee>
        {/* <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-white dark:from-background"></div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-white dark:from-background"></div> */}
      </div>
    );
  }