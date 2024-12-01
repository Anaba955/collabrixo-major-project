// "use client";
import { Button } from "@/components/ui/button";
import BoxReveal from "@/app/(landing)/_components/ui/box-reveal";
import { GeistMono } from "geist/font/mono";
import { cn } from "@/lib/utils";

export async function BoxRevealDemo() {
  return (
    <div className={cn(GeistMono.className,"size-full max-w-lg items-center justify-center overflow-hidden pt-8")}>
      <BoxReveal boxColor={"#5046e6"} duration={0.5}>
        <p className="text-[3.5rem] font-semibold">
          Why Collabrixo<span className="text-[#5046e6]">.</span>
        </p>
      </BoxReveal>

      <BoxReveal boxColor={"#5046e6"} duration={0.5}>
        <h2 className="mt-[.5rem] text-[1rem]">
          Productivity tool for{" "}
          <span className="text-[#5046e6]">Software Engineers</span>
        </h2>
      </BoxReveal>

      <BoxReveal boxColor={"#5046e6"} duration={0.5}>
        <div className="mt-6 text-left">
          <p>
            1. Best user-friendly UI experience. <br />
            2. Easy integration with Git. <br />
            3. GTD-based experience for effective team management. <br />
            4. Easy visualization for insights and project deadlines. <br />
          </p>
        </div>
      </BoxReveal>

      <BoxReveal boxColor={"#5046e6"} duration={0.5}>
        <Button className="mt-[1.6rem] ">Subscribe</Button>
      </BoxReveal>
    </div>
  );
}
