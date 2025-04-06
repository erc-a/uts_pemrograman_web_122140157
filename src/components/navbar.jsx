import React from "react";

const Navbar = ({ currentView, setCurrentView }) => {
  const navItems = [
    { label: "Home", value: "home" },
    { label: "Top Movies", value: "top" },
    { label: "Saved", value: "saved" },
  ];

  return (
    <nav className="navbar">
      {navItems.map((item) => (
        <button
          key={item.value}
          onClick={() => setCurrentView(item.value)}
          className={`nav-button ${currentView === item.value ? "active" : ""}`}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
};

export default Navbar;
