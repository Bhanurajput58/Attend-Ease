import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faClock, faChartLine, faUsers, faGraduationCap, faEnvelope, faPhone, faMapMarkerAlt, faUserTie } from '@fortawesome/free-solid-svg-icons';
import { API_ENDPOINTS } from '../config/api';
import './Home.css';

const Home = () => {
  const [stats, setStats] = useState({
    activeUsers: 0,
    courses: 0,
    facultyMembers: 0,
    students: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactMessage, setContactMessage] = useState('');

  // Newsletter subscription state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState('');

  const handleContactFormChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactSubmitting(true);
    setContactMessage('');

    try {
      const response = await fetch(API_ENDPOINTS.SUBMIT_CONTACT_FORM, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactForm)
      });

      const data = await response.json();

      if (data.success) {
        setContactMessage({ type: 'success', text: data.message });
        // Reset form after successful submission
        setContactForm({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
      } else {
        setContactMessage({ type: 'error', text: data.message || 'Failed to send message. Please try again.' });
      }
    } catch (error) {
      console.error('Contact form submission error:', error);
      setContactMessage({ type: 'error', text: 'Network error. Please check your connection and try again.' });
    } finally {
      setContactSubmitting(false);
    }
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    setNewsletterSubmitting(true);
    setNewsletterMessage('');

    try {
      console.log('Submitting newsletter subscription for:', newsletterEmail);
      console.log('API endpoint:', API_ENDPOINTS.SUBSCRIBE_NEWSLETTER);
      
      const response = await fetch(API_ENDPOINTS.SUBSCRIBE_NEWSLETTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: newsletterEmail })
      });

      console.log('Newsletter response status:', response.status);
      console.log('Newsletter response URL:', response.url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Newsletter response data:', data);

      if (data.success) {
        setNewsletterMessage({ type: 'success', text: data.message });
        // Reset form after successful submission
        setNewsletterEmail('');
      } else {
        setNewsletterMessage({ type: 'error', text: data.message || 'Failed to subscribe. Please try again.' });
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setNewsletterMessage({ type: 'error', text: 'Network error. Please check your connection and try again.' });
    } finally {
      setNewsletterSubmitting(false);
    }
  };

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

  // Fetch homepage statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(API_ENDPOINTS.GET_HOMEPAGE_STATS);
        const data = await response.json();
        
        if (data.success) {
          setStats({
            activeUsers: data.data.activeUsers || 0,
            courses: data.data.courses || 0,
            facultyMembers: data.data.facultyMembers || 0,
            students: data.data.students || 0
          });
        } else {
          throw new Error(data.message || 'Failed to fetch statistics');
        }
      } catch (err) {
        console.error('Error fetching homepage statistics:', err);
        setError('Failed to load statistics. Please try again later.');
        // Fallback to default values
        setStats({
          activeUsers: 0,
          courses: 0,
          facultyMembers: 0,
          students: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
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
              <h3>{loading ? '...' : `${stats.activeUsers.toLocaleString()}+`}</h3>
              <p>Active Users</p>
            </div>
            <div className="stat-card">
              <FontAwesomeIcon icon={faGraduationCap} className="stat-icon" />
              <h3>{loading ? '...' : `${stats.courses.toLocaleString()}+`}</h3>
              <p>Courses</p>
            </div>
            <div className="stat-card">
              <FontAwesomeIcon icon={faUserTie} className="stat-icon" />
              <h3>{loading ? '...' : `${stats.facultyMembers.toLocaleString()}+`}</h3>
              <p>Faculty Members</p>
            </div>
            <div className="stat-card">
              <FontAwesomeIcon icon={faUsers} className="stat-icon" />
              <h3>{loading ? '...' : `${stats.students.toLocaleString()}+`}</h3>
              <p>Students</p>
            </div>
          </div>
          {error && (
            <div style={{ textAlign: 'center', marginTop: '20px', color: '#d32f2f' }}>
              <p>{error}</p>
            </div>
          )}
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

      <section className="newsletter-section">
        <div className="section-container">
          <h2>Stay Updated</h2>
          <p>Subscribe to our newsletter for product updates and special offers</p>
          <form onSubmit={handleNewsletterSubmit} className="newsletter-form">
            <input 
              type="email" 
              placeholder="Enter your email" 
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              required
            />
            <button 
              type="submit" 
              className="btn-subscribe"
              disabled={newsletterSubmitting}
            >
              {newsletterSubmitting ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
          {newsletterMessage && (
            <div className={`newsletter-message ${newsletterMessage.type}`}>
              {newsletterMessage.text}
            </div>
          )}
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
                  <p>bhanurajput5965@gmail.com</p>
                </div>
              </div>
              <div className="contact-item">
                <FontAwesomeIcon icon={faPhone} />
                <div>
                  <h4>Phone</h4>
                  <p>+91 9826000000</p>
                </div>
              </div>
              <div className="contact-item">
                <FontAwesomeIcon icon={faMapMarkerAlt} />
                <div>
                  <h4>Address</h4>
                  <p>IIITDMJ, Jabalpur</p>
                </div>
              </div>
            </div>
            <div className="contact-form">
              <form onSubmit={handleContactSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <input 
                      type="text" 
                      name="name"
                      placeholder="Your Name" 
                      value={contactForm.name}
                      onChange={handleContactFormChange}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <input 
                      type="email" 
                      name="email"
                      placeholder="Your Email" 
                      value={contactForm.email}
                      onChange={handleContactFormChange}
                      required 
                    />
                  </div>
                </div>
                <div className="form-group">
                  <input 
                    type="text" 
                    name="subject"
                    placeholder="Subject" 
                    value={contactForm.subject}
                    onChange={handleContactFormChange}
                    required 
                  />
                </div>
                <div className="form-group">
                  <textarea 
                    name="message"
                    placeholder="Your Message" 
                    rows="4" 
                    value={contactForm.message}
                    onChange={handleContactFormChange}
                    required
                  ></textarea>
                </div>
                {contactMessage && (
                  <div className={`contact-message ${contactMessage.type}`}>
                    {contactMessage.text}
                  </div>
                )}
                <button 
                  type="submit" 
                  className="btn-submit"
                  disabled={contactSubmitting}
                >
                  {contactSubmitting ? 'Sending...' : 'Send Message'}
                </button>
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
            <p>bhanurajput5965@gmail.com</p>
            <p>+91 9826000000</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home; 