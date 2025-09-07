import React, { useState, useEffect } from 'react';
import { ChevronDown, Mail, Phone, MapPin, Github, Linkedin, ExternalLink, Code, Database, Cloud, Settings, Award, Briefcase, GraduationCap, User, Menu, X } from 'lucide-react';

const App = () => {
  const [activeSection, setActiveSection] = useState('hero');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState({
    hero: true,
    about: false,
    experience: false,
    projects: false,
    skills: false,
    education: false,
    contact: false
  });
  const [typedText, setTypedText] = useState('');
  const [currentRole, setCurrentRole] = useState(0);

  const roles = ['Full Stack Developer', 'React Developer', 'Node.js Developer', 'MERN Stack Developer'];

  // Typewriter effect for hero section
  useEffect(() => {
    let typingTimeout;
    let deletingTimeout;
    let pauseTimeout;

    const typeWriter = () => {
      const currentText = roles[currentRole];
      let charIndex = 0;
      let isDeleting = false;

      const type = () => {
        if (!isDeleting && charIndex <= currentText.length) {
          setTypedText(currentText.slice(0, charIndex));
          charIndex++;
          typingTimeout = setTimeout(type, 100);
        } else if (!isDeleting && charIndex > currentText.length) {
          pauseTimeout = setTimeout(() => {
            isDeleting = true;
            type();
          }, 2000);
        } else if (isDeleting && charIndex > 0) {
          charIndex--;
          setTypedText(currentText.slice(0, charIndex));
          deletingTimeout = setTimeout(type, 50);
        } else if (isDeleting && charIndex === 0) {
          setCurrentRole((prev) => (prev + 1) % roles.length);
        }
      };

      type();
    };

    typeWriter();

    return () => {
      clearTimeout(typingTimeout);
      clearTimeout(deletingTimeout);
      clearTimeout(pauseTimeout);
    };
  }, [currentRole]);

  // Intersection Observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target.id) {
            setIsVisible(prev => ({
              ...prev,
              [entry.target.id]: true
            }));
          }
        });
      },
      { threshold: 0.1 }
    );

    // Wait for DOM to be ready
    const timer = setTimeout(() => {
      const sections = document.querySelectorAll('section[id]');
      sections.forEach(section => {
        if (section.id) {
          observer.observe(section);
        }
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  // Smooth scrolling and active section detection
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero', 'about', 'experience', 'projects', 'playground', 'skills', 'education', 'contact'];
      const current = sections.find(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });
      if (current) setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Counter animation for statistics
  const useCounter = (end, duration = 2000) => {
    const [count, setCount] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);

    useEffect(() => {
      if (!hasStarted || !isVisible.about) return;
      
      let startTime;
      const startValue = 0;
      const endValue = end;

      const updateCount = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const currentCount = Math.floor(progress * (endValue - startValue) + startValue);
        setCount(currentCount);

        if (progress < 1) {
          requestAnimationFrame(updateCount);
        }
      };

      requestAnimationFrame(updateCount);
    }, [end, duration, hasStarted, isVisible.about]);

    useEffect(() => {
      if (isVisible.about && !hasStarted) {
        setHasStarted(true);
      }
    }, [isVisible.about, hasStarted]);

    return count;
  };

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  const skills = {
    frontend: ['React.js', 'Redux', 'JavaScript (ES6+)', 'TypeScript', 'Tailwind CSS', 'Material UI', 'HTML5', 'CSS3'],
    backend: ['Python', 'Java', 'Spring Boot', 'Node.js', 'Express.js', 'RESTful APIs', 'JWT Authentication'],
    database: ['MongoDB', 'PostgreSQL', 'SQL', 'Spring Data JPA'],
    devops: ['GitHub Actions', 'Docker', 'Kubernetes', 'AWS (EC2, S3)', 'CI/CD', 'Prometheus', 'Grafana'],
    tools: ['Git', 'Postman', 'Swagger', 'Jest', 'Figma', 'Jira', 'Confluence']
  };

  const experiences = [
    {
      company: 'McKinsey & Company',
      role: 'Full Stack Developer / Technology Engineer',
      duration: 'May 2025 – Present',
      location: 'CA, USA',
      achievements: [
        'Developed responsive React.js interfaces for referral and rewards modules, integrating Stripe and Twilio APIs to increase engagement by 40%',
        'Redesigned customer profile workflows using Tailwind CSS, Redux, and reusable components, reducing support tickets by 20%',
        'Built RESTful services using Node.js, Express.js, and Python-based utilities to support search features for 50K+ users',
        'Streamlined state and performance management, improving frontend responsiveness by 35%'
      ]
    },
    {
      company: 'Uber',
      role: 'Full Stack Developer',
      duration: 'Feb 2024 – May 2025',
      location: 'CA, USA',
      achievements: [
        'Designed interactive React.js dashboards to manage trip metadata and audit rides, reducing bottlenecks',
        'Built dynamic frontend components using React Hooks, Material UI, and Redux, supporting 1M+ transactions/month',
        'Integrated real-time data with Kafka and performed containerized deployment via Docker',
        'Reduced UI errors by 30% through refined asynchronous UI behavior with debouncing and conditional loaders'
      ]
    },
    {
      company: 'KPMG',
      role: 'Java Full Stack Developer',
      duration: 'Sep 2021 – Jul 2022',
      location: 'India',
      achievements: [
        'Developed dashboard views using JSP, HTML, and CSS, integrated with Spring Boot controllers to monitor 100+ KPIs',
        'Created secure REST APIs using Spring Boot and J2EE, enabling data communication between PostgreSQL and frontend',
        'Deployed backend components on AWS EC2 and managed configuration via AWS Parameter Store',
        'Reduced developer onboarding time by 50% using centralized Confluence guides'
      ]
    }
  ];

  const projects = [
    {
      title: 'Coffee Shop Management System',
      description: 'Full-stack MERN application managing 1,000+ weekly orders, inventory, and daily sales with admin and cashier portals.',
      technologies: ['React', 'Node.js', 'MongoDB', 'Express.js', 'JWT'],
      features: ['Barcode scanning', 'Protected routes', 'Daily reporting', '40% faster checkout']
    },
    {
      title: 'Job Application Tracker',
      description: 'Personal productivity tool tracking 120+ job applications with dynamic filtering and authentication.',
      technologies: ['React', 'MongoDB', 'Node.js', 'JWT'],
      features: ['Dynamic filters', 'Application tagging', 'Interview tracking', 'Progress analytics']
    }
  ];

  return (
    <div className="bg-gray-900 text-gray-100 min-h-screen font-sans overflow-x-hidden">
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes slideInLeft {
          from { transform: translateX(-100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideInRight {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideInUp {
          from { transform: translateY(50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes fadeInScale {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .animate-slide-in-left {
          animation: slideInLeft 0.8s ease-out forwards;
        }
        
        .animate-slide-in-right {
          animation: slideInRight 0.8s ease-out forwards;
        }
        
        .animate-slide-in-up {
          animation: slideInUp 0.6s ease-out forwards;
        }
        
        .animate-fade-in-scale {
          animation: fadeInScale 0.8s ease-out forwards;
        }
        
        .animate-pulse-slow {
          animation: pulse 2s ease-in-out infinite;
        }
        
        .stagger-1 { animation-delay: 0.1s; }
        .stagger-2 { animation-delay: 0.2s; }
        .stagger-3 { animation-delay: 0.3s; }
        .stagger-4 { animation-delay: 0.4s; }
        .stagger-5 { animation-delay: 0.5s; }
        .stagger-6 { animation-delay: 0.6s; }
      `}</style>

      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 z-50 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-10">
          <div className="flex justify-between items-center py-4">
            <div className="text-xl font-bold text-blue-400 animate-slide-in-left">Tharun Manikonda</div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-6 animate-slide-in-right">
              {['About', 'Experience', 'Projects', 'Skills', 'Education', 'Contact'].map((item, index) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item.toLowerCase())}
                  className={`text-sm font-medium transition-all duration-300 hover:text-blue-400 hover:scale-105 ${
                    activeSection === item.toLowerCase() ? 'text-blue-400' : 'text-gray-300'
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {item}
                </button>
              ))}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden text-gray-300 hover:text-blue-400"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-800">
              {['About', 'Experience', 'Projects', 'Skills', 'Education', 'Contact'].map((item) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item.toLowerCase())}
                  className="block w-full text-left py-2 text-gray-300 hover:text-blue-400"
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-20 h-20 bg-blue-500/10 rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-20 w-16 h-16 bg-purple-500/10 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-20 left-20 w-24 h-24 bg-green-500/10 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-40 right-10 w-12 h-12 bg-pink-500/10 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        </div>

        <div className="text-center max-w-4xl mx-auto px-4 relative z-10">
          <div className="mb-8">
            <div 
              className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center animate-fade-in-scale hover:scale-110 transition-transform duration-300"
              style={{ animation: 'float 6s ease-in-out infinite' }}
            >
              <User size={64} className="text-white" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-4 animate-slide-in-up">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Tharun Manikonda
              </span>
            </h1>
            <h2 className="text-2xl md:text-3xl text-gray-300 mb-6 animate-slide-in-up stagger-1">
              <span className="inline-block">{typedText}</span>
              <span className="animate-pulse-slow">|</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8 animate-slide-in-up stagger-2">
              3+ years of experience building scalable, high-performance applications using the MERN stack, 
              Java Spring Boot, and cloud-native DevOps pipelines.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 mb-12 animate-slide-in-up stagger-3">
            <a 
              href="mailto:tharun.manikonda1@outlook.com" 
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
            >
              <Mail size={20} />
              Get In Touch
            </a>
            <button 
              onClick={() => scrollToSection('projects')} 
              className="flex items-center gap-2 border border-gray-600 hover:border-blue-400 px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
            >
              <Code size={20} />
              View Projects
            </button>
          </div>

          <button 
            onClick={() => scrollToSection('about')}
            className="animate-bounce text-gray-400 hover:text-blue-400 transition-colors duration-300 hover:scale-110 transform"
          >
            <ChevronDown size={32} />
          </button>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gray-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className={`text-3xl md:text-4xl font-bold text-center mb-12 ${isVisible.about ? 'animate-slide-in-up' : 'opacity-0'}`}>
            About Me
          </h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className={`${isVisible.about ? 'animate-slide-in-left' : 'opacity-0'}`}>
              <p className="text-lg text-gray-300 mb-6">
                I'm a passionate Full Stack Developer with expertise in building robust, scalable applications. 
                My journey spans from frontend React applications to backend microservices, with a strong focus 
                on performance optimization and user experience.
              </p>
              <p className="text-lg text-gray-300 mb-6">
                Currently based in California, I've had the privilege of working with industry leaders like 
                McKinsey & Company and Uber, delivering solutions that serve millions of users while maintaining 
                high code quality and best practices.
              </p>
              <div className="flex items-center gap-4 text-gray-400">
                <MapPin size={20} />
                <span>California, USA</span>
              </div>
            </div>
            <div className={`grid grid-cols-2 gap-6 ${isVisible.about ? 'animate-slide-in-right' : 'opacity-0'}`}>
              <div className="bg-gray-900 p-6 rounded-lg text-center hover:scale-105 transition-transform duration-300 hover:shadow-lg hover:shadow-blue-500/10">
                <div className="text-3xl font-bold text-blue-400 mb-2">{useCounter(3)}+</div>
                <div className="text-gray-300">Years Experience</div>
              </div>
              <div className="bg-gray-900 p-6 rounded-lg text-center hover:scale-105 transition-transform duration-300 hover:shadow-lg hover:shadow-purple-500/10">
                <div className="text-3xl font-bold text-purple-400 mb-2">{useCounter(15)}+</div>
                <div className="text-gray-300">Technologies</div>
              </div>
              <div className="bg-gray-900 p-6 rounded-lg text-center hover:scale-105 transition-transform duration-300 hover:shadow-lg hover:shadow-green-500/10">
                <div className="text-3xl font-bold text-green-400 mb-2">{useCounter(5)}+</div>
                <div className="text-gray-300">Major Projects</div>
              </div>
              <div className="bg-gray-900 p-6 rounded-lg text-center hover:scale-105 transition-transform duration-300 hover:shadow-lg hover:shadow-orange-500/10">
                <div className="text-3xl font-bold text-orange-400 mb-2">{useCounter(3)}</div>
                <div className="text-gray-300">Companies</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section id="experience" className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className={`text-3xl md:text-4xl font-bold text-center mb-12 ${isVisible.experience ? 'animate-slide-in-up' : 'opacity-0'}`}>
            Professional Experience
          </h2>
          <div className="space-y-8">
            {experiences.map((exp, index) => (
              <div 
                key={index} 
                className={`bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-all duration-500 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/10 ${
                  isVisible.experience ? 'animate-slide-in-up' : 'opacity-0'
                }`}
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-blue-400">{exp.role}</h3>
                    <h4 className="text-lg text-gray-300">{exp.company}</h4>
                  </div>
                  <div className="text-gray-400 text-sm">
                    <div>{exp.duration}</div>
                    <div>{exp.location}</div>
                  </div>
                </div>
                <ul className="space-y-2">
                  {exp.achievements.map((achievement, i) => (
                    <li key={i} className="text-gray-300 flex items-start hover:text-gray-100 transition-colors duration-300">
                      <span className="text-blue-400 mr-2 animate-pulse">•</span>
                      {achievement}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20 bg-gray-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className={`text-3xl md:text-4xl font-bold text-center mb-12 ${isVisible.projects ? 'animate-slide-in-up' : 'opacity-0'}`}>
            Featured Projects
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {projects.map((project, index) => (
              <div 
                key={index} 
                className={`bg-gray-900 rounded-lg p-6 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-500 hover:scale-105 hover:-translate-y-2 ${
                  isVisible.projects ? 'animate-fade-in-scale' : 'opacity-0'
                }`}
                style={{ animationDelay: `${index * 0.3}s` }}
              >
                <h3 className="text-xl font-bold text-blue-400 mb-3 hover:text-purple-400 transition-colors duration-300">
                  {project.title}
                </h3>
                <p className="text-gray-300 mb-4">{project.description}</p>
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">Technologies:</h4>
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech, i) => (
                      <span 
                        key={i} 
                        className="bg-blue-600 text-blue-100 px-2 py-1 rounded text-xs hover:bg-blue-500 transition-colors duration-300 hover:scale-110 transform"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">Key Features:</h4>
                  <ul className="space-y-1">
                    {project.features.map((feature, i) => (
                      <li key={i} className="text-gray-300 text-sm flex items-center hover:text-green-400 transition-colors duration-300">
                        <span className="text-green-400 mr-2 animate-pulse">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className={`text-3xl md:text-4xl font-bold text-center mb-12 ${isVisible.skills ? 'animate-slide-in-up' : 'opacity-0'}`}>
            Technical Skills
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Object.entries(skills).map(([category, techs], index) => (
              <div 
                key={category} 
                className={`bg-gray-800 rounded-lg p-6 hover:scale-105 transition-all duration-500 hover:shadow-lg hover:shadow-blue-500/10 ${
                  isVisible.skills ? 'animate-fade-in-scale' : 'opacity-0'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center mb-4">
                  {category === 'frontend' && <Code className="text-blue-400 mr-2 animate-pulse" size={24} />}
                  {category === 'backend' && <Settings className="text-green-400 mr-2 animate-pulse" size={24} />}
                  {category === 'database' && <Database className="text-purple-400 mr-2 animate-pulse" size={24} />}
                  {category === 'devops' && <Cloud className="text-orange-400 mr-2 animate-pulse" size={24} />}
                  {category === 'tools' && <Award className="text-pink-400 mr-2 animate-pulse" size={24} />}
                  <h3 className="text-lg font-bold capitalize">{category}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {techs.map((tech, i) => (
                    <span 
                      key={i} 
                      className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm hover:bg-gray-600 transition-all duration-300 hover:scale-110 hover:text-white"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Education & Certifications */}
      <section id="education" className="py-20 bg-gray-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className={`text-3xl md:text-4xl font-bold text-center mb-12 ${isVisible.education ? 'animate-slide-in-up' : 'opacity-0'}`}>
            Education & Certifications
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className={`bg-gray-900 rounded-lg p-6 ${isVisible.education ? 'animate-slide-in-left' : 'opacity-0'}`}>
              <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center">
                <GraduationCap className="mr-2" size={24} />
                Education
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-200">Master's in Computer Science</h4>
                  <p className="text-gray-400">University of Alabama at Birmingham</p>
                  <p className="text-gray-500 text-sm">Aug 2022 – Dec 2023</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-200">Bachelor of Engineering in Computer Science</h4>
                  <p className="text-gray-400">K.S. Institute of Technology, Karnataka, India</p>
                  <p className="text-gray-500 text-sm">Jun 2018 – May 2022</p>
                </div>
              </div>
            </div>
            
            <div className={`bg-gray-900 rounded-lg p-6 ${isVisible.education ? 'animate-slide-in-right' : 'opacity-0'}`}>
              <h3 className="text-xl font-bold text-purple-400 mb-4 flex items-center">
                <Award className="mr-2" size={24} />
                Certifications
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="text-orange-400 mr-2">🏅</span>
                  <span className="text-gray-300">AWS Certified Solutions Architect – Associate</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-400 mr-2">🏅</span>
                  <span className="text-gray-300">Certified MERN Developer – Namaste Dev</span>
                </div>
                <div className="flex items-center">
                  <span className="text-blue-400 mr-2">🏅</span>
                  <span className="text-gray-300">Node.js Certified Developer – Coursera</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className={`text-3xl md:text-4xl font-bold mb-8 ${isVisible.contact ? 'animate-slide-in-up' : 'opacity-0'}`}>
            Let's Work Together
          </h2>
          <p className={`text-lg text-gray-300 mb-12 ${isVisible.contact ? 'animate-slide-in-up stagger-1' : 'opacity-0'}`}>
            I'm always open to discussing new opportunities and interesting projects. 
            Let's connect and see how we can build something amazing together!
          </p>
          
          <div className={`grid md:grid-cols-3 gap-8 mb-12 ${isVisible.contact ? 'animate-slide-in-up stagger-2' : 'opacity-0'}`}>
            <a 
              href="mailto:tharun.manikonda1@outlook.com"
              className="flex items-center justify-center gap-3 bg-gray-800 hover:bg-gray-700 p-6 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20"
            >
              <Mail className="text-blue-400 animate-pulse" size={24} />
              <div>
                <div className="font-semibold">Email</div>
                <div className="text-sm text-gray-400">tharun.manikonda1@outlook.com</div>
              </div>
            </a>
            
            <a 
              href="tel:+12052598634"
              className="flex items-center justify-center gap-3 bg-gray-800 hover:bg-gray-700 p-6 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20"
            >
              <Phone className="text-green-400 animate-pulse" size={24} />
              <div>
                <div className="font-semibold">Phone</div>
                <div className="text-sm text-gray-400">(205) 259-8634</div>
              </div>
            </a>
            
            <div className="flex items-center justify-center gap-3 bg-gray-800 p-6 rounded-lg hover:scale-105 transition-transform duration-300">
              <MapPin className="text-purple-400 animate-pulse" size={24} />
              <div>
                <div className="font-semibold">Location</div>
                <div className="text-sm text-gray-400">California, USA</div>
              </div>
            </div>
          </div>

          <div className={`flex justify-center gap-6 ${isVisible.contact ? 'animate-fade-in-scale stagger-3' : 'opacity-0'}`}>
            <a 
              href="#" 
              className="bg-gray-800 hover:bg-gray-700 p-3 rounded-full transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-gray-500/20"
            >
              <Github size={24} />
            </a>
            <a 
              href="#" 
              className="bg-gray-800 hover:bg-gray-700 p-3 rounded-full transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/20"
            >
              <Linkedin size={24} />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2025 Tharun Manikonda. Built with React and Tailwind CSS.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;