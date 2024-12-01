// import { GitBranch } from 'react-icons/git'; // Ensure you have the appropriate icon library installed

import { ModeToggle } from "@/components/ui/theme-toggle";

const Navbar = () => {
  return (
    <header className="z-10 px-4 lg:px-6 h-14 flex items-center">
      <a className="flex items-center justify-center" href="#">
        <span className="z-10 sr-only">Collabrixo</span>
        {/* <GitBranch className="h-6 w-6 text-primary" /> */}
        <span className="ml-2 text-2xl font-bold text-primary">Collabrixo</span>
      </a>
      <nav className="z-10 ml-auto flex items-center gap-4 sm:gap-6">
      
        <a className="text-sm font-medium hover:underline underline-offset-4" href="#features">
          Features
        </a>
        <a className="text-sm font-medium hover:underline underline-offset-4" href="#team">
          About
        </a>

        <ModeToggle/>
      </nav>
    </header>
  );
};

export default Navbar;