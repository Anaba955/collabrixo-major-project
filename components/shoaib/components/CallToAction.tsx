'use client';

import React from "react";

const CallToAction = () => {
  return (
    <section className=" text-white py-16 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Ready to transform your workflow?
        </h2>
        <p className="text-neutral-400 mb-8">
          Join thousands of teams already working on Collabrixo.
        </p>
        
        <form
          onSubmit={(e) => {
            e.preventDefault();
            // You can handle submission here
          }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <input
            type="email"
            required
            placeholder="Enter your email"
            className="px-4 py-3 rounded-lg bg-neutral-800 text-white placeholder:text-neutral-500 w-full sm:w-2/3 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-teal-500 text-white font-medium rounded-lg hover:bg-teal-600 transition"
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
};

export default CallToAction;
