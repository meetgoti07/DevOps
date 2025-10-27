"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Clock, Users, Zap } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isCustomer, isAdmin, isStaff } = useRoleAccess();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Redirect based on user role
      if (isAdmin) {
        router.push("/admin");
      } else if (isStaff) {
        router.push("/staff");
      } else if (isCustomer) {
        router.push("/menu");
      }
    }
  }, [isAuthenticated, isLoading, isAdmin, isStaff, isCustomer, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect to /menu
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 mb-16 gradient-bg-hero text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 page-container text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Skip the Line,
              <br />
              <span className="text-yellow-300">Order Smart</span>
            </h1>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Order from your favorite canteen items, track your queue position
              in real-time, and get notified when your order is ready for
              pickup.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                asChild
                className="bg-white text-purple-600 hover:bg-white/90"
              >
                <Link href="/register">Get Started</Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                asChild
                className="border-white text-white hover:bg-white/10"
              >
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="page-container">
        {/* Features Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose Our Canteen Queue Manager?
          </h2>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="professional-card hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <ShoppingCart className="h-12 w-12 text-purple-600 mb-4" />
                <CardTitle>Easy Online Ordering</CardTitle>
                <CardDescription>
                  Browse our full menu and place orders from anywhere on campus.
                  No more waiting in long lines.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="professional-card hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <Clock className="h-12 w-12 text-purple-600 mb-4" />
                <CardTitle>Real-time Queue Tracking</CardTitle>
                <CardDescription>
                  Know exactly where you are in the queue and get accurate wait
                  time estimates for your order.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="professional-card hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <Users className="h-12 w-12 text-purple-600 mb-4" />
                <CardTitle>Smart Queue Management</CardTitle>
                <CardDescription>
                  Our intelligent system optimizes order preparation and reduces
                  overall wait times for everyone.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="professional-card hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <Zap className="h-12 w-12 text-purple-600 mb-4" />
                <CardTitle>Instant Notifications</CardTitle>
                <CardDescription>
                  Get notified when your order is being prepared and when it's
                  ready for pickup.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="professional-card hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <Badge
                  className="w-fit mb-4 gradient-bg-secondary text-white"
                  variant="secondary"
                >
                  Payment
                </Badge>
                <CardTitle>Secure Payments</CardTitle>
                <CardDescription>
                  Pay online securely and skip the payment queue. Just pick up
                  your order when it's ready.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="professional-card hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <Badge
                  className="w-fit mb-4 gradient-bg-success text-white"
                  variant="secondary"
                >
                  Mobile
                </Badge>
                <CardTitle>Mobile Friendly</CardTitle>
                <CardDescription>
                  Access from any device - desktop, tablet, or mobile. Order on
                  the go, anytime, anywhere.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="w-16 h-16 gradient-bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Browse & Order</h3>
              <p className="text-muted-foreground">
                Browse our menu, select your favorite items, and place your
                order online.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 gradient-bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Track Progress</h3>
              <p className="text-muted-foreground">
                Monitor your order's progress and queue position in real-time.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 gradient-bg-success rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Pick Up</h3>
              <p className="text-muted-foreground">
                Get notified when ready and simply pick up your order - no
                waiting!
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center py-16 professional-card rounded-xl">
          <h2 className="text-3xl font-bold mb-4">Ready to Skip the Queue?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join hundreds of students and staff who are already saving time with
            our system.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              asChild
              className="gradient-bg-primary text-white"
            >
              <Link href="/register">Create Account</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/login">Already have an account?</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
