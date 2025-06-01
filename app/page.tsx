import Link from 'next/link';
// import FeatureSection from '@/components/FeatureSection';
// import CallToAction from '@/components/CallToAction';
import FeatureSection from '@/components/shoaib/components/FeatureSection';
import CallToAction from '@/components/shoaib/components/CallToAction';


export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="h-[40rem] w-full rounded-md bg-white dark:bg-neutral-950 flex flex-col items-center justify-center antialiased">
        <div className="max-w-2xl mx-auto p-4 text-center">
          <h1 className="relative z-10 text-lg md:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600 font-sans font-bold">
            Illuminate Your Workflow, Amplify Your Team
          </h1>

          <p className="text-neutral-500 max-w-lg mx-auto my-2 text-sm relative z-10">
            Collabrixo is your All In One GTD based project management app solution, powered by AI to boost productivity.
          </p>

          {/* Buttons */}
          <div className=" flex justify-center gap-4 mt-6 relative z-10">
            <Link href="/sign-up">
              <button className="bg-green-600 dark:text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition">
                Get Started
              </button>
            </Link>
            <Link href="/sign-in">
              <button className="border border-white dark:text-white px-6 py-2 rounded-lg font-medium hover:bg-white hover:text-black transition">
                Login
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section >
        <FeatureSection />
      </section>

      <section className='h-[40rem] w-full rounded-md bg-white dark:bg-neutral-950 flex flex-col items-center justify-center antialiased'>

      <CallToAction />
    
      </section>

    
    </>
  );
}
