import { Link } from 'react-router-dom';

const Privacy = () => (
  <div className="min-h-screen bg-background">
    <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="font-display text-xl font-bold">Shyara</Link>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground font-body">← Home</Link>
      </div>
    </nav>

    <div className="container max-w-3xl py-16 px-4 font-body">
      <h1 className="font-display text-4xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-10">Last updated: February 2026</p>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-foreground">

        <section>
          <h2 className="font-display text-xl font-semibold mb-3">1. Who We Are</h2>
          <p className="text-muted-foreground leading-relaxed">
            Shyara ("we", "us", "our") operates invite.shyara.co.in, a digital invitation platform. This Privacy Policy
            explains how we collect, use, and protect your personal information when you use our services.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold mb-3">2. Information We Collect</h2>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
            <li><strong className="text-foreground">Account information:</strong> Name, email address, phone number, and password (stored as a one-way hash).</li>
            <li><strong className="text-foreground">Invite content:</strong> Event details, photos, and other data you enter when creating an invitation.</li>
            <li><strong className="text-foreground">RSVP data:</strong> Guest names, email addresses, responses, and guest counts submitted to your invitations.</li>
            <li><strong className="text-foreground">Payment information:</strong> Transaction IDs and payment status via Stripe. We never store full card details on our servers.</li>
            <li><strong className="text-foreground">Usage data:</strong> Page views, invite view counts, IP addresses, and browser information for security and analytics.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold mb-3">3. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
            <li>To provide and improve our invitation creation and RSVP services.</li>
            <li>To send transactional emails: welcome, RSVP notifications, password resets, and invite-published confirmations.</li>
            <li>To process payments and maintain transaction records.</li>
            <li>To prevent fraud, abuse, and unauthorised access.</li>
            <li>To send promotional emails — only with your consent and only if you have not unsubscribed.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold mb-3">4. Cookies</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use a strictly necessary session cookie (<code className="bg-muted px-1 rounded text-sm">refreshToken</code>) to keep you signed in securely.
            We also use local storage to maintain your session. We do not use tracking or advertising cookies.
            You can clear cookies at any time through your browser settings, which will sign you out.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold mb-3">5. Data Sharing</h2>
          <p className="text-muted-foreground leading-relaxed">
            We do not sell your personal data. We share data only with:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed mt-2">
            <li><strong className="text-foreground">Stripe</strong> — for payment processing (governed by Stripe's privacy policy).</li>
            <li><strong className="text-foreground">Resend</strong> — for transactional email delivery.</li>
            <li><strong className="text-foreground">Cloudinary</strong> — for image storage and delivery.</li>
            <li>Law enforcement or regulatory authorities where required by applicable law.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold mb-3">6. Data Retention</h2>
          <p className="text-muted-foreground leading-relaxed">
            Your account data is retained for as long as your account is active. You can delete your account at any
            time from Account Settings, which permanently removes all your invites, RSVPs, and personal data from our systems.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold mb-3">7. Security</h2>
          <p className="text-muted-foreground leading-relaxed">
            Passwords are hashed using bcrypt. Access tokens are short-lived (15 minutes). Refresh tokens are stored
            as cryptographic hashes. All connections use HTTPS. Payment data is handled exclusively by PCI-DSS
            compliant Stripe.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold mb-3">8. Your Rights</h2>
          <p className="text-muted-foreground leading-relaxed">
            You have the right to access, correct, or delete your personal data. You can manage most settings
            directly in your account. To exercise other rights or for any privacy queries, contact us at{' '}
            <a href="mailto:support@invitesbyshyara.com" className="text-primary hover:underline">support@invitesbyshyara.com</a>.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold mb-3">9. Changes to This Policy</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update this policy from time to time. Significant changes will be communicated by email or via
            a notice on our platform. Continued use of the service after such notice constitutes acceptance.
          </p>
        </section>

      </div>

      <div className="mt-12 pt-8 border-t border-border flex gap-6 text-sm font-body">
        <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
        <Link to="/" className="text-muted-foreground hover:text-foreground">← Back to Home</Link>
      </div>
    </div>
  </div>
);

export default Privacy;

