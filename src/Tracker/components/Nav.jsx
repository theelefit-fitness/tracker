import "../styles/Nav.css";
import React, { useState } from "react";

function Nav() {
    const [isMenuActive, setIsMenuActive] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMenu = () => {
      setIsMenuActive(!isMenuActive);
    };

    const toggleMobileMenu = () => {
      setIsMobileMenuOpen(!isMobileMenuOpen);
      document.body.style.overflow = !isMobileMenuOpen ? 'hidden' : '';
    };

    return (
      <>
        <nav className="navbar">
          <div className="navbar__container">
            <button className="navbar__menu-btn" onClick={toggleMobileMenu}>
              <svg viewBox="0 0 24 24">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="navbar__logo">
              <a href="/">
                <img
                  src="https://theelefit.com/cdn/shop/files/freepik_br_3e6ca94d-018d-4329-8cd3-828c77c68075_1.svg?v=1737707946&width=700"
                  alt="Elefit Logo"
                />
              </a>
            </div>

            <ul className={`navbar__links ${isMenuActive ? 'active' : ''}`}>
              <li><a href="#">Shop Products</a></li>
              <li><a href="#">Loyalty Program</a></li>
              <li><a href="#">Ask Our Coach</a></li>
            </ul>

            <div className="navbar__icons">
              <a href="/account">
                <svg viewBox="0 0 24 24">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
                </svg>
              </a>
              <a href="/wishlist">
                <svg viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </a>
              <a href="/cart">
                <svg viewBox="0 0 24 24">
                  <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="navbar__cart-count">0</span>
              </a>
            </div>
          </div>
        </nav>

        {/* Mobile Menu */}
        <div className={`mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}>
          <div className="mobile-menu__header">
            <div className="navbar__logo">
              <a href="/">
                <img
                  src="https://theelefit.com/cdn/shop/files/freepik_br_3e6ca94d-018d-4329-8cd3-828c77c68075_1.svg?v=1737707946&width=700"
                  alt="Elefit Logo"
                />
              </a>
            </div>
            <button className="mobile-menu__close" onClick={toggleMobileMenu}>
              ✕
            </button>
          </div>
          <div className="mobile-menu__nav">
            <a href="#">HOME</a>
            <a href="#">SHOP PRODUCTS</a>
            <a href="#">LOYALTY PROGRAM</a>
            <a href="#">ASK OUR COACH</a>
            <a href="/account">MY ACCOUNT</a>
            <a href="/wishlist">WISHLIST</a>
            <a href="/cart">CART</a>
          </div>
        </div>
      </>
    );
  }
  export default Nav;