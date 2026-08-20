import { Layout } from "@/components/layout/Layout";
import { FadeIn } from "@/components/anim/Primitives";
import { PolicyPage } from "@/components/legal/PolicyPage";

const PrivacyPolicy = () => (
  <Layout>
    <PolicyPage
      title="Privacy Policy"
      subtitle="How MOUNTAINDWELLER (PRIVATE) LIMITED collects, uses and protects your information."
      updated="Last updated: 11 August 2026"
    >
      <FadeIn>
        <h2>1. Introduction</h2>
        <p>
          This Privacy Policy explains how MOUNTAINDWELLER (PRIVATE) LIMITED ("Mountain Dweller", "we", "us")
          collects, uses, stores and protects information when you use our website
          (mountaindweller.online) and our services. By using the website you agree to this policy.
        </p>

        <h2>2. Information we collect</h2>
        <ul>
          <li><strong>Account information:</strong> name, email address, phone number, city and password (stored encrypted).</li>
          <li><strong>Order &amp; shipment information:</strong> delivery address, contact number and order contents.</li>
          <li><strong>Payment information:</strong> deposit amount, transaction reference and payment proof screenshots. Card and bank credentials are entered directly on our payment processor's secure page and are never stored by us.</li>
          <li><strong>Business information:</strong> referral code, team activity and earnings records needed to operate our compensation plan.</li>
          <li><strong>Technical information:</strong> device type, browser and basic usage logs used to keep the service secure and reliable.</li>
        </ul>

        <h2>3. How we use your information</h2>
        <ul>
          <li>To create and manage your account and verify your identity.</li>
          <li>To process payments, deposits, withdrawals and orders.</li>
          <li>To ship products to the address you provide.</li>
          <li>To calculate referral bonuses, ranks and payouts.</li>
          <li>To respond to support requests submitted through our contact form.</li>
          <li>To prevent fraud, abuse and unauthorised access, and to comply with the law.</li>
        </ul>

        <h2>4. Payment processing</h2>
        <p>
          Online card and wallet payments are processed by our authorised payment gateway partner.
          When you pay online you are redirected to the gateway's secure hosted checkout. We receive
          only the transaction status, reference and amount — we do not receive or store your full
          card number, CVV or banking password.
        </p>

        <h2>5. Sharing of information</h2>
        <p>
          We do not sell or rent your personal data. We share information only with: our payment
          gateway and banking partners (to process payments), courier partners (to deliver your
          order), our hosting and database providers (to run the service), and regulators or law
          enforcement where legally required.
        </p>

        <h2>6. Data retention &amp; security</h2>
        <p>
          Data is stored on secured, access-controlled infrastructure with row-level access rules so
          that users can only read their own records. Transaction and order records are retained as
          long as required for accounting, tax and dispute-resolution purposes.
        </p>

        <h2>7. Your rights</h2>
        <p>
          You may request access to, correction of, or deletion of your personal data by emailing us.
          Deleting your account removes your profile, orders and wallet history, subject to records we
          must keep by law.
        </p>

        <h2>8. Cookies</h2>
        <p>
          We use essential cookies and local storage to keep you signed in and remember your theme and
          cart preferences. We do not use them to build advertising profiles.
        </p>

        <h2>9. Children</h2>
        <p>Our services are intended for users aged 18 and above.</p>

        <h2>10. Contact us</h2>
        <p>
          MOUNTAINDWELLER (PRIVATE) LIMITED, Kasur, Punjab, Pakistan<br />
          Email: <a href="mailto:officialmountaidweller@gmail.com">officialmountaidweller@gmail.com</a><br />
          Phone: <a href="tel:03304260609">0330-4260609</a>
        </p>
      </FadeIn>
    </PolicyPage>
  </Layout>
);

export default PrivacyPolicy;
