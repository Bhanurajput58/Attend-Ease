import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faClock, faChartLine, faUsers, faGraduationCap, faUniversity, faShieldAlt, faMobileAlt, faDesktop, faTabletAlt, faQuestionCircle, faEnvelope, faPhone, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import '../styles/HomePage.css';

const HomePage = () => {
  useEffect(() => {
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

      {/* Statistics Section */}
      <section className="stats-section">
        <div className="section-container">
          <div className="stats-grid">
            <div className="stat-card">
              <FontAwesomeIcon icon={faUsers} className="stat-icon" />
              <h3>10,000+</h3>
              <p>Active Users</p>
            </div>
            <div className="stat-card">
              <FontAwesomeIcon icon={faUniversity} className="stat-icon" />
              <h3>500+</h3>
              <p>Institutions</p>
            </div>
            <div className="stat-card">
              <FontAwesomeIcon icon={faGraduationCap} className="stat-icon" />
              <h3>1M+</h3>
              <p>Attendance Records</p>
            </div>
            <div className="stat-card">
              <FontAwesomeIcon icon={faShieldAlt} className="stat-icon" />
              <h3>99.9%</h3>
              <p>Uptime</p>
            </div>
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

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="section-container">
          <h2 className="section-title">How It Works</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Register Your Institution</h3>
              <p>Sign up and set up your organization's profile with basic information.</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Add Users & Courses</h3>
              <p>Invite students and faculty, and create courses with schedules.</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Start Tracking</h3>
              <p>Begin taking attendance using our intuitive interface.</p>
            </div>
            <div className="step-card">
              <div className="step-number">4</div>
              <h3>Generate Reports</h3>
              <p>Access detailed analytics and reports for better decision making.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="section-container">
          <h2 className="section-title">What Our Users Say</h2>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-content">
                <p>"Attend-Ease has transformed how we manage attendance. The real-time tracking saves us hours every week."</p>
              </div>
              <div className="testimonial-author">
                <h4>Dr. Sarah Johnson</h4>
                <p>Dean of Engineering, Tech University</p>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-content">
                <p>"As a faculty member, I love how easy it is to take attendance and generate reports. Highly recommended!"</p>
              </div>
              <div className="testimonial-author">
                <h4>Prof. Michael Chen</h4>
                <p>Computer Science Department</p>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-content">
                <p>"The mobile app makes it so convenient for students to check in. No more paper-based systems!"</p>
              </div>
              <div className="testimonial-author">
                <h4>Emily Rodriguez</h4>
                <p>Student, Business School</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section" id="faq">
        <div className="section-container">
          <h2 className="section-title">Frequently Asked Questions</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h3><FontAwesomeIcon icon={faQuestionCircle} /> How secure is my data?</h3>
              <p>We use industry-standard encryption and security measures to protect all your data. Your information is stored securely and never shared with third parties.</p>
            </div>
            <div className="faq-item">
              <h3><FontAwesomeIcon icon={faQuestionCircle} /> Can I use it on mobile devices?</h3>
              <p>Yes! Our platform is fully responsive and works seamlessly on smartphones, tablets, and desktop computers.</p>
            </div>
            <div className="faq-item">
              <h3><FontAwesomeIcon icon={faQuestionCircle} /> How much does it cost?</h3>
              <p>We offer flexible pricing plans based on your institution's size and needs. Contact us for a custom quote.</p>
            </div>
            <div className="faq-item">
              <h3><FontAwesomeIcon icon={faQuestionCircle} /> Can I export attendance reports?</h3>
              <p>Absolutely! You can export attendance data in various formats including PDF, Excel, and CSV for further analysis.</p>
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

      {/* Contact Section */}
      <section className="contact-section" id="contact">
        <div className="section-container">
          <h2 className="section-title">Get In Touch</h2>
          <div className="contact-content">
            <div className="contact-info">
              <div className="contact-item">
                <FontAwesomeIcon icon={faEnvelope} />
                <div>
                  <h4>Email</h4>
                  <p>support@attendeaseteam.com</p>
                </div>
              </div>
              <div className="contact-item">
                <FontAwesomeIcon icon={faPhone} />
                <div>
                  <h4>Phone</h4>
                  <p>+1 (555) 123-4567</p>
                </div>
              </div>
              <div className="contact-item">
                <FontAwesomeIcon icon={faMapMarkerAlt} />
                <div>
                  <h4>Address</h4>
                  <p>123 Innovation Drive<br />Tech City, TC 12345</p>
                </div>
              </div>
            </div>
            <div className="contact-form">
              <form>
                <div className="form-row">
                  <input type="text" placeholder="Your Name" />
                  <input type="email" placeholder="Your Email" />
                </div>
                <input type="text" placeholder="Subject" />
                <textarea placeholder="Your Message" rows="5"></textarea>
                <button type="submit" className="btn-submit">Send Message</button>
              </form>
            </div>
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
              <li><a href="#faq">FAQ</a></li>
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
            <p>+1 (555) 123-4567</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage; 