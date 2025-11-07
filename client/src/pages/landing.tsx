import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Brain, 
  Sparkles, 
  Shield, 
  TrendingUp, 
  Calendar, 
  BookOpen, 
  MessageSquare,
  Check,
  Zap,
  Users,
  Lock,
  Target,
  Activity,
  Video,
  Heart,
  Gauge,
  Clock,
  Award,
  ChevronRight
} from "lucide-react";

export default function Landing() {
  const [, setLocation] = useLocation();

  const coreTools = [
    {
      icon: <MessageSquare className="h-8 w-8" />,
      title: '"Oracle"',
      subtitle: "AI Mentor",
      description: "Your adaptive AI coach that listens, learns, and guides you through emotional and cognitive transitions.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: "BOSS",
      subtitle: "Behavioral Optimization Sprint System",
      description: "5–7-day guided micro-programs that transform behavior through real-time reflection, action, and feedback.",
      tagline: "Be your own BOSS.",
      gradient: "from-blue-500 to-purple-500"
    },
    {
      icon: <BookOpen className="h-8 w-8" />,
      title: "Encrypted Journaling",
      subtitle: "Military-Grade Privacy",
      description: "Voice, text, or video journals protected by military-grade encryption and private to you.",
      gradient: "from-green-500 to-teal-500"
    },
    {
      icon: <Gauge className="h-8 w-8" />,
      title: "Resilience Index",
      subtitle: "Performance Dashboard",
      description: "Tracks your Resilience Score, Focus Efficiency, Recovery Latency, Decision Clarity, and Growth Adaptability.",
      gradient: "from-orange-500 to-red-500"
    },
    {
      icon: <Video className="h-8 w-8" />,
      title: "Before–After Reflection",
      subtitle: "Growth Visualization",
      description: "AI analyzes emotional tone, speech, and expression shifts from your journal or video entries to visualize growth over time.",
      gradient: "from-indigo-500 to-purple-500"
    }
  ];

  const whyItWorks = [
    {
      icon: <Brain className="h-8 w-8" />,
      title: "AI-Driven Precision",
      description: "Adaptive, personalized mental health insights trained on thousands of behavioral patterns."
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Human-Assisted Wisdom",
      description: "Certified coaches, psychiatrists, and wellness experts review anonymized patterns for quality assurance."
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Ethical Intelligence",
      description: "HIPAA + GDPR compliant, emotion-safe AI that never diagnoses — it empowers."
    }
  ];

  const pricingTiers = [
    {
      name: "Basic Mind Starter",
      priceRange: "$5–$9",
      period: "/month",
      description: "Build your foundation",
      features: [
        "Resilience Index tracking",
        "Encrypted journaling",
        'AI "Oracle" Mentor access (text only)',
        "Basic BOSS sprints",
        "Email support"
      ],
      gradient: "from-purple-500 to-purple-600",
      cta: "Start Building",
      popular: false
    },
    {
      name: "Growth Plan",
      priceRange: "$39–$99",
      period: "/month",
      description: "Accelerate your progress",
      features: [
        "Everything in Basic",
        "Full BOSS sprint library",
        "Voice AI mentoring",
        "Complete dashboard access",
        "Before-After reflection analysis",
        "Priority support"
      ],
      gradient: "from-blue-500 to-purple-600",
      cta: "Unlock Growth",
      popular: true
    },
    {
      name: "Inclusive Plan",
      priceRange: "$299–$399",
      period: "/month",
      description: "Human + AI synergy",
      features: [
        "Everything in Growth",
        "Real wellness coaches",
        "Wearables integration",
        "24/7 AI chat support",
        "Premium analytics",
        "Personalized reports"
      ],
      gradient: "from-green-500 to-teal-600",
      cta: "Get Inclusive",
      popular: false
    },
    {
      name: "Elite Mind Architect",
      priceRange: "$999",
      period: "/month",
      description: "The ultimate mental-performance OS",
      features: [
        "Everything in Inclusive",
        "1-on-1 psychiatrist sessions",
        "Personal wellness coach",
        "Fitness expert matching",
        "Fully customized program",
        "Executive priority support"
      ],
      gradient: "from-yellow-500 to-orange-600",
      cta: "Become Elite",
      popular: false
    }
  ];

  const technologies = [
    { icon: <MessageSquare className="h-6 w-6" />, label: "Voice & video sentiment analysis" },
    { icon: <Activity className="h-6 w-6" />, label: "Wearable device integrations" },
    { icon: <TrendingUp className="h-6 w-6" />, label: "Real-time stress pattern mapping" },
    { icon: <Lock className="h-6 w-6" />, label: "AES-256 encrypted data vault" }
  ];

  const testimonials = [
    { quote: "It's like having a board advisor for your mental clarity.", author: "Sarah K., Series A Founder" },
    { quote: "The BOSS sprints taught me to transform burnout into balance.", author: "Michael T., Tech CEO" },
    { quote: "Finally, a tool that treats mental health like performance science, not stigma.", author: "Jennifer L., YC Alum" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0A23] via-[#281A3E] to-[#5B2C6F]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Breathing animation background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <div className="breathe-circle w-96 h-96 rounded-full bg-gradient-to-r from-purple-500 to-gold-500 blur-3xl"></div>
        </div>
        
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 md:pt-20 pb-16 sm:pb-20">
          <div className="max-w-5xl mx-auto text-center space-y-6 sm:space-y-8">
            <div className="flex justify-center mb-6 sm:mb-8">
              <img 
                src="/logo.png" 
                alt="AuraVerse AI Logo" 
                className="h-32 sm:h-40 md:h-48 lg:h-56 w-auto animate-[fadeIn_1s_ease-in-out] drop-shadow-2xl"
                data-testid="landing-logo"
              />
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight px-4" data-testid="text-landing-title">
              Building Resilient Minds
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent">
                for the World's Founders
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto px-4" data-testid="text-landing-subtitle">
              Measure, strengthen, and optimize your mental resilience through AI-powered mentorship and Behavioral Optimization Sprints (BOSS).
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-center pt-6 px-4">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 h-14 w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 gold-glow-hover"
                onClick={() => setLocation('/onboarding')}
                data-testid="button-build-resilience"
              >
                Build Your Resilience <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8 py-6 h-14 w-full sm:w-auto border-2 border-purple-400 text-white hover:bg-purple-400/10"
                onClick={() => setLocation('/onboarding')}
                data-testid="button-assessment"
              >
                Take the 2-Minute Assessment
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-400" />
                <span>HIPAA Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-green-400" />
                <span>GDPR Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-green-400" />
                <span>Trusted by 1000+ founders</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Where Science Meets Self-Mastery
          </h2>
          <p className="text-lg text-gray-300 leading-relaxed">
            AuraVerse AI blends neuroscience, AI, and foresight to empower entrepreneurs to lead with clarity and calm.
          </p>
          <div className="grid md:grid-cols-3 gap-8 pt-8">
            <div className="text-center space-y-2">
              <p className="text-2xl font-bold text-purple-400">Our Mission</p>
              <p className="text-gray-400">Make mental resilience measurable, actionable, and inspiring</p>
            </div>
            <div className="text-center space-y-2">
              <p className="text-2xl font-bold text-pink-400">Our Vision</p>
              <p className="text-gray-400">Help 10 million founders thrive by 2030</p>
            </div>
            <div className="text-center space-y-2">
              <p className="text-2xl font-bold text-yellow-400">Our Approach</p>
              <p className="text-gray-400">Stress → Reflection → Insight → Growth → Resilience</p>
            </div>
          </div>
        </div>
      </div>

      {/* Core Tools Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 bg-black/20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Your Mental-Performance Toolkit
          </h2>
          <p className="text-lg text-gray-300">
            Five powerful tools designed to build measurable resilience
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {coreTools.map((tool, idx) => (
            <Card 
              key={idx} 
              className={`group relative overflow-hidden bg-gradient-to-br ${tool.gradient} p-[2px] hover-lift cursor-pointer`}
              data-testid={`tool-card-${idx}`}
            >
              <div className="bg-[#1A1A2E] h-full p-6 rounded-lg">
                <div className="mb-4">
                  <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${tool.gradient} text-white`}>
                    {tool.icon}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">
                  {tool.title}
                </h3>
                <p className="text-sm text-purple-300 mb-3">{tool.subtitle}</p>
                <p className="text-sm text-gray-300 mb-3">{tool.description}</p>
                {tool.tagline && (
                  <p className="text-sm font-semibold text-yellow-400 italic">{tool.tagline}</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Dashboard Preview Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Track What Matters
            </h2>
            <p className="text-lg text-gray-300">
              Your Resilience Index dashboard provides real-time insights into your mental performance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/50 border-purple-500/30 p-6">
              <div className="flex items-center gap-3 mb-3">
                <Gauge className="h-6 w-6 text-purple-400" />
                <h3 className="font-semibold text-white">Resilience Score</h3>
              </div>
              <div className="text-4xl font-bold text-purple-300">78</div>
              <p className="text-sm text-gray-400 mt-2">Main KPI - circular gauge visualization</p>
            </Card>

            <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 border-blue-500/30 p-6">
              <div className="flex items-center gap-3 mb-3">
                <Target className="h-6 w-6 text-blue-400" />
                <h3 className="font-semibold text-white">Focus Efficiency</h3>
              </div>
              <div className="h-2 bg-blue-900/50 rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-gradient-to-r from-blue-400 to-blue-600"></div>
              </div>
              <p className="text-sm text-gray-400 mt-2">Bar graph tracking</p>
            </Card>

            <Card className="bg-gradient-to-br from-green-900/50 to-green-800/50 border-green-500/30 p-6">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="h-6 w-6 text-green-400" />
                <h3 className="font-semibold text-white">Recovery Latency</h3>
              </div>
              <div className="text-3xl font-bold text-green-300">12m</div>
              <p className="text-sm text-gray-400 mt-2">Timer visualization</p>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/50 border-yellow-500/30 p-6">
              <div className="flex items-center gap-3 mb-3">
                <Brain className="h-6 w-6 text-yellow-400" />
                <h3 className="font-semibold text-white">Decision Clarity</h3>
              </div>
              <div className="text-3xl font-bold text-yellow-300">85%</div>
              <p className="text-sm text-gray-400 mt-2">Clarity radar visualization</p>
            </Card>

            <Card className="bg-gradient-to-br from-pink-900/50 to-pink-800/50 border-pink-500/30 p-6">
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp className="h-6 w-6 text-pink-400" />
                <h3 className="font-semibold text-white">Growth Adaptability</h3>
              </div>
              <div className="text-3xl font-bold text-pink-300">↗ +12%</div>
              <p className="text-sm text-gray-400 mt-2">Line progress trend</p>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-900/50 to-indigo-800/50 border-indigo-500/30 p-6">
              <div className="flex items-center gap-3 mb-3">
                <Heart className="h-6 w-6 text-indigo-400" />
                <h3 className="font-semibold text-white">Weekly Insights</h3>
              </div>
              <p className="text-sm text-gray-300">AI-generated optimization suggestions</p>
            </Card>
          </div>
        </div>
      </div>

      {/* Why AuraVerse Works */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 bg-black/20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Why AuraVerse Works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {whyItWorks.map((item, idx) => (
            <Card key={idx} className="bg-gradient-to-br from-purple-900/30 to-transparent border-purple-500/20 p-6 text-center hover-lift">
              <div className="inline-flex p-4 rounded-full bg-purple-500/20 text-purple-300 mb-4">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
              <p className="text-gray-300">{item.description}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Pricing Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Invest in Your Mental Resilience
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Every plan builds measurable resilience. The $999 tier offers human-AI synergy for elite founders and investors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {pricingTiers.map((tier, idx) => (
            <Card 
              key={idx} 
              className={`relative overflow-hidden bg-[#1A1A2E] border-2 ${tier.popular ? 'border-purple-400 scale-105' : 'border-purple-900/30'} hover-lift`}
              data-testid={`pricing-${tier.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {tier.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  POPULAR
                </div>
              )}
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
                <p className="text-sm text-gray-400 mb-4">{tier.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold bg-gradient-to-r ${tier.gradient} bg-clip-text text-transparent">{tier.priceRange}</span>
                  <span className="text-gray-400 text-sm">{tier.period}</span>
                </div>

                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-purple-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className={`w-full bg-gradient-to-r ${tier.gradient} hover:opacity-90`}
                  onClick={() => setLocation('/onboarding')}
                  data-testid={`button-${tier.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {tier.cta}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Ethical Gatekeeping Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 bg-black/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <Shield className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-4">
              We Care About Your Safety
            </h2>
          </div>

          <Card className="bg-gradient-to-br from-green-900/20 to-transparent border-green-500/30 p-8">
            <div className="space-y-4 text-gray-300">
              <p className="text-lg">
                <strong className="text-white">Ethical gatekeeping:</strong> If you mark suicidal or addiction-related issues during onboarding, we'll auto-redirect you to local government helpline portals based on your location.
              </p>
              <p>
                Account continuation requires support confirmation to ensure your safety.
              </p>
              <p className="text-yellow-400 font-semibold italic">
                "AuraVerse does not replace therapy. It complements it — ethically, responsibly, and compassionately."
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Technology Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Where AI Meets Empathy
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            {technologies.map((tech, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-purple-900/20 border border-purple-500/20 rounded-lg p-4">
                <div className="text-purple-400">{tech.icon}</div>
                <span className="text-gray-300">{tech.label}</span>
              </div>
            ))}
          </div>
          <Button 
            variant="outline" 
            className="mt-8 border-purple-400 text-white hover:bg-purple-400/10"
            onClick={() => setLocation('/onboarding')}
            data-testid="button-explore-science"
          >
            Explore the Science <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Partnership & Compliance Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-black/20">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl font-bold text-white mb-8">Trusted Partners & Compliance</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-white/5 border-white/10 p-4">
              <p className="text-sm text-gray-300">École des Ponts Business School</p>
            </Card>
            <Card className="bg-white/5 border-white/10 p-4">
              <p className="text-sm text-gray-300">ReTech Center for Futures Studies</p>
            </Card>
            <Card className="bg-white/5 border-white/10 p-4">
              <p className="text-sm text-gray-300">Healthcare Partners</p>
            </Card>
          </div>
          <div className="flex flex-wrap justify-center gap-3 text-xs text-green-400">
            <span className="flex items-center gap-1"><Check className="h-3 w-3" /> HIPAA Compliant</span>
            <span className="flex items-center gap-1"><Check className="h-3 w-3" /> GDPR Ready</span>
            <span className="flex items-center gap-1"><Check className="h-3 w-3" /> AI Ethics Verified</span>
            <span className="flex items-center gap-1"><Check className="h-3 w-3" /> UNESCO Future Literacy Inspired</span>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Trusted by Founders Worldwide
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial, idx) => (
            <Card key={idx} className="bg-gradient-to-br from-purple-900/30 to-transparent border-purple-500/20 p-6">
              <p className="text-gray-300 italic mb-4">"{testimonial.quote}"</p>
              <p className="text-sm text-purple-400 font-semibold">— {testimonial.author}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Footer */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Card className="relative overflow-hidden bg-gradient-to-r from-purple-900/50 via-pink-900/50 to-yellow-900/50 border-none p-12">
          <div className="absolute inset-0 breathe-circle opacity-20 bg-gradient-to-r from-purple-500 to-pink-500 blur-3xl"></div>
          <div className="relative max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Ready to Build Your Mental Resilience?
            </h2>
            <p className="text-xl text-gray-300">
              Confidential. Adaptive. Founder-First.
            </p>
            <Button 
              size="lg" 
              className="text-lg px-12 py-6 h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 gold-glow-hover"
              onClick={() => setLocation('/onboarding')}
              data-testid="button-cta-start-journey"
            >
              Start Your Journey <Sparkles className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-sm text-gray-400">Join thousands of founders building resilience, not resistance.</p>
          </div>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t border-purple-900/30 bg-black/30">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-white mb-4">About</h4>
              <p className="text-sm text-gray-400">Features</p>
              <p className="text-sm text-gray-400">Pricing</p>
              <p className="text-sm text-gray-400">BOSS</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Resources</h4>
              <p className="text-sm text-gray-400">Blog</p>
              <p className="text-sm text-gray-400">Partnerships</p>
              <button onClick={() => setLocation('/contact')} className="text-sm text-gray-400 hover:text-white" data-testid="link-contact-footer">Contact</button>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <button onClick={() => setLocation('/privacy')} className="text-sm text-gray-400 hover:text-white block" data-testid="link-privacy-footer">Privacy Policy</button>
              <button onClick={() => setLocation('/terms')} className="text-sm text-gray-400 hover:text-white block" data-testid="link-terms-footer">Terms of Service</button>
              <p className="text-sm text-gray-400">Data Ethics Charter</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Social</h4>
              <p className="text-sm text-gray-400">LinkedIn</p>
              <p className="text-sm text-gray-400">Twitter</p>
              <p className="text-sm text-gray-400">Instagram</p>
            </div>
          </div>
          <div className="border-t border-purple-900/30 pt-8 text-center">
            <p className="text-sm text-gray-400 mb-2">
              <strong className="text-purple-400">Powered by Foresight. Driven by Compassion.</strong>
            </p>
            <p className="text-xs text-gray-500">
              AuraVerse AI © 2025. All rights reserved. AuraVerse is a mental-performance platform, not a substitute for medical diagnosis or therapy.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
