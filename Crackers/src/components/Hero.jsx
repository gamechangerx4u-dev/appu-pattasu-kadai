import React from 'react';

const Hero = () => {
  return (
    <section className="container flex items-center justify-center text-center" style={{ padding: '4rem 20px', minHeight: '60vh' }}>
      <div className="glass flex-col items-center animate-fade-in" style={{ padding: '4rem 2rem', borderRadius: '24px', width: '100%' }}>
        <div style={{ display: 'inline-block', padding: '0.5rem 1.5rem', background: 'rgba(230, 57, 70, 0.15)', borderRadius: '20px', color: 'var(--primary-red)', fontWeight: 'bold', marginBottom: '1.5rem' }}>
          LIGHT UP YOUR DIWALI!
        </div>
        <h1 style={{ fontSize: '4.5rem', marginBottom: '1rem', textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          UPTO <span className="text-gradient" style={{ fontSize: '6rem' }}>90%</span> OFF
        </h1>
        <p style={{ fontSize: '1.4rem', color: 'var(--text-muted)', marginBottom: '2.5rem', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
          Order Direct from Sivakasi Crackers Online. Explore the Wide Range of Fireworks and Make This Diwali Colourful!
        </p>
        <button className="btn btn-primary animate-pulse" onClick={() => window.scrollTo({ top: 600, behavior: 'smooth' })}>
          Shop Now
        </button>
      </div>
    </section>
  );
};

export default Hero;
