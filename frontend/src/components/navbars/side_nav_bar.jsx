import React from 'react';
import { MdOutlineMailOutline } from "react-icons/md";

const Side_Navbar = () => {
  return (
    <div className="col-md-1 bg-light d-flex flex-column align-items-center py-3">
      <ul className="list-unstyled text-center">
        <li className="mb-3">
          <a href="/view?scope=root&pid=1" className="text-decoration-none text-dark">
            <i className="bi bi-buildings" style={{ fontSize: '24px' }}></i>
          </a>
        </li>
        <li className="mb-3">
          <a href="/view?scope=all" className="text-decoration-none text-dark">
            <i className="bi bi-list-nested" style={{ fontSize: '24px' }}></i>
          </a>
        </li>
        <li className="mb-3">
          <a href="/contacts" className="text-decoration-none text-dark">
            <i className="bi bi-person-circle" style={{ fontSize: '24px' }}></i>
          </a>
        </li>
        <li className="mb-3">
          <a href="/emails/all" className="text-decoration-none text-dark">
            <MdOutlineMailOutline size={24}/>
          </a>
        </li>
      </ul>
    </div>
  );
};

export default Side_Navbar;
