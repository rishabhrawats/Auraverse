import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SiGoogle, SiLinkedin } from "react-icons/si";

const signUpSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Name must be at least 2 characters"),
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUp() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const oauthSuccess = params.get('oauth');
    const error = params.get('error');

    if (error === 'oauth_failed') {
      toast({
        title: "OAuth Failed",
        description: "Unable to sign up with OAuth. Please try again.",
        variant: "destructive",
      });
      window.history.replaceState({}, '', '/signup');
    }

    if (token && oauthSuccess === 'success') {
      localStorage.setItem("auth_token", token);
      
      // Complete onboarding if data exists
      const onboardingDataStr = sessionStorage.getItem('onboarding_data');
      if (onboardingDataStr) {
        const onboardingData = JSON.parse(onboardingDataStr);
        fetch("/api/onboarding/complete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...onboardingData,
            consent: true,
            timezone: onboardingData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
          }),
        }).then(async (response) => {
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Onboarding failed");
          }
          sessionStorage.removeItem('onboarding_data');
          toast({
            title: "Welcome to AuraVerse!",
            description: "Your account has been created successfully.",
          });
          window.location.href = "/dashboard";
        }).catch((error) => {
          toast({
            title: "Onboarding Failed",
            description: error instanceof Error ? error.message : "Please complete your profile from settings.",
            variant: "destructive",
          });
          // Don't clear session storage so user can retry
          window.location.href = "/dashboard";
        });
      } else {
        toast({
          title: "Welcome to AuraVerse!",
          description: "Your account has been created successfully.",
        });
        window.location.href = "/dashboard";
      }
    }
  }, [toast]);

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
    },
  });

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    try {
      // Get onboarding data from sessionStorage
      const onboardingDataStr = sessionStorage.getItem('onboarding_data');
      const onboardingData = onboardingDataStr ? JSON.parse(onboardingDataStr) : {};

      // Register user
      const registerResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!registerResponse.ok) {
        const error = await registerResponse.json();
        throw new Error(error.error || "Registration failed");
      }

      const result = await registerResponse.json();
      localStorage.setItem("auth_token", result.token);

      // Complete onboarding with stored data
      if (Object.keys(onboardingData).length > 0) {
        const onboardingResponse = await fetch("/api/onboarding/complete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${result.token}`,
          },
          body: JSON.stringify({
            ...onboardingData,
            consent: true,
            timezone: onboardingData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
          }),
        });

        if (!onboardingResponse.ok) {
          const error = await onboardingResponse.json();
          throw new Error(error.error || "Onboarding failed");
        }

        sessionStorage.removeItem('onboarding_data');
      }

      toast({
        title: "Welcome to AuraVerse!",
        description: "Your account has been created successfully.",
      });
      
      window.location.href = "/dashboard";
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary" data-testid="text-signup-title">
            AuraVerse AI
          </h1>
          <p className="text-foreground mt-2" data-testid="text-signup-subtitle">
            Create your account
          </p>
        </div>

        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full h-11"
            onClick={() => window.location.href = '/api/auth/google'}
            data-testid="button-google-signup"
          >
            <SiGoogle className="mr-2 h-5 w-5 text-[#4285F4]" />
            Continue with Google
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11"
            onClick={() => window.location.href = '/api/auth/linkedin'}
            data-testid="button-linkedin-signup"
          >
            <SiLinkedin className="mr-2 h-5 w-5 text-[#0A66C2]" />
            Continue with LinkedIn
          </Button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="John Doe"
                      {...field}
                      data-testid="input-fullname"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      {...field}
                      data-testid="input-email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="••••••••"
                      {...field}
                      data-testid="input-password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-signup"
            >
              {isLoading ? "Creating account..." : "Sign Up"}
            </Button>
          </form>
        </Form>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <Button
            variant="link"
            className="p-0 h-auto"
            onClick={() => setLocation("/signin")}
            data-testid="link-signin"
          >
            Sign in
          </Button>
        </div>
      </div>
    </div>
  );
}
