// import type { Metadata } from "next";
import DotPattern from "./_components/ui/dot-pattern";
import AnimatedGridPattern from "./_components/ui/grid-bg";
import { cn } from "@/lib/utils";
import Navbar from "./_components/navbar";
// import Footer from "./components/footer";
import "@/app/globals.css";
export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      <div className="dark:hidden">

      <DotPattern
        className="absolute inset-0 w-full h-full"
        style={{
          maskImage: "radial-gradient(500px_circle_at_center, white, transparent)"
        }}
      />
      </div>
      <div className="hidden dark:block">

      <AnimatedGridPattern
      // numSquares={90}
      maxOpacity={0.2}
      duration={3}
      repeatDelay={1}
      height={100}
      width={100}
      numSquares={190}
      className={cn(
      "absolute inset-0 w-full h-full",
      "[mask-image:radial-gradient(500px_circle_at_center,white,transparent)]",
      "inset-x-0 inset-y-[-40%] h-[100%] skew-y-12",
      )}
      />
      </div>

      <main className="relative z-10 min-h-screen">
        <Navbar />
      {/* Other components like Navbar, children */}
      {children}
      {/* <Footer /> */}
      </main>
    </div>
  );
}
