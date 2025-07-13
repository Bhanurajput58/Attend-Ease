import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faClock, faChartLine } from '@fortawesome/free-solid-svg-icons';
import '../styles/HomePage.css';

const HomePage = () => {
  useEffect(() => {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href'))?.scrollIntoView({
          behavior: 'smooth'
        });
      });
    });

    return () => {
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.removeEventListener('click', function (e) {
          e.preventDefault();
          document.querySelector(this.getAttribute('href'))?.scrollIntoView({
            behavior: 'smooth'
          });
        });
      });
    };
  }, []);

  return (
    <div className="home-page">
      <header className="fixed-header">
        <nav className="main-nav">
          <Link to="/" className="logo">Attend<span className="highlight" style={{ marginLeft: '-0.3em' }}>-Ease</span></Link>
          <div className="nav-links">
            <a href="#about" className="nav-link">About Us</a>
            <Link to="/login" className="btn-login">Login</Link>
            <Link to="/register" className="btn-register">Register</Link>
          </div>
        </nav>
      </header>

      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text animate-slideInLeft">
            <h1>Revolutionize Your Attendance Management</h1>
            <p>Smart, efficient, and hassle-free attendance tracking system for modern institutions and organizations.</p>
            <div className="hero-buttons">
              <Link to="/register" className="btn-primary">Get Started</Link>
            </div>
          </div>
          <div className="hero-image animate-float">
            <img src="/assets/attendance.png" alt="Attendance System Illustration" />
          </div>
        </div>
      </section>

      <section className="about-section" id="about">
        <div className="section-container">
          <h2 className="section-title">About Us</h2>
          <div className="about-content">
            <div className="about-text">
              <p>At Attend-Ease, we're passionate about simplifying attendance management for educational institutions and organizations. Our platform combines cutting-edge technology with user-friendly design to create a seamless experience.</p>
              <p>Founded in 2023, our team of dedicated professionals brings together expertise in education, technology, and design to address the challenges of traditional attendance systems.</p>
            </div>
            <div className="about-mission">
              <h3>Our Mission</h3>
              <p>To transform the way institutions track and manage attendance, saving time and resources while providing valuable insights that enhance organizational efficiency.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="features-section" id="features">
        <div className="section-container">
          <h2 className="section-title">Key Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <FontAwesomeIcon icon={faCheckCircle} className="feature-icon" />
              <h3>Real-time Tracking</h3>
              <p>Monitor attendance instantly with our live tracking system and automated updates.</p>
            </div>
            <div className="feature-card">
              <FontAwesomeIcon icon={faClock} className="feature-icon" />
              <h3>Time Efficiency</h3>
              <p>Reduce administrative workload with automated reporting and smart analytics.</p>
            </div>
            <div className="feature-card">
              <FontAwesomeIcon icon={faChartLine} className="feature-icon" />
              <h3>Advanced Analytics</h3>
              <p>Generate detailed reports and insights to improve organizational efficiency.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="newsletter-section">
        <div className="section-container">
          <h2>Stay Updated</h2>
          <p>Subscribe to our newsletter for product updates and special offers</p>
          <div className="newsletter-form">
            <input type="email" placeholder="Enter your email" />
            <button className="btn-subscribe">Subscribe</button>
          </div>
        </div>
      </section>

      <footer className="main-footer">
        <div className="footer-container">
          <div className="footer-section">
            <h3>Attend-Ease</h3>
            <p>Making attendance management simple and efficient.</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="#about">About Us</a></li>
              <li><a href="#features">Features</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Legal</h4>
            <ul>
              <li><a href="/">Privacy Policy</a></li>
              <li><a href="/">Terms of Service</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Contact</h4>
            <p>support@attendeaseteam.com</p>
            <p>123-4567</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage; 