import React from 'react';
import { NavLink } from 'react-router-dom';

export const Navbar: React.FC = () => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        ⚡ Order<span>Flow</span>
      </div>
      <ul className="navbar-nav">
        <li>
          <NavLink
            to="/orders"
            className={({ isActive }) =>
              isActive ? 'nav-link active' : 'nav-link'
            }
          >
            Pedidos
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/products"
            className={({ isActive }) =>
              isActive ? 'nav-link active' : 'nav-link'
            }
          >
            Productos
          </NavLink>
        </li>
      </ul>
    </nav>
  );
};
