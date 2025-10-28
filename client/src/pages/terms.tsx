import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";

export default function Terms() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-8 py-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl text-primary">Terms of Service</CardTitle>
              <p className="text-sm text-muted-foreground">Last updated: October 28, 2025</p>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <h2 className="text-xl font-semibold text-primary mt-6">1. Acceptance of Terms</h2>
              <p className="text-foreground">
                By accessing and using AuraVerse AI ("the Service"), you accept and agree to be bound by the terms and provision of this agreement.
              </p>

              <h2 className="text-xl font-semibold text-primary mt-6">2. Use of Service</h2>
              <p className="text-foreground">
                AuraVerse AI provides mental wellness support and tools for entrepreneurs. The Service is not a substitute for professional medical advice, diagnosis, or treatment.
              </p>

              <h2 className="text-xl font-semibold text-primary mt-6">3. User Accounts</h2>
              <p className="text-foreground">
                You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
              </p>

              <h2 className="text-xl font-semibold text-primary mt-6">4. Privacy and Data Protection</h2>
              <p className="text-foreground">
                Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your personal information. Journal entries are encrypted client-side for your privacy.
              </p>

              <h2 className="text-xl font-semibold text-primary mt-6">5. Disclaimer</h2>
              <p className="text-foreground">
                The AI Oracle and therapeutic programs are for informational purposes only. If you are experiencing a mental health emergency, please contact emergency services or a qualified mental health professional immediately.
              </p>

              <h2 className="text-xl font-semibold text-primary mt-6">6. Subscription and Billing</h2>
              <p className="text-foreground">
                Subscription fees are billed according to your chosen plan. You may cancel your subscription at any time. Refunds are handled on a case-by-case basis.
              </p>

              <h2 className="text-xl font-semibold text-primary mt-6">7. Modifications</h2>
              <p className="text-foreground">
                We reserve the right to modify these terms at any time. Continued use of the Service after changes constitutes acceptance of the new terms.
              </p>

              <h2 className="text-xl font-semibold text-primary mt-6">8. Contact</h2>
              <p className="text-foreground">
                For questions about these Terms of Service, please contact us through our Contact page.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer isAuthenticated={isAuthenticated} />
    </div>
  );
}
