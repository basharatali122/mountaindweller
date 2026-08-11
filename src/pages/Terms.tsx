import { Layout } from "@/components/layout/Layout";
import { FadeIn } from "@/components/anim/Primitives";
import { PolicyPage } from "@/components/legal/PolicyPage";

const Terms = () => (
  <Layout>
    <PolicyPage
      title="Terms and Conditions"
      subtitle="The rules that apply when you use the Mountain Dweller website and services."
      updated="Last updated: 11 August 2026"
    >
      <FadeIn>
        <h2>1. Agreement</h2>
        <p>
          These Terms and Conditions govern your use of mountaindweller.online, operated by Mountain
          Dweller Traders, Kasur, Pakistan. By registering an account, placing an order or making a
          payment you accept these terms.
        </p>

        <h2>2. Eligibility &amp; account</h2>
        <ul>
          <li>You must be at least 18 years old and legally able to enter a contract.</li>
          <li>You must provide accurate registration and shipping details and keep them up to date.</li>
          <li>You are responsible for keeping your password confidential and for all activity on your account.</li>
          <li>One person may hold one account. Duplicate or fake accounts may be suspended.</li>
        </ul>

        <h2>3. Products &amp; pricing</h2>
        <p>
          All prices are shown in Pakistani Rupees (PKR) and include applicable taxes unless stated
          otherwise. We may change prices, packages or product availability at any time. If a product
          is unavailable after your order is placed, we will replace it with your consent or refund
          that portion.
        </p>

        <h2>4. Orders &amp; delivery</h2>
        <p>
          Orders are confirmed once payment is received and verified. Delivery is made to the address
          provided at checkout, normally within 3–7 working days within Pakistan through our courier
          partners. Delays caused by courier services, incorrect addresses or unavailability of the
          recipient are outside our control.
        </p>

        <h2>5. Payments</h2>
        <ul>
          <li>Payments may be made online through our authorised payment gateway or by bank transfer to the account shown in your dashboard.</li>
          <li>Bank-transfer deposits require a valid payment proof and are credited after manual verification.</li>
          <li>Submitting false, edited or duplicate payment proof is fraud and will result in permanent account termination.</li>
        </ul>

        <h2>6. Business opportunity, bonuses &amp; withdrawals</h2>
        <ul>
          <li>Participation in our referral and rank programme is voluntary. Earnings depend on genuine product sales and team activity — no income is guaranteed.</li>
          <li>Bonuses are calculated according to the published business plan, which we may update with notice.</li>
          <li>Withdrawals are processed to the bank or wallet account you provide, after verification, and may be held where fraud or chargeback risk is suspected.</li>
          <li>Self-referrals, fake orders, and manipulating the bonus system will result in forfeiture of earnings.</li>
        </ul>

        <h2>7. Acceptable use</h2>
        <p>
          You may not misuse the website, attempt to gain unauthorised access, upload malicious files,
          scrape data, misrepresent the company or its products, or make unauthorised medical,
          financial or income claims on our behalf.
        </p>

        <h2>8. Intellectual property</h2>
        <p>
          The Mountain Dweller name, logo, website content, product imagery and business material are
          our property and may not be copied or used commercially without written permission.
        </p>

        <h2>9. Limitation of liability</h2>
        <p>
          The website and services are provided on an "as is" basis. To the extent permitted by law,
          our total liability for any claim is limited to the amount you paid for the specific product
          or package giving rise to the claim.
        </p>

        <h2>10. Suspension &amp; termination</h2>
        <p>
          We may suspend or terminate accounts that breach these terms, engage in fraud, or harm other
          members. You may close your account at any time by contacting support.
        </p>

        <h2>11. Governing law</h2>
        <p>
          These terms are governed by the laws of the Islamic Republic of Pakistan, and disputes are
          subject to the jurisdiction of the courts of Kasur, Punjab.
        </p>

        <h2>12. Contact</h2>
        <p>
          Email: <a href="mailto:officialmountaidweller@gmail.com">officialmountaidweller@gmail.com</a><br />
          Phone: <a href="tel:03304260609">0330-4260609</a>
        </p>
      </FadeIn>
    </PolicyPage>
  </Layout>
);

export default Terms;
