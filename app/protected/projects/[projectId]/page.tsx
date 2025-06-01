"use client";
import TabsSection from "../_components/TabsSection";
import JeemBackground from "../../_components/JeemBackground";


export default function Home() {

  return (

        <div className="flex-1 transition-all duration-300 px-4 ml-0">
          <TabsSection />
          <JeemBackground opacity={0.7} blurAmount={120} speed={35} />
        </div>
  );
}