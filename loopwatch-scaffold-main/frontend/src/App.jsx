import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Home from './pages/Home';
import HowItWorks from './pages/HowItWorks';
import LiveDemo from './pages/LiveDemo';
import WhyNotTimeout from './pages/WhyNotTimeout';
import EvalResults from './pages/EvalResults';
import AboutTeam from './pages/AboutTeam';
import { fetchPresets } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [presets, setPresets] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState('');

  useEffect(() => {
    fetchPresets().then(setPresets);
  }, []);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  const handleSelectPreset = (promptText) => {
    setSelectedPrompt(promptText);
    setActiveTab('demo');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090b0e] text-[#f1f5f9] font-sans selection:bg-[#00f0ff]/30 selection:text-[#00f0ff]">
      
      {/* Sticky Header Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        presets={presets}
        onSelectPreset={handleSelectPreset}
      />

      {/* Main Page Body */}
      <main className="flex-1">
        {activeTab === 'home' && <Home setActiveTab={setActiveTab} />}
        {activeTab === 'how-it-works' && <HowItWorks />}
        {activeTab === 'demo' && (
          <LiveDemo presets={presets} initialPrompt={selectedPrompt} />
        )}
        {activeTab === 'why-not-timeout' && <WhyNotTimeout />}
        {activeTab === 'eval' && <EvalResults />}
        {activeTab === 'about' && <AboutTeam />}
      </main>

      {/* Shared Footer */}
      <Footer setActiveTab={setActiveTab} />

    </div>
  );
}
