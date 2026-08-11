import { Layout } from "@/components/layout/Layout";
import { FadeIn } from "@/components/anim/Primitives";
import { PolicyPage } from "@/components/legal/PolicyPage";

const Ownership = () => (
  <Layout>
    <PolicyPage
      title="Ownership Statement"
      subtitle="Who owns and operates this website and how to reach us."
      updated="Last updated: 11 August 2026"
    >
      <FadeIn>
        <h2>Website ownership</h2>
        <p>
          This website, <strong>mountaindweller.online</strong>, together with the Mountain Dweller
          brand, logo and all content published on it, is owned and operated by{" "}
          <strong>Mountain Dweller Traders</strong>, a direct-sales business based in Kasur, Punjab,
          Pakistan. Mountain Dweller Traders is solely responsible for the products sold, the payments
          collected and the customer service provided through this website.
        </p>

        <h2>Business details</h2>
        <ul>
          <li><strong>Business name:</strong> Mountain Dweller Traders</li>
          <li><strong>Trading name:</strong> Mountain Dweller</li>
          <li><strong>Nature of business:</strong> Retail and direct sales of skincare and personal-care products</li>
          <li><strong>Established:</strong> 4 May 2025</li>
          <li><strong>Registered address:</strong> Kasur, Punjab, Pakistan</li>
          <li><strong>Bank account title:</strong> MOUNTAIN DWELLER (Bank Alfalah, Kasur Branch)</li>
        </ul>

        <h2>Contact</h2>
        <ul>
          <li>Email: <a href="mailto:officialmountaidweller@gmail.com">officialmountaidweller@gmail.com</a></li>
          <li>Phone / WhatsApp: <a href="tel:03304260609">0330-4260609</a></li>
          <li>Support hours: Monday – Saturday, 10:00 – 18:00 (PKT)</li>
        </ul>

        <h2>Payments</h2>
        <p>
          All payments made on this website are collected by Mountain Dweller Traders. Card and wallet
          payments are handled by our authorised payment gateway partner, and bank transfers are
          received in the business bank account named above. Charges on your statement will appear in
          the name of Mountain Dweller.
        </p>

        <h2>Content ownership</h2>
        <p>
          All text, graphics, product photographs and business material on this website are the
          property of Mountain Dweller Traders unless otherwise credited, and may not be reproduced
          without written permission.
        </p>
      </FadeIn>
    </PolicyPage>
  </Layout>
);

export default Ownership;
