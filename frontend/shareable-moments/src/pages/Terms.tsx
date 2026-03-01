import { Link } from "react-router-dom";

const Terms = () => (
  <div className="min-h-screen bg-background">
    <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="font-display text-xl font-bold">Shyara</Link>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground font-body">
          {"<-"} Home
        </Link>
      </div>
    </nav>

    <div className="container max-w-3xl py-16 px-4 font-body">
      <h1 className="font-display text-4xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-10">Last updated: February 2026</p>

      <div className="space-y-8 text-foreground">
        <section>
          <h2 className="font-display text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            By accessing or using Shyara, you agree to be bound by these Terms of Service.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold mb-3">2. Services</h2>
          <p className="text-muted-foreground leading-relaxed">
            Shyara provides a digital invitation creation and management platform for personal and professional events.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold mb-3">3. Account Registration</h2>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
            <li>You must provide accurate and complete information when creating an account.</li>
            <li>You are responsible for keeping your credentials secure.</li>
            <li>You must be at least 18 years old or have parental consent.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold mb-3">4. Payments and Refunds</h2>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
            <li>All prices are in USD or EUR and include applicable taxes where required.</li>
            <li>Template purchases are processed securely through Stripe.</li>
            <li>Each purchase grants a perpetual, non-transferable license for one invite.</li>
            <li>Refunds may be requested within 7 days if the invite has not been published.</li>
            <li>No refunds are issued for published invitations.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold mb-3">5. Acceptable Use</h2>
          <p className="text-muted-foreground leading-relaxed mb-2">You agree not to use Shyara to:</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
            <li>Upload or share illegal, harmful, or infringing content.</li>
            <li>Impersonate another person or entity.</li>
            <li>Attempt unauthorized access to the platform or other accounts.</li>
          </ul>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t border-border flex gap-6 text-sm font-body">
        <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
        <Link to="/" className="text-muted-foreground hover:text-foreground">{"<-"} Back to Home</Link>
      </div>
    </div>
  </div>
);

export default Terms;
