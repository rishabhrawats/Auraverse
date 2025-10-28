import { Link } from "wouter";

interface FooterProps {
  isAuthenticated?: boolean;
}

export function Footer({ isAuthenticated = false }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-primary">AuraVerse AI</h3>
            <p className="text-sm text-muted-foreground">
              Mental wellness platform for entrepreneurs and startup founders.
            </p>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/programs" className="text-muted-foreground hover:text-primary transition-smooth">
                  Programs
                </Link>
              </li>
              <li>
                <Link href="/oracle" className="text-muted-foreground hover:text-primary transition-smooth">
                  AI Oracle
                </Link>
              </li>
              <li>
                <Link href="/zen" className="text-muted-foreground hover:text-primary transition-smooth">
                  Zen Mode
                </Link>
              </li>
              <li>
                <Link href="/insights" className="text-muted-foreground hover:text-primary transition-smooth">
                  Insights
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-smooth" data-testid="link-privacy">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-primary transition-smooth" data-testid="link-terms">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-primary transition-smooth" data-testid="link-contact">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Account</h4>
            <ul className="space-y-2 text-sm">
              {isAuthenticated ? (
                <>
                  <li>
                    <Link href="/dashboard" className="text-muted-foreground hover:text-primary transition-smooth">
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link href="/billing" className="text-muted-foreground hover:text-primary transition-smooth">
                      Billing
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        localStorage.removeItem("auth_token");
                        window.location.href = "/";
                      }}
                      className="text-muted-foreground hover:text-primary transition-smooth"
                      data-testid="button-logout-footer"
                    >
                      Logout
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link href="/signin" className="text-muted-foreground hover:text-primary transition-smooth" data-testid="link-signin-footer">
                      Sign In
                    </Link>
                  </li>
                  <li>
                    <Link href="/signup" className="text-muted-foreground hover:text-primary transition-smooth" data-testid="link-signup-footer">
                      Sign Up
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} AuraVerse AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
