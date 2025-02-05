import React, { useState } from 'react';
import './top_navbar.css'; // Custom CSS for styling the user image and other elements
import GlobalSearch from './GlobalSearch';
import axios from 'axios';

const Navbar = () => {
  const [results, setResults] = useState([]);

  const handleSearch = async (query) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_LOCAL_URL}/api/search?q=${query}`);
      setResults(response.data);
    } catch (error) {
      console.error('Search error:', error);
    }
  };
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container-fluid">
        <a href='/'><img src="./assets/axonator_logo.png" alt="Company Logo" className="navbar-logo"/></a>
        
        <form className="d-flex search-container">
          <input
            className="form-control me-2 search-input"
            type="search"
            placeholder="Search"
            aria-label="Search"
          />
        </form>
        {/* <div>
          <GlobalSearch onSearch={handleSearch} />
          <div className="search-results">
            {results.map((result) => (
              <div key={result.id}>{result.name}</div>
            ))}
          </div>
        </div> */}

        {/* Right side - Notification Icon and User Image */}
        <div className="d-flex align-items-center">
          {/* Notification Icon */}
          <button className="btn btn-link">
            <img src='./assets/notification icon.png' alt='notification icon' />
          </button>

          {/* User Image in Circle */}
          <div className="user-avatar">
            <img
              src="./assets/Client_Logo.png"
              alt="User Avatar"
              className="rounded-circle"
            />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
