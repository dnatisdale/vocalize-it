import React from "react";

export function AmbientBackground({ theme }) {
  if (theme === "dark") {
    return (
      <div className="ambient-bg dark-ambient">
        <div className="ambient-blob blob-1"></div>
        <div className="ambient-blob blob-2"></div>
        <div className="ambient-blob blob-3"></div>
      </div>
    );
  }

  // Light Mode Abstract Waves
  return (
    <div className="ambient-bg light-ambient">
      <svg 
        className="ambient-svg" 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 1440 1024" 
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <path className="wave-path path-1" d="M0,320 C320,160 640,480 1440,250" stroke="currentColor" strokeWidth="2" />
        <path className="wave-path path-2" d="M0,500 C480,720 960,320 1440,600" stroke="currentColor" strokeWidth="2" />
        <path className="wave-path path-3" d="M0,800 C400,600 800,900 1440,750" stroke="currentColor" strokeWidth="2" />
        <path className="wave-path path-4" d="M-100,100 C200,300 1000,-100 1540,200" stroke="currentColor" strokeWidth="1" />
        <path className="wave-path path-5" d="M-50,900 C350,1100 1100,700 1500,950" stroke="currentColor" strokeWidth="1" />
      </svg>
    </div>
  );
}
