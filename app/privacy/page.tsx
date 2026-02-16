import Link from "next/link";
import { VamoLogo } from "@/components/VamoLogo";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background safe-top safe-bottom">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/95 backdrop-blur-md safe-top">
        <div className="container flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
          <VamoLogo href="/" />
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to home
          </Link>
        </div>
      </header>
      <main className="container max-w-3xl py-8 sm:py-12 px-4 sm:px-6 safe-bottom">
        <div className="bg-background rounded-2xl border border-border shadow-sm p-6 sm:p-8 md:p-10">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground text-sm mb-8">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

          <div className="prose prose-sm sm:prose-base max-w-none text-foreground space-y-6">
            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                Vamo ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service. Please read this policy carefully to understand our practices regarding your data.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">2. Information We Collect</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">We collect information that you provide directly to us, including:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li><strong>Account Information:</strong> Email address, name, and authentication credentials when you create an account</li>
                <li><strong>Profile Information:</strong> Optional profile details such as full name and linked social accounts</li>
                <li><strong>Project Data:</strong> Project descriptions, progress logs, URLs, screenshots, and other content you submit</li>
                <li><strong>Activity Data:</strong> Information about your interactions with the Service, including chat messages and activity events</li>
                <li><strong>Marketplace Listings:</strong> Project listings, pricing information, and transaction-related data</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                We also automatically collect certain information when you use the Service, such as IP address, browser type, device information, and usage patterns.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">3. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">We use the information we collect to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Provide, maintain, and improve the Service</li>
                <li>Process transactions and manage your account</li>
                <li>Calculate and award pineapples based on your progress</li>
                <li>Facilitate marketplace transactions</li>
                <li>Send you service-related communications</li>
                <li>Respond to your inquiries and provide customer support</li>
                <li>Detect, prevent, and address technical issues and security threats</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">4. Information Sharing and Disclosure</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">We do not sell your personal information. We may share your information in the following circumstances:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li><strong>Public Content:</strong> Project information, marketplace listings, and public profile data may be visible to other users</li>
                <li><strong>Service Providers:</strong> We may share data with third-party service providers who assist in operating the Service (e.g., hosting, analytics)</li>
                <li><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights and safety</li>
                <li><strong>Business Transfers:</strong> Information may be transferred in connection with a merger, acquisition, or sale of assets</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">5. Data Storage and Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use industry-standard security measures to protect your information, including encryption, secure authentication, and regular security assessments. However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Your data is stored on secure servers and databases. We retain your information for as long as your account is active or as needed to provide the Service and comply with legal obligations.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">6. Third-Party Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Service may integrate with third-party services (e.g., authentication providers, analytics tools). These services have their own privacy policies, and we encourage you to review them. We are not responsible for the privacy practices of third-party services.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">7. Your Rights and Choices</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">You have the right to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Access and update your account information</li>
                <li>Delete your account and associated data</li>
                <li>Opt out of certain communications</li>
                <li>Request a copy of your personal data</li>
                <li>Object to or restrict certain processing activities</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                To exercise these rights, please contact us through the Service or use the account settings available in your profile.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">8. Cookies and Tracking Technologies</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and improve the Service. You can control cookie preferences through your browser settings, though disabling cookies may affect Service functionality.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">9. Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Service is not intended for individuals under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected information from a child under 13, we will take steps to delete such information promptly.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">10. International Data Transfers</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that differ from those in your country. By using the Service, you consent to the transfer of your information to these countries.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">11. Changes to This Privacy Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date. Your continued use of the Service after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">12. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us through the Service or using the contact information provided in your account settings.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
