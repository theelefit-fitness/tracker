import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="privacy-policy">
      <h1>Privacy Policy</h1>
      <p>Last Updated: {new Date().toISOString().split('T')[0]}</p>
      
      <section>
        <h2>1. Introduction</h2>
        <p>
          Welcome to EleFit Tracker ("we," "our," or "us"). We respect your privacy and are committed 
          to protecting your personal data. This privacy policy explains how we collect, use, and 
          safeguard your information when you use our EleFit Tracker application and voice skill.
        </p>
      </section>
      
      <section>
        <h2>2. Information We Collect</h2>
        <p>We collect the following types of information:</p>
        <ul>
          <li><strong>Account Information:</strong> Email address and profile information from Google when you sign in</li>
          <li><strong>Fitness Data:</strong> Workout types, duration, intensity, and timestamps</li>
          <li><strong>Nutrition Data:</strong> Meal types, food items, and timestamps</li>
          <li><strong>Voice Data:</strong> When using our Alexa skill, voice commands are processed by Amazon</li>
          <li><strong>Device Information:</strong> Device type, operating system, and app version</li>
        </ul>
      </section>
      
      <section>
        <h2>3. How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul>
          <li>Provide and maintain our service</li>
          <li>Store and display your fitness and nutrition logs</li>
          <li>Generate insights and progress reports</li>
          <li>Improve our application and Alexa skill</li>
          <li>Communicate with you about the service</li>
        </ul>
      </section>
      
      <section>
        <h2>4. Data Storage and Security</h2>
        <p>
          We store your data on Google Firebase, secured with industry-standard methods.
          Your data is associated with your Google account and protected by Firebase security rules.
          We implement appropriate technical and organizational measures to protect your personal data.
        </p>
      </section>
      
      <section>
        <h2>5. Data Sharing</h2>
        <p>We do not sell your personal data. We may share data with:</p>
        <ul>
          <li><strong>Service Providers:</strong> Google Firebase for data storage</li>
          <li><strong>Voice Platforms:</strong> Amazon Alexa when using our voice skill</li>
          <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
        </ul>
      </section>
      
      <section>
        <h2>6. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access, correct, or delete your personal data</li>
          <li>Withdraw consent at any time</li>
          <li>Object to processing of your data</li>
          <li>Data portability</li>
          <li>Lodge a complaint with a supervisory authority</li>
        </ul>
      </section>
      
      <section>
        <h2>7. Third-Party Services</h2>
        <p>
          Our service integrates with Google authentication and Amazon Alexa.
          These services have their own privacy policies that govern how they process your data.
        </p>
      </section>
      
      <section>
        <h2>8. Children's Privacy</h2>
        <p>
          Our service is not intended for children under 13 years of age.
          We do not knowingly collect personal information from children under 13.
        </p>
      </section>
      
      <section>
        <h2>9. Changes to This Privacy Policy</h2>
        <p>
          We may update our Privacy Policy from time to time.
          We will notify you of any changes by posting the new Privacy Policy on this page.
        </p>
      </section>
      
      <section>
        <h2>10. Contact Us</h2>
        <p>
          If you have questions about this Privacy Policy, please contact us at:
          theelifit25@gmail.com
        </p>
      </section>
    </div>
  );
};

export default PrivacyPolicy; 