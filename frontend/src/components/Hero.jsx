import React from 'react';
import heroImage from '../assets/hero-im.jpg';
const Hero = () => (
  <section className="relative overflow-hidden bg-white dark:bg-gray-900">
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="text-center md:text-left">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Your Learning <span className="text-indigo-600 dark:text-indigo-400">Journey</span> Starts Here.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-xl mx-auto md:mx-0">
            Explore thousands of hands-on creative courses and classes taught by expert instructors.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <a href="/#courses" className="inline-block px-8 py-4 text-lg font-bold text-white bg-indigo-600 rounded-full hover:bg-indigo-700 transition">Explore Courses</a>
          </div>
        </div>
        <div className="relative h-80 md:h-full">
          <img
            src={heroImage}
            alt="A student learning on a laptop"
            className="absolute inset-0 w-full h-full object-cover rounded-3xl shadow-2xl transform md:rotate-3"
          />
        </div>
      </div>
    </div>
  </section>
);

export default Hero; 