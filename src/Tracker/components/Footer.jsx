import React, { useState } from 'react';
import '../styles/Footer.css';
import { FaFacebookF } from "react-icons/fa";
import { FaInstagram } from "react-icons/fa";
import { FaLinkedinIn } from "react-icons/fa";

const Footer = () => {
  const [email, setEmail] = useState('');

  const handleSignup = (e) => {
    e.preventDefault();
    if (email) {
      alert('Thank you for signing up!');
      setEmail('');
    } else {
      alert('Please enter your email.');
    }
  };

  return (
    <div className="footer-wrapper">
      <div className="container">
        <div className="header">
          <div className="signup">
            <h1>Sign up & stay ahead.</h1>
            <div className='signup-input-container'>
              <input
                type="email"
                placeholder="Your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button onClick={handleSignup}>→</button>
            </div>
          </div>
          <div className="links-contact">
            <div>
              <h3>Quick links</h3>
              <a href="#">HOME</a>
              <a href="#">ABOUT</a>
              <a href="#">PRODUCTS</a>
              <a href="#">CONTACT US</a>
              <a href="#">BLOGS AND NEWS</a>
            </div>
            <div>
              <h3>Contact us</h3>
              <a href="tel:+12059034365">+1 205 903 4365</a>
              <a href="mailto:contact@theelefit.com">CONTACT@THEELEFIT.COM</a>
            </div>
            <div>
              <h3 className='follow-us'>Follow us</h3>
              <div className="social-icons">
                <a href="#"><FaFacebookF /></a>
                <a href="#"><FaInstagram /></a>
                <a href="#"><FaLinkedinIn /></a>
              </div>
            </div>
          </div>
        </div>
        <div className="logo">
          <img src="https://theelefit.com/cdn/shop/files/logo_white.png?v=1740293307&width=1600" alt="Elefit Logo" />
        </div>
      </div>
      <div className="footer">
        <a href="#">TERMS & CONDITION</a>
        <a href="#">PRIVACY POLICY</a>
        <a href="#">RETURN POLICY</a>
        <span>© 2025 ELEFIT</span>
      </div>
    </div>
  );
};

export default Footer;