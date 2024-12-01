"use client"
import { CalendarIcon, FileTextIcon } from "@radix-ui/react-icons";
import { BellIcon, Share2Icon } from "lucide-react";
import Iphone15Pro from "@/app/(landing)/_components/ui/iphone-15-pro";
import Safari from "@/app/(landing)/_components/ui/safari";
import { cn } from "@/lib/utils";
import React from "react";
import { Calendar } from "@/app/(landing)/_components/ui/calendar";
// import {AnimatedBeam} from "@/components/ui/animated-beam";
import { AnimatedListDemo } from "./ui/list-demo";
import { BentoCard, BentoGrid } from "@/app/(landing)/_components/ui/bento-grid";
import Marquee from "./ui/marque";
// import DotPattern from "@/components/ui/dot-pattern";
// import { div } from "framer-motion/client";
const files = [
  {
    name: "project.pdf",
    body: "share your documents with your team members",
  },
  {
    name: "investment.pdf",
    body: "A spreadsheet or worksheet is a file made of rows and columns that help sort data, arrange data easily, and calculate numerical data.",
  },
  {
    name: "logo.svg",
    body: "Scalable Vector Graphics is an Extensible Markup Language-based vector image format for two-dimensional graphics with support for interactivity and animation.",
  },
  {
    name: "collabrixo.gpg",
    body: "GPG keys are used to encrypt and decrypt email, files, directories, and whole disk partitions and to authenticate messages.",
  },
  {
    name: "quadeer.txt",
    body: "A seed phrase, seed recovery phrase or backup seed phrase is a list of words which store all the information needed to recover Bitcoin funds on-chain.",
  },
];

const features = [
  {
    Icon: FileTextIcon,
    name: "Save your files",
    description: "We automatically save your files as you type.",
    href: "#",
    cta: "Learn more",
    className: "col-span-3 lg:col-span-1",
    background: (
      <Marquee
        pauseOnHover
        className="absolute top-10 [--duration:20s] [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)] "
      >
        {files.map((f, idx) => (
          <figure
            key={idx}
            className={cn(
              "relative w-32 cursor-pointer overflow-hidden rounded-xl border p-4",
              "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
              "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]",
              "transform-gpu blur-[1px] transition-all duration-300 ease-out hover:blur-none",
            )}
          >
            <div className="flex flex-row items-center gap-2">
              <div className="flex flex-col">
                <figcaption className="text-sm font-medium dark:text-white ">
                  {f.name}
                </figcaption>
              </div>
            </div>
            <blockquote className="mt-2 text-xs">{f.body}</blockquote>
          </figure>
        ))}
      </Marquee>
    ),
  },
  {
    Icon: BellIcon,
    name: "Real-time chat integration",
    description: "Get notified when something happens.",
    href: "#",
    cta: "Learn more",
    className: "col-span-3 lg:col-span-2",
    background: (
      <AnimatedListDemo className="absolute right-2 top-4 h-[300px] w-full border-none transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_10%,#000_100%)] group-hover:scale-105" />
    ),
  },
  {
    Icon: Share2Icon,
    name: "Use on any device",
    description: "full responsive design",
    href: "#",
    cta: "Learn more",
    className: "z-10 text-black col-span-3 lg:col-span-2",
    background: (
      <div className="flex space-x-1">
        <Iphone15Pro
          className="z-10 size-32 mt-12 "
          src="/ss.jpg"
        />
        <Safari
          url="magicui.design"
          className="size-56"
          src="/pc.png"
        />
      </div>
    // <div>jhkh</div>
    
    ),
  },
  {
    Icon: CalendarIcon,
    name: "Calendar",
    description: "Use the calendar to filter your files by date.",
    className: "col-span-3 lg:col-span-1",
    href: "#",
    cta: "Learn more",
    background: (
      <Calendar
        mode="single"
        selected={new Date(2022, 4, 11, 0, 0, 0)}
        className="absolute right-0 top-10 origin-top rounded-md border transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)] group-hover:scale-105"
      />
    ),
  },
];

export function Featuresbox() {
  return (
    <div className="md:mx-auto md:w-[70%] mt-10">

      <BentoGrid>
        {/* <DotPattern/> */}
        {features.map((feature, idx) => (
          <BentoCard key={idx} {...feature} />
        ))}
      </BentoGrid>
    </div>
  );
}
