/* ============================================================================
   STORE POLICIES — EDIT THESE TEXTS
   ----------------------------------------------------------------------------
   Replace every "[...]" placeholder with your real policy wording before
   going live. These pages render at /policy/delivery, /policy/returns,
   /policy/privacy and /policy/terms.
   ========================================================================== */

export interface PolicySection { h: string; body: string }
export interface Policy { slug: string; title: string; updated: string; intro: string; sections: PolicySection[] }

export const POLICIES: Policy[] = [
  {
    slug: "delivery",
    title: "Delivery Policy",
    updated: "Last updated: [DATE]",
    intro: "We are an online store — every order is delivered to your door or a courier point of your choice. Here is how it works.",
    sections: [
      { h: "Where we deliver", body: "[Describe the areas you deliver to, e.g. “All 47 counties in Kenya via trusted couriers. Same-day delivery is available within Nairobi for orders placed before [TIME].”]" },
      { h: "Delivery fees & timelines", body: "[List your fees and timelines, e.g. “Nairobi same-day: KSh [AMOUNT]. Nationwide standard: KSh [AMOUNT], 1–3 working days. Orders above KSh [AMOUNT] qualify for free delivery.”]" },
      { h: "How your order is confirmed", body: "After you place an order and pay via M-PESA PayBill, send your M-PESA confirmation message to us on WhatsApp. We verify the payment, confirm your order, and share dispatch updates with you." },
      { h: "Receiving your order", body: "[Explain what the customer should do on delivery, e.g. “Inspect the seal before accepting. The courier will call the phone number you provided at checkout.”]" },
    ],
  },
  {
    slug: "returns",
    title: "Returns & Refunds Policy",
    updated: "Last updated: [DATE]",
    intro: "Clear, honest returns. If something is wrong, we make it right.",
    sections: [
      { h: "Return window", body: "[State your window, e.g. “Sealed products can be returned within [X] days of delivery. Opened items qualify if they are faulty.”]" },
      { h: "What qualifies", body: "[Describe conditions, e.g. “Manufacturing defects, wrong item delivered, or damage in transit. Items must be returned with all accessories and packaging.”]" },
      { h: "How to start a return", body: "Message us on WhatsApp with your order reference and a short description (photos help). We will arrange courier pickup and guide you through the process." },
      { h: "Refunds", body: "[Explain refund method and timing, e.g. “Approved refunds are sent to your M-PESA number within [X] hours.”]" },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    updated: "Last updated: [DATE]",
    intro: "We only collect what we need to deliver your order and support you.",
    sections: [
      { h: "What we collect", body: "[List the data you collect, e.g. “Name, phone number, delivery address and order history — nothing more.”]" },
      { h: "How we use it", body: "[Explain usage, e.g. “To process and deliver orders, verify M-PESA payments, and respond to support messages on WhatsApp.”]" },
      { h: "What we never do", body: "[State your commitments, e.g. “We never sell your data. We never store your M-PESA PIN — payments are handled entirely on your phone by Safaricom.”]" },
      { h: "Your rights", body: "[Explain how customers can request their data or ask for deletion, with your contact details.]" },
    ],
  },
  {
    slug: "terms",
    title: "Terms & Conditions",
    updated: "Last updated: [DATE]",
    intro: "The short, plain-language agreement between you and us.",
    sections: [
      { h: "Ordering & payment", body: "[Explain your process, e.g. “Orders are confirmed after M-PESA PayBill payment is verified on WhatsApp. Prices are in Kenya Shillings and include VAT.”]" },
      { h: "Product information", body: "[State your commitment, e.g. “Specifications are published exactly as supplied by authorised distributors. If a spec changes before dispatch, we contact you first.”]" },
      { h: "Warranty", body: "[Describe warranty handling, e.g. “Each product carries the manufacturer warranty shown on its page. Warranty support is coordinated via WhatsApp.”]" },
      { h: "Contact", body: "[Add your WhatsApp number and email so customers can reach you about these terms.]" },
    ],
  },
];

export const policyBySlug = (slug: string) => POLICIES.find((p) => p.slug === slug);
