import { Layout } from "@/components/layout/Layout";
import { FadeIn } from "@/components/anim/Primitives";
import { PolicyPage } from "@/components/legal/PolicyPage";

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "MOUNTAINDWELLER (PRIVATE) LIMITED",
  alternateName: "Mountain Dweller",
  legalName: "MOUNTAINDWELLER (PRIVATE) LIMITED",
  url: "https://mountaindweller.online",
  foundingDate: "2026-07-17",
  taxID: "J466026",
  identifier: {
    "@type": "PropertyValue",
    name: "SECP Corporate Unique Identification No.",
    value: "0346050",
  },
  address: {
    "@type": "PostalAddress",
    streetAddress: "House No. 25, Street 11, Noor Shah Wali Road",
    addressLocality: "Kasur",
    addressRegion: "Punjab",
    addressCountry: "PK",
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+92-330-4260609",
    email: "officialmountaidweller@gmail.com",
    contactType: "customer support",
  },
  sameAs: "https://leap.secp.gov.pk/#/verify-company-info/0346050",
};

const Ownership = () => (
  <Layout>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
    <PolicyPage
      title="Ownership & Company Registration"
      subtitle="MOUNTAINDWELLER (PRIVATE) LIMITED — a company registered with the SECP and FBR in Pakistan."
      updated="Last updated: 20 August 2026"
    >
      <FadeIn>
        <h2>Website ownership</h2>
        <p>
          This website, <strong>mountaindweller.online</strong>, together with the Mountain Dweller
          brand, logo and all content published on it, is owned and operated by{" "}
          <strong>MOUNTAINDWELLER (PRIVATE) LIMITED</strong> — a private limited company
          incorporated under the Companies Act, 2017 and registered with the{" "}
          <strong>Securities and Exchange Commission of Pakistan (SECP)</strong>, based in Kasur,
          Punjab, Pakistan. The company is solely responsible for the products sold, the payments
          collected and the customer service provided through this website.
        </p>

        <h2>Registration &amp; legal status</h2>
        <ul>
          <li><strong>Registered company name:</strong> MOUNTAINDWELLER (PRIVATE) LIMITED</li>
          <li><strong>Legal status:</strong> Private limited company, limited by shares</li>
          <li><strong>SECP Corporate Unique Identification No. (Incorporation No.):</strong> 0346050</li>
          <li><strong>Date of incorporation:</strong> 17 July 2026 (SECP, Islamabad)</li>
          <li><strong>FBR National Tax Number (NTN) / Registration No.:</strong> J466026</li>
          <li><strong>FBR date of registration:</strong> 17 July 2026 — Type of person: Company</li>
          <li><strong>Tax office:</strong> CTO Lahore</li>
          <li>
            <strong>Verify our registration:</strong>{" "}
            <a href="https://leap.secp.gov.pk/#/verify-company-info/0346050" target="_blank" rel="noopener noreferrer">
              SECP company verification (UIN 0346050)
            </a>
          </li>
        </ul>

        <h2>Business details</h2>
        <ul>
          <li><strong>Trading name:</strong> Mountain Dweller</li>
          <li><strong>Nature of business:</strong> Retail and direct sales of skincare and personal-care products</li>
          <li><strong>Registered address:</strong> House No. 25, Street 11, Noor Shah Wali Road, Kasur, Punjab, Pakistan</li>
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
          property of MOUNTAINDWELLER (PRIVATE) LIMITED unless otherwise credited, and may not be
          reproduced without written permission.
        </p>
      </FadeIn>
    </PolicyPage>
  </Layout>
);

export default Ownership;
