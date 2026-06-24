// Ready-to-use email templates. {{placeholders}} are filled at preview/export time.
// Each: id, name, category hint, subject, body (plain text with merge fields).
export const TEMPLATES = [
  {
    id: "new-arrivals",
    name: "New Arrivals Announcement",
    purpose: "Promote new stock to engaged customers",
    subject: "🐠 Fresh arrivals just landed at {{company_name}}",
    body: `Hi {{first_name}},

Exciting news — we've just restocked our {{category}} range with some stunning new additions.

As one of our valued customers, you get first look before we post to the public. Pop in or reply to reserve yours before they're gone.

{{cta}}

Warm regards,
The {{company_name}} Team`,
  },
  {
    id: "category-promo",
    name: "Category Promotion / Offer",
    purpose: "Drive sales in a specific category",
    subject: "A little something for your {{category}} setup, {{first_name}}",
    body: `Hi {{first_name}},

We noticed you love great {{category}} — and this week we've put together an offer just for customers like you.

{{offer}}

Visit us or reply to this email and we'll get everything ready for you.

See you soon,
The {{company_name}} Team`,
  },
  {
    id: "maintenance-service",
    name: "Aquarium Maintenance Service",
    purpose: "Pitch recurring maintenance to tank/equipment owners",
    subject: "Let us keep your aquarium pristine, {{first_name}}",
    body: `Hi {{first_name}},

A beautiful aquarium deserves expert care. Our aquarium maintenance service handles water changes, filter servicing, algae control, and health checks — so you can simply enjoy the view.

We offer one-off visits and discounted monthly plans, tailored to your tank.

{{cta}}

Talk soon,
The {{company_name}} Team`,
  },
  {
    id: "win-back",
    name: "Win-Back / We Miss You",
    purpose: "Re-engage lapsed customers",
    subject: "We've missed you, {{first_name}} 🐟",
    body: `Hi {{first_name}},

It's been a while! Your aquarium hobby is always evolving, and we've added plenty of new products and livestock since your last visit.

To welcome you back, here's a little something:

{{offer}}

We'd love to see you again.

Warmly,
The {{company_name}} Team`,
  },
  {
    id: "vip-exclusive",
    name: "VIP Exclusive Offer",
    purpose: "Reward top customers with early/exclusive access",
    subject: "An exclusive thank-you for our best customers",
    body: `Hi {{first_name}},

You're one of our most valued customers, and we wanted to say thank you with something special — reserved only for our VIPs.

{{offer}}

This offer is just for you and won't be advertised publicly. Reply anytime and we'll take care of the rest.

With appreciation,
The {{company_name}} Team`,
  },
  {
    id: "care-tips",
    name: "Care Tips / Value Newsletter",
    purpose: "Nurture relationship, build trust (non-salesy)",
    subject: "{{first_name}}, 3 quick tips for a healthier aquarium",
    body: `Hi {{first_name}},

A few simple habits make a big difference to a thriving tank:

1. Test your water weekly — stability beats perfection.
2. Feed small amounts; uneaten food fouls water fast.
3. Change 20–30% of water regularly to keep parameters steady.

Need supplies or a hand? We're always here.

Happy fishkeeping,
The {{company_name}} Team`,
  },
  {
    id: "seasonal",
    name: "Seasonal / Event Campaign",
    purpose: "Tie a promotion to a season or holiday",
    subject: "Make a splash this season, {{first_name}}",
    body: `Hi {{first_name}},

The season's here and it's the perfect time to refresh your aquascape. We've lined up seasonal favourites across our {{category}} range.

{{offer}}

Come find inspiration in-store or reply and we'll help you plan.

Cheers,
The {{company_name}} Team`,
  },
];

export const TONES = ["Friendly & warm", "Professional & concise", "Playful & fun", "Premium & exclusive", "Urgent (limited offer)"];

// On-brand SVG email banner (no AI needed). Returns an SVG string.
export function bannerSVG({ company = "AquaGallery", headline = "New Arrivals", sub = "", accent = "#ec4899", accent2 = "#f43f5e" }) {
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const bubbles = Array.from({ length: 14 }, (_, i) => {
    const x = (i * 73) % 600 + 20, y = (i * 47) % 180 + 10, r = 3 + ((i * 7) % 10);
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffffff" opacity="${0.06 + (i % 4) * 0.04}"/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="200" viewBox="0 0 600 200">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${accent}"/>
      <stop offset="100%" stop-color="${accent2}"/>
    </linearGradient>
  </defs>
  <rect width="600" height="200" fill="url(#g)"/>
  ${bubbles}
  <path d="M0 165 Q150 135 300 160 T600 150 V200 H0 Z" fill="#ffffff" opacity="0.12"/>
  <text x="40" y="70" font-family="Georgia, serif" font-size="16" fill="#ffffff" opacity="0.85" letter-spacing="3">${esc(company.toUpperCase())}</text>
  <text x="40" y="120" font-family="Segoe UI, Arial, sans-serif" font-size="40" font-weight="700" fill="#ffffff">${esc(headline)}</text>
  ${sub ? `<text x="40" y="152" font-family="Segoe UI, Arial, sans-serif" font-size="16" fill="#ffffff" opacity="0.9">${esc(sub)}</text>` : ""}
</svg>`;
}

export const BANNER_THEMES = [
  { name: "Blossom", accent: "#ec4899", accent2: "#f43f5e" },
  { name: "Rosé", accent: "#f43f5e", accent2: "#be123c" },
  { name: "Ocean", accent: "#0ea5e9", accent2: "#6366f1" },
  { name: "Reef", accent: "#06b6d4", accent2: "#10b981" },
  { name: "Sunset", accent: "#f59e0b", accent2: "#ef4444" },
  { name: "Deep", accent: "#1e3a8a", accent2: "#0ea5e9" },
  { name: "Planted", accent: "#10b981", accent2: "#84cc16" },
];
