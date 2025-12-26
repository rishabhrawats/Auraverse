import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/auth";
import { SiGoogle } from "react-icons/si";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignInFormData = z.infer<typeof signInSchema>;

export default function SignIn() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await authService.signInWithGoogle();
      
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
      
      setLocation("/dashboard");
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      toast({
        title: "Sign In Failed",
        description: error.message || "Unable to sign in with Google. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const onSubmit = async (data: SignInFormData) => {
    setIsLoading(true);
    try {
      await authService.signIn(data.email, data.password);
      
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
      
      setLocation("/dashboard");
    } catch (error: any) {
      console.error("Sign-in error:", error);
      let errorMessage = "Please check your credentials";
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email. Please sign up first.";
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = "Incorrect password. Please try again.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed attempts. Please try again later.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Sign In Failed",
        description: errorMessage,
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
          <h1 className="text-3xl font-bold text-primary" data-testid="text-signin-title">
            AuraVerse AI
          </h1>
          <p className="text-foreground mt-2" data-testid="text-signin-subtitle">
            Sign in to your account
          </p>
        </div>

        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full h-11"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            data-testid="button-google-signin"
          >
            <SiGoogle className="mr-2 h-5 w-5 text-[#4285F4]" />
            {isGoogleLoading ? "Signing in..." : "Continue with Google"}
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
              data-testid="button-signin"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </Form>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Don't have an account? </span>
          <Button
            variant="link"
            className="p-0 h-auto"
            onClick={() => setLocation("/signup")}
            data-testid="link-signup"
          >
            Sign up
          </Button>
        </div>
      </div>
    </div>
  );
}
