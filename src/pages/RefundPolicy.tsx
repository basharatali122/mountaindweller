import { Layout } from "@/components/layout/Layout";
import { FadeIn } from "@/components/anim/Primitives";
import { PolicyPage } from "@/components/legal/PolicyPage";

const RefundPolicy = () => (
  <Layout>
    <PolicyPage
      title="Cancellation, Return &amp; Refund Policy"
      subtitle="How to cancel an order, return a product and receive a refund."
      updated="Last updated: 11 August 2026"
    >
      <FadeIn>
        <h2>1. Order cancellation</h2>
        <ul>
          <li>You may cancel an order free of charge any time <strong>before it is dispatched</strong> by emailing or calling us with your order number.</li>
          <li>Once the parcel has been handed to the courier, cancellation is not possible — please use the return process below.</li>
          <li>We may cancel an order if the product is out of stock, the payment could not be verified, or the delivery address is invalid. In such cases the full amount is refunded.</li>
        </ul>

        <h2>2. Returns</h2>
        <p>You may request a return within <strong>7 days of delivery</strong> if:</p>
        <ul>
          <li>the product is damaged, leaking or broken on arrival;</li>
          <li>you received the wrong item or an incomplete order; or</li>
          <li>the product is expired or the seal is missing.</li>
        </ul>
        <p>
          To be eligible, the item must be unused and returned in its original packaging with the
          invoice. Please contact us <strong>within 48 hours</strong> for damaged or wrong items and
          include clear photographs of the parcel and product.
        </p>

        <h2>3. Non-returnable items</h2>
        <ul>
          <li>Opened or partially used skincare and personal-care products (for hygiene and safety reasons).</li>
          <li>Products damaged by misuse, incorrect storage or after the return window has closed.</li>
          <li>Free gifts and promotional items.</li>
        </ul>

        <h2>4. Refunds</h2>
        <ul>
          <li>Approved refunds are issued to the original payment method — online card/wallet payments are refunded through the payment gateway, and bank-transfer payments are refunded to your bank account.</li>
          <li>Refunds are processed within <strong>7–10 working days</strong> after we receive and inspect the returned item.</li>
          <li>Alternatively, you may choose a free replacement or wallet credit of the same value.</li>
          <li>Delivery charges are refunded only where the return is caused by our error (damaged, wrong or missing item).</li>
        </ul>

        <h2>5. Return shipping</h2>
        <p>
          If the return is due to our error, we arrange and pay for the return pickup. For
          change-of-mind returns (where accepted), the customer pays the return shipping cost.
        </p>

        <h2>6. Business packages &amp; wallet deposits</h2>
        <p>
          Business packages that have already been activated and from which bonuses or product value
          have been consumed are non-refundable. Unused wallet deposits may be refunded on request,
          minus any payment gateway or transfer charges, after identity verification.
        </p>

        <h2>7. How to request a cancellation or refund</h2>
        <p>
          Email <a href="mailto:officialmountaidweller@gmail.com">officialmountaidweller@gmail.com</a>{" "}
          or call <a href="tel:03304260609">0330-4260609</a> with your order number, registered phone
          number and photographs (if applicable). Our team replies within 2 working days.
        </p>
      </FadeIn>
    </PolicyPage>
  </Layout>
);

export default RefundPolicy;
