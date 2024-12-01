"use client";
import React from "react";
import { AnimatedTooltip } from "./ui/team-icons";
const people = [
  {
    id: 1,
    name: "Mohd Abdul Quadeer",
    designation: "The Linux nerd",
    image:
      "/qq.jpg",
    // github:"quadeer2003"
  },
  {
    id: 2,
    name: "Anaba Abbas",
    designation: "Full Stack Developer",
    image:
      "/aa.png",
    // github:"anaba955"
  },
  {
    id: 3,
    name: "Mohd Shoaib asim",
    designation: "Full Stack Developer",
    image:
      "/shoaib.png",
    // github:"shoaib-asim17"
  },
];

export function AnimatedTooltipPreview() {
  return (
    <div className="flex flex-row items-center justify-center mb-10 w-full">
      {people.map((person) => (
        // <a
        //   key={person.id}
        //   href={`https://github.com/${person.github.replace(/\s+/g, '').toLowerCase()}`}
        //   target="_blank"
        //   rel="noopener noreferrer"
        // >
          <AnimatedTooltip key={person.id} items={[person]} />
        // </a>
      ))}
    </div>
  );
}
