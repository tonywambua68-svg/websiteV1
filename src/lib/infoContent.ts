export interface InfoArticle {
  title: string
  draft?: boolean
  intro: string
  sections: Array<{ h: string; p: string }>
}

// Draft policies are NOT published promises. They require owner approval before going live.
export const INFO_ARTICLES: Record<string, InfoArticle> = {
  'how-to-order': {
    title: 'How to Order',
    intro: 'Ordering from OREMITECH is designed to be simple and transparent.',
    sections: [
      { h: '1. Find your product', p: 'Use search or category navigation, apply filters, and open the product page to review full specifications.' },
      { h: '2. Add to cart', p: 'Add the item to your cart, adjust quantities, and review the order summary.' },
      { h: '3. Checkout', p: 'Enter your delivery details and choose an available payment method. Any coupon is applied at checkout.' },
      { h: '4. Confirmation & tracking', p: 'After the order is confirmed you receive an order number and can follow progress on the order tracking page.' },
    ],
  },
  help: {
    title: 'Help Centre',
    intro: 'Find quick answers and support for shopping on OREMITECH.',
    sections: [
      { h: 'Orders', p: 'Track an order with your order number and phone on the order tracking page, or view history in My Account.' },
      { h: 'Delivery', p: 'Delivery options and any applicable charges are shown at checkout for your location.' },
      { h: 'Returns & warranty', p: 'See the Returns and Refunds and Warranty pages for the applicable process.' },
      { h: 'Still need help?', p: 'Contact us with your order number and we will assist. Use the Contact page for phone, email and WhatsApp.' },
    ],
  },
  delivery: {
    title: 'Delivery Information',
    draft: true,
    intro: 'This is a draft policy. Delivery areas, timelines and fees must be confirmed by OREMITECH before publishing.',
    sections: [
      { h: 'Delivery options', p: 'DRAFT — exact delivery zones and timelines require owner approval.' },
      { h: 'Charges', p: 'DRAFT — any delivery fees are configured per zone and shown at checkout once confirmed.' },
      { h: 'Tracking', p: 'Customers can follow order status using their order number and phone number.' },
    ],
  },
  returns: {
    title: 'Returns and Refunds Policy',
    draft: true,
    intro: 'This is a draft policy. The return window and conditions require owner approval and must not be treated as a promise.',
    sections: [
      { h: 'Eligibility', p: 'DRAFT — return window and eligible conditions require owner approval.' },
      { h: 'How to request', p: 'Contact support with your order number to open a return request.' },
      { h: 'Refunds', p: 'DRAFT — refund method and timing require owner approval.' },
    ],
  },
  warranty: {
    title: 'Warranty Policy',
    draft: true,
    intro: 'This is a draft policy. Warranty terms depend on the manufacturer and supplier and require owner approval.',
    sections: [
      { h: 'Coverage', p: 'DRAFT — warranty coverage and duration require owner approval and vary by product.' },
      { h: 'Making a claim', p: 'Contact support with your order number and product details.' },
    ],
  },
  payment: {
    title: 'Payment Information',
    draft: true,
    intro: 'This is a draft policy. Only confirmed, working payment methods should be listed here.',
    sections: [
      { h: 'Available methods', p: 'DRAFT — confirmed payment methods require owner approval and live integration.' },
      { h: 'Security', p: 'Payment references are verified by OREMITECH before an order is marked paid.' },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    draft: true,
    intro: 'This is a draft policy. Final privacy wording requires owner/legal approval.',
    sections: [
      { h: 'Information we collect', p: 'DRAFT — account details, order details and support messages, as approved by the owner.' },
      { h: 'How it is used', p: 'DRAFT — to process orders, provide support and improve the store, subject to approval.' },
      { h: 'Your choices', p: 'DRAFT — access and deletion request process requires owner approval.' },
    ],
  },
  terms: {
    title: 'Terms and Conditions',
    draft: true,
    intro: 'This is a draft policy. Final terms require owner/legal approval.',
    sections: [
      { h: 'Using the store', p: 'DRAFT — terms of use require owner approval.' },
      { h: 'Orders and pricing', p: 'All prices are in Kenyan Shillings. Orders are subject to stock and server-side validation.' },
      { h: 'Liability', p: 'DRAFT — liability and governing terms require owner approval.' },
    ],
  },
  cookies: {
    title: 'Cookie Policy',
    draft: true,
    intro: 'This is a draft policy. Final cookie wording requires owner approval.',
    sections: [
      { h: 'What we use', p: 'DRAFT — essential storage for cart and session, plus any analytics, subject to approval.' },
      { h: 'Managing cookies', p: 'DRAFT — control instructions require owner approval.' },
    ],
  },
};