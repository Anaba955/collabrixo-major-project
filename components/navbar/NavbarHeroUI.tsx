'use client'; // Ensure it's a client-side component

import { useState } from "react";
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Link, Button } from "@heroui/react";

export default function App() {
  const [isOpen, setIsOpen] = useState(false); // State for mobile menu toggle

  // Function to toggle the mobile menu
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <Navbar className="bg-gray-800 text-white shadow-md">
      <NavbarBrand className="px-6 py-4">
        <p className="text-2xl font-semibold">Collabrixo</p>
      </NavbarBrand>

      {/* Desktop Navbar Content */}
      {/* <NavbarContent className="hidden sm:flex gap-6 px-6 py-4 justify-center items-center space-x-6">
        <NavbarItem>
          <Link className="hover:text-primary-500 transition duration-200" href="#">
            Features
          </Link>
        </NavbarItem>
        <NavbarItem isActive>
          <Link className="text-primary-500 font-semibold" href="#">
            Customers
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link className="hover:text-primary-500 transition duration-200" href="#">
            Integrations
          </Link>
        </NavbarItem>
      </NavbarContent> */}
      <NavbarContent>
      <NavbarItem>
        <Link className="text-white hover:text-primary-500 transition duration-200" href="/Kanban">
           Kanban
        </Link>

      </NavbarItem>
      </NavbarContent>
     

      {/* Mobile Navbar (Hamburger Menu) */}
      <div className="sm:hidden flex items-center px-6 py-4">
        {/* Hamburger Button */}
        <button onClick={toggleMenu} className="text-white focus:outline-none">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* Mobile Menu Items */}
      <div
        className={`sm:hidden ${isOpen ? "block" : "hidden"} absolute top-16 left-0 w-full bg-gray-800 text-white px-6 py-4`}
      >
        <NavbarItem>
          <Link className="block py-2" href="#">
            Features
          </Link>
        </NavbarItem>
        <NavbarItem isActive>
          <Link className="block py-2" href="#">
            Customers
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link className="block py-2" href="#">
            Integrations
          </Link>
        </NavbarItem>
        <NavbarItem className="mt-4">
          <Button
            as={Link}
            color="primary"
            className="w-full py-2 text-center bg-blue-600 text-white hover:bg-blue-700"
            href="#"
            variant="flat"
          >
            Sign Up
          </Button>
        </NavbarItem>
      </div>

      {/* Desktop Navbar Content with Sign In and Sign Up on the Right */}
      <NavbarContent className="flex justify-end items-center gap-6 px-6 py-4 ml-auto">
        <NavbarItem className="hidden lg:flex">
          <Link className="text-gray-300 hover:text-white transition duration-200" href="#">
            Login
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Button
            as={Link}
            color="primary"
            className="bg-red-600 text-white hover:bg-blue-700 transition duration-200 px-6 py-2 rounded-md"
            href="#"
            variant="flat"
          >
            Sign Up
          </Button>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
