import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  Lightbulb,
  Users,
  DollarSign,
  BookOpen,
  Star,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Target,
  Zap,
} from "lucide-react";

interface LandingPageProps {
  onSignIn?: () => void;
  onGetStarted?: () => void;
  onNavigate?: (view: string) => void;
}

export function LandingPage({
  onSignIn,
  onGetStarted,
  onNavigate,
}: LandingPageProps = {}) {
  const features = [
    {
      icon: <Users className="h-8 w-8 text-purple-600" />,
      title: "AI-Powered Mentor Matching",
      description:
        "Get paired with industry experts who understand your journey and can guide your startup to success.",
    },
    {
      icon: <DollarSign className="h-8 w-8 text-green-600" />,
      title: "Funding Access",
      description:
        "Connect with corporate and government funding opportunities tailored for women-led startups.",
    },
    {
      icon: <BookOpen className="h-8 w-8 text-blue-600" />,
      title: "Training Resources",
      description:
        "Access comprehensive courses, workshops, and resources designed for female entrepreneurs.",
    },
    {
      icon: <Lightbulb className="h-8 w-8 text-orange-600" />,
      title: "Pitch Submission",
      description:
        "Submit and refine your pitches with expert feedback and review from our community.",
    },
  ];

  const stats = [
    { number: "10K+", label: "Women Entrepreneurs" },
    { number: "500+", label: "Expert Mentors" },
    { number: "$50M+", label: "Funding Facilitated" },
    { number: "95%", label: "Success Rate" },
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "CEO, TechFlow",
      content:
        "EmpowerHer connected me with the perfect mentor who helped me scale my startup from idea to $2M funding.",
      rating: 5,
    },
    {
      name: "Maria Rodriguez",
      role: "Founder, GreenSpace",
      content:
        "The platform's training resources and funding connections were game-changers for my sustainable tech startup.",
      rating: 5,
    },
    {
      name: "Aisha Patel",
      role: "Co-founder, HealthTech Solutions",
      content:
        "The AI mentor matching is incredible. I found someone who perfectly understood my industry challenges.",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">
                EmpowerHer
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => onNavigate?.("dashboard")}
                className="text-gray-600 hover:text-purple-600"
              >
                Features
              </button>
              <button
                onClick={() => onNavigate?.("mentors")}
                className="text-gray-600 hover:text-purple-600"
              >
                Mentors
              </button>
              <button
                onClick={() => onNavigate?.("funding")}
                className="text-gray-600 hover:text-purple-600"
              >
                Funding
              </button>
              <button
                onClick={() => onNavigate?.("training")}
                className="text-gray-600 hover:text-purple-600"
              >
                Training
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onSignIn}>
                Sign In
              </Button>
              <Button
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                onClick={onGetStarted}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 mb-6">
                Empowering Women Entrepreneurs
              </Badge>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Your{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                  Vision
                </span>{" "}
                Starts Here
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Join thousands of women entrepreneurs who are transforming their
                ideas into successful startups. Get matched with mentors, access
                funding, and accelerate your journey with AI-powered insights.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  onClick={onGetStarted}
                >
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline">
                  Watch Demo
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {stat.number}
                    </div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-20"></div>
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1758873268528-af4613d099b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21lbiUyMGVudHJlcHJlbmV1cnMlMjBidXNpbmVzcyUyMG1lZXRpbmd8ZW58MXx8fHwxNzU5MzE4OTkzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Professional women entrepreneurs in business meeting"
                className="relative rounded-2xl shadow-2xl w-full h-[500px] object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 mb-6">
              Platform Features
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive platform provides all the tools and resources
              you need to transform your startup idea into a thriving business.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 p-3 bg-gray-50 rounded-full w-fit">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-gray-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 mb-6">
              How It Works
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Your Path to Success
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-purple-600">1</span>
              </div>
              <h3 className="text-xl font-bold mb-4">
                Register & Profile Setup
              </h3>
              <p className="text-gray-600">
                Create your secure profile and tell us about your startup
                journey, goals, and industry focus.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-purple-600">2</span>
              </div>
              <h3 className="text-xl font-bold mb-4">AI Mentor Matching</h3>
              <p className="text-gray-600">
                Our AI matches you with the perfect mentors based on your
                industry, stage, and specific needs.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Scale & Succeed</h3>
              <p className="text-gray-600">
                Access funding opportunities, training resources, and community
                support to grow your startup.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 mb-6">
              Success Stories
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Trusted by Thousands
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-5 w-5 text-yellow-400 fill-current"
                      />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6 italic">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <div className="font-bold text-gray-900">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {testimonial.role}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Your Vision?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of women entrepreneurs who are already building the
            future. Your success story starts today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-purple-600 hover:bg-gray-100"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
            >
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-xl">EmpowerHer</span>
              </div>
              <p className="text-gray-400 mb-6">
                Empowering women entrepreneurs to build the future, one startup
                at a time.
              </p>
              <div className="flex space-x-4">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-gray-400 hover:text-white p-2"
                >
                  <Users className="h-5 w-5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-gray-400 hover:text-white p-2"
                >
                  <TrendingUp className="h-5 w-5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-gray-400 hover:text-white p-2"
                >
                  <Target className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-6">Platform</h4>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Mentors
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Success Stories
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6">Resources</h4>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Training
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Funding Guide
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Help Center
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6">Company</h4>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Privacy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>
              &copy; 2026 EmpowerHer. All rights reserved. Built with ❤️ for
              women entrepreneurs.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
