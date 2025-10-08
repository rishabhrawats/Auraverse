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
  Lock
} from "lucide-react";

export default function Landing() {
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "6-Metric Effectiveness Index",
      description: "Real-time tracking of Focus, Recovery, Decision Clarity, Emotion Regulation, Support, and Momentum"
    },
    {
      icon: <Brain className="h-6 w-6" />,
      title: "AI Therapeutic Programs",
      description: "Personalized mental wellness programs powered by OpenAI and Anthropic for founders"
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: "Zen Mode Calendar Integration",
      description: "Google Calendar sync with distraction guard and breathing pattern guidance"
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: "Encrypted Journal",
      description: "Client-side AES-256 encryption ensures your thoughts stay private forever"
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "AI Oracle Assistant",
      description: "Instant decision support and mental health Q&A powered by advanced AI"
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: "Crisis Detection",
      description: "Real-time language analysis to detect and support during mental health crises"
    }
  ];

  const pricingTiers = [
    {
      name: "Basic",
      price: "$5",
      period: "/month",
      description: "Perfect for getting started",
      features: [
        "Effectiveness Index tracking",
        "Basic AI programs",
        "Encrypted journal",
        "Basic AI Oracle access",
        "Email support"
      ],
      cta: "Start Basic",
      popular: false
    },
    {
      name: "Medium",
      price: "$29",
      period: "/month",
      description: "For serious founders",
      features: [
        "Everything in Basic",
        "Advanced AI programs",
        "Zen Mode calendar sync",
        "Advanced AI Oracle",
        "Analytics & insights",
        "Priority support"
      ],
      cta: "Start Medium",
      popular: true
    },
    {
      name: "Exclusive",
      price: "$99",
      period: "/month",
      description: "Maximum mental wellness",
      features: [
        "Everything in Medium",
        "Personalized AI insights",
        "24/7 priority support",
        "Custom program creation",
        "Dedicated account manager",
        "API access"
      ],
      cta: "Start Exclusive",
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary">
            <Zap className="h-4 w-4" />
            AI-Powered Mental Wellness Platform
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight" data-testid="text-landing-title">
            Mental Wellness
            <br />
            Built for Founders
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-landing-subtitle">
            Track your effectiveness in real-time, access AI-coached therapeutic programs, and achieve peak mental performance
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 h-14 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90"
              onClick={() => setLocation('/onboarding')}
              data-testid="button-start-free"
            >
              Start Free Trial <Sparkles className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-6 h-14"
              onClick={() => setLocation('/signin')}
              data-testid="button-signin"
            >
              Sign In
            </Button>
          </div>

          <div className="flex items-center justify-center gap-8 pt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              Client-side encryption
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-green-500" />
              HIPAA compliant
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              Trusted by 1000+ founders
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need to Thrive
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A comprehensive mental wellness platform designed specifically for the unique challenges of entrepreneurship
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, idx) => (
            <Card key={idx} className="p-6 bg-card border-border hover:border-primary/50 transition-all hover:shadow-lg" data-testid={`feature-${idx}`}>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg text-primary">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Pricing Section */}
      <div className="container mx-auto px-4 py-20 bg-muted/30">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your mental wellness journey
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingTiers.map((tier, idx) => (
            <Card 
              key={idx} 
              className={`p-8 relative ${tier.popular ? 'border-primary border-2 shadow-xl scale-105' : 'border-border'}`}
              data-testid={`pricing-${tier.name.toLowerCase()}`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-sm font-medium rounded-full">
                  Most Popular
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">{tier.description}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold">{tier.price}</span>
                  <span className="text-muted-foreground">{tier.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, fidx) => (
                  <li key={fidx} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                className={`w-full ${tier.popular ? 'bg-gradient-to-r from-primary to-purple-600' : ''}`}
                variant={tier.popular ? 'default' : 'outline'}
                onClick={() => setLocation('/onboarding')}
                data-testid={`button-${tier.name.toLowerCase()}`}
              >
                {tier.cta}
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20">
        <Card className="p-12 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border-none">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Transform Your Mental Wellness?
            </h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of founders who trust AuraVerse AI for their mental health journey
            </p>
            <Button 
              size="lg" 
              className="text-lg px-12 py-6 h-14 bg-gradient-to-r from-primary to-purple-600"
              onClick={() => setLocation('/onboarding')}
              data-testid="button-cta-start"
            >
              Start Your Free Trial <Sparkles className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 AuraVerse AI. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <button onClick={() => setLocation('/privacy')} className="hover:text-foreground transition-colors">
                Privacy Policy
              </button>
              <button className="hover:text-foreground transition-colors">
                Terms of Service
              </button>
              <button className="hover:text-foreground transition-colors">
                Contact
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
