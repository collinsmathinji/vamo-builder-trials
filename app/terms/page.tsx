import Link from "next/link";
import { VamoLogo } from "@/components/VamoLogo";

export default function TermsPage() {
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
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-2">Terms of Service</h1>
          <p className="text-muted-foreground text-sm mb-8">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

          <div className="prose prose-sm sm:prose-base max-w-none text-foreground space-y-6">
            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using Vamo ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">2. Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed">
                Vamo is a platform designed for solo founders to build, track progress, and earn rewards for their projects. The Service allows users to describe projects, log progress, earn pineapples (virtual rewards), and redeem rewards. Vamo also provides a marketplace where users can list projects for sale.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">3. User Accounts</h2>
              <p className="text-muted-foreground leading-relaxed">
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account. We reserve the right to suspend or terminate accounts that violate these terms.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">4. User Content</h2>
              <p className="text-muted-foreground leading-relaxed">
                You retain ownership of any content you submit to the Service. By submitting content, you grant Vamo a worldwide, non-exclusive, royalty-free license to use, display, and distribute your content solely for the purpose of operating and providing the Service. You are responsible for ensuring you have the right to submit any content you provide.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">5. Pineapples and Rewards</h2>
              <p className="text-muted-foreground leading-relaxed">
                Pineapples are virtual rewards earned through logging progress on your projects. Pineapples have no monetary value and cannot be exchanged for cash. Rewards available for redemption are subject to change and availability. Vamo reserves the right to modify, suspend, or discontinue the rewards program at any time.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">6. Marketplace</h2>
              <p className="text-muted-foreground leading-relaxed">
                The marketplace feature allows users to list projects for sale. Vamo acts as a platform facilitator and is not a party to any transactions between buyers and sellers. We do not guarantee the accuracy of listings or the completion of transactions. Users are solely responsible for their marketplace interactions.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">7. Prohibited Uses</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">You agree not to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Use the Service for any illegal purpose or in violation of any laws</li>
                <li>Impersonate any person or entity or misrepresent your affiliation</li>
                <li>Upload malicious code, viruses, or harmful content</li>
                <li>Attempt to gain unauthorized access to the Service or other accounts</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Use automated systems to access the Service without permission</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">8. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Service, including its original content, features, and functionality, is owned by Vamo and is protected by international copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">9. Disclaimer of Warranties</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Service is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not warrant that the Service will be uninterrupted, secure, or error-free, or that defects will be corrected.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">10. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                To the fullest extent permitted by law, Vamo shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the Service.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">11. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these terms at any time. We will notify users of any material changes by posting the new Terms of Service on this page and updating the "Last updated" date. Your continued use of the Service after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">12. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may terminate or suspend your account and access to the Service immediately, without prior notice, for any reason, including breach of these Terms. Upon termination, your right to use the Service will cease immediately.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground mt-8 mb-3">13. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about these Terms of Service, please contact us through the Service or at the contact information provided in our Privacy Policy.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
