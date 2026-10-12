import { Link, useLocation } from "react-router-dom";

// Update when the Terms/Privacy text changes materially, and bump
// TERMS_VERSION in backend/src/config/legal.js to the same date so existing
// users are asked to accept again.
export const TERMS_VERSION = "2026-10-12";

// Fill these in before launch — they appear in the legal text.
const CONTACT_EMAIL = "support@jamminspot.app";
const OPERATOR = "Jamminspot";

function Section({ title, children }) {
  return (
    <section className="mb-6">
      <h2 className="text-base font-bold mb-2">{title}</h2>
      <div className="space-y-2 text-sm text-[var(--jm-text-dim)] leading-relaxed">{children}</div>
    </section>
  );
}

function Bullets({ items }) {
  return (
    <ul className="list-disc pl-5 space-y-1">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  );
}

function Terms() {
  return (
    <>
      <Section title="1. Who we are and what this is">
        <p>
          These Terms of Service ("Terms") govern your use of {OPERATOR} — a platform where
          musicians discover each other, form Jams (mutual connections), share music, message,
          and buy or sell music gear and services in the Market. By creating an account or using
          the service you agree to these Terms and to our Privacy Policy and Community
          Guidelines.
        </p>
      </Section>

      <Section title="2. Eligibility">
        <p>
          You must be at least 18 years old and legally able to enter into a contract. You may
          not use {OPERATOR} if you have been banned from it, or if the law of your country
          forbids it. By registering you confirm that you meet these requirements.
        </p>
      </Section>

      <Section title="3. Your account">
        <Bullets
          items={[
            "Give accurate information and keep it up to date. One person, one account.",
            "Keep your password secret. You are responsible for activity on your account.",
            "Tell us immediately if you think your account was accessed without permission.",
            "You can delete your account at any time from Settings; deletion is permanent.",
          ]}
        />
      </Section>

      <Section title="4. Your content">
        <p>
          You keep ownership of the photos, music, text and listings you upload ("Your
          Content"). To run the service you grant {OPERATOR} a worldwide, non-exclusive,
          royalty-free licence to host, store, reproduce, display, stream and distribute Your
          Content within the service, for as long as it is on your account. This licence ends
          when you delete the content or your account, except for copies in routine backups
          and content others have already shared with you.
        </p>
        <p>
          You promise that you own Your Content or have every right needed to upload it —
          including rights in recordings, compositions, samples, artwork and photos of other
          people — and that it does not infringe anyone's rights or break the law. Uploading
          music you do not have the rights to is not allowed.
        </p>
      </Section>

      <Section title="5. What you may not do">
        <Bullets
          items={[
            "Harass, threaten, bully, discriminate against or impersonate others.",
            "Post sexual, violent, hateful or illegal content, or content involving minors.",
            "Spam, send unsolicited promotions, run scams, or ask other users for money outside a genuine Market sale.",
            "Create fake profiles, or collect other users' data (scraping, harvesting).",
            "Upload malware, or interfere with or overload the service or its security.",
            "Use the service to break any law, or to infringe copyright or trademarks.",
            "Use the service if you are under 18.",
          ]}
        />
      </Section>

      <Section title="6. Market (buying and selling)">
        <p>
          The Market lets members advertise items and services. {OPERATOR} is a venue only: we
          are not a party to any sale, we do not hold items or money, and we do not check
          listings, so we cannot guarantee that an item exists, is legal, or matches its
          description. Deals are made directly between buyer and seller, who are solely
          responsible for the transaction, delivery, taxes and legal compliance. Be careful:
          meet in safe public places, inspect before paying, and avoid prepaying strangers or
          paying by methods that cannot be reversed. Prohibited items include stolen goods,
          counterfeit or pirated products, weapons, drugs and anything unlawful.
        </p>
      </Section>

      <Section title="7. Premium">
        <p>
          Some features (such as messaging musicians you haven't Jammed with) may require a paid
          Premium plan. Prices, billing period and renewal terms are shown at purchase. Unless
          the law of your country gives you a right to a refund, payments are non-refundable.
          You can cancel any time; access continues until the end of the paid period. We may
          change prices with reasonable advance notice.
        </p>
      </Section>

      <Section title="8. AI features">
        <p>
          {OPERATOR} uses artificial intelligence to suggest profile text, conversation openers
          and music recommendations. These suggestions may be inaccurate. Review them before
          using them, and do not rely on them for important decisions. Information from your
          profile may be sent to an AI provider to produce a suggestion (see the Privacy
          Policy).
        </p>
      </Section>

      <Section title="9. Safety, reports and enforcement">
        <p>
          You can block or report any member. We may remove content, limit features, suspend or
          terminate accounts that break these Terms or the Community Guidelines, or that we
          reasonably believe put others at risk, with or without notice. We may cooperate with
          law enforcement where required by law. {OPERATOR} does not screen members and is not
          responsible for what members say or do, online or offline — use common sense when
          meeting people in person.
        </p>
      </Section>

      <Section title="10. Copyright complaints">
        <p>
          If you believe content on {OPERATOR} infringes your copyright, email {CONTACT_EMAIL}{" "}
          with: what work is infringed, where the content is, your contact details, and a
          statement that you are the owner or authorised to act for them. We will review it and
          remove content where appropriate, and may terminate repeat infringers.
        </p>
      </Section>

      <Section title="11. Availability and changes">
        <p>
          The service is provided "as is" and "as available". We try to keep it running, but we
          do not promise it will be uninterrupted or error-free, and features may change or end.
          We may update these Terms; when changes are material we will ask you to accept them
          again. Continuing to use the service after that means you accept the new Terms.
        </p>
      </Section>

      <Section title="12. Liability">
        <p>
          To the fullest extent the law allows, {OPERATOR} is not liable for indirect or
          consequential losses, lost profits or data, or for disputes between members, and our
          total liability to you for any claim is limited to the greater of the amount you paid
          us in the 12 months before the claim or €100. Nothing in these Terms limits liability
          that cannot be limited by law (for example for death or personal injury caused by
          negligence, or for fraud), nor your mandatory consumer rights.
        </p>
      </Section>

      <Section title="13. Governing law and contact">
        <p>
          These Terms are governed by the laws of Greece, and the courts of Greece have
          jurisdiction, without affecting any consumer protections you have in your country of
          residence. Questions: {CONTACT_EMAIL}.
        </p>
      </Section>
    </>
  );
}

function Privacy() {
  return (
    <>
      <Section title="1. Who is responsible">
        <p>
          {OPERATOR} is the controller of the personal data described here. Contact:{" "}
          {CONTACT_EMAIL}. This policy explains what we collect, why, who sees it, and your
          rights, including under the EU/UK GDPR.
        </p>
      </Section>

      <Section title="2. What we collect">
        <Bullets
          items={[
            "Account data: email, password (stored only as a one-way hash), name, and your acceptance of our Terms (version and time).",
            "Profile data you choose to add: bio, instruments, genres, goals, specialties, city/country and approximate coordinates, photos, videos, music and releases.",
            "Market data: listings, prices, photos and audio you post.",
            "Activity: your likes, skips, Jams, track likes, messages you send and receive, blocks and reports.",
            "Technical data: IP address and basic request logs for security and rate limiting. We use your browser's local storage to keep you signed in.",
            "We do not collect payment card numbers ourselves; a payment provider will handle them when Premium is enabled.",
          ]}
        />
      </Section>

      <Section title="3. Why we use it">
        <Bullets
          items={[
            "To provide the service: show your profile, suggest compatible musicians, run the music feed, deliver messages and the Market (performance of the contract).",
            "To keep the service safe: prevent abuse, enforce our Terms, handle reports (legitimate interests, legal obligations).",
            "To improve and personalise recommendations (legitimate interests).",
            "To contact you about your account, such as security and Terms changes.",
          ]}
        />
        <p>We do not sell your personal data and we do not show third-party advertising.</p>
      </Section>

      <Section title="4. Who sees it">
        <p>
          Your profile (name, bio, city, instruments, genres, photos, music, listings) is visible
          to other signed-in members. Your email is never shown to other members. Messages are
          visible to you and the person you wrote to. We use service providers to run the app:
          hosting (Vercel for the website, Render for the server), database and file storage
          (MongoDB Atlas) and an AI provider (Groq) that receives profile details needed to
          generate suggestions such as bios and message openers. These providers act on our
          instructions. We may disclose data if required by law or to protect people's safety.
        </p>
      </Section>

      <Section title="5. Location">
        <p>
          You choose a country and city; we store that place and its coordinates to show
          distances and "Near Me" results. We do not track your live device location in the
          background.
        </p>
      </Section>

      <Section title="6. How long we keep it">
        <p>
          We keep your data while your account exists. When you delete your account we delete
          your profile, uploaded files, listings, conversations and your traces in other
          members' data. Limited copies may remain in backups for a short period, and we may
          keep records we are legally required to keep (for example, abuse reports).
        </p>
      </Section>

      <Section title="7. Your rights">
        <p>
          You can access and download your data and delete your account from Settings. You can
          also ask us to correct your data, restrict or object to some processing, and complain
          to your data-protection authority (in Greece: the Hellenic Data Protection
          Authority). Write to {CONTACT_EMAIL}.
        </p>
      </Section>

      <Section title="8. Security">
        <p>
          Passwords are hashed, traffic is encrypted over HTTPS, and sign-in attempts are rate
          limited. No online service is perfectly secure; please use a strong, unique password.
        </p>
      </Section>

      <Section title="9. Children">
        <p>
          {OPERATOR} is only for people aged 18 and over. If we learn that someone under 18 has
          an account, we will delete it.
        </p>
      </Section>

      <Section title="10. International transfers and changes">
        <p>
          Our providers may process data outside your country, including outside the EU/EEA,
          under appropriate safeguards. We will update this policy when our practices change and
          tell you about material changes.
        </p>
      </Section>
    </>
  );
}

function Guidelines() {
  return (
    <>
      <Section title="Be a good bandmate">
        <p>
          {OPERATOR} is built for people who love making music together. These guidelines keep it
          welcoming and safe. Breaking them can lead to removed content or a suspended account.
        </p>
      </Section>
      <Section title="Do">
        <Bullets
          items={[
            "Use real photos and honest info about your skills, gear and goals.",
            "Respect other people's time, boundaries and answers — a skip or a decline is final.",
            "Only upload music and images you own or have permission to share.",
            "Describe Market items accurately, price them fairly and answer buyers honestly.",
            "Block and report anything that makes you uncomfortable.",
          ]}
        />
      </Section>
      <Section title="Don't">
        <Bullets
          items={[
            "No harassment, hate, threats, stalking or sexual pressure — including in private messages.",
            "No nudity, sexual content, graphic violence or anything involving minors.",
            "No fake profiles, impersonation, or pretending to be someone's band or label.",
            "No spam, chain messages, or advertising unrelated to music.",
            "No scams: don't ask for money upfront outside a genuine Market sale, don't pressure people to leave the app to pay.",
            "No pirated or stolen music, counterfeit gear, or illegal goods.",
            "No sharing other people's private information.",
          ]}
        />
      </Section>
      <Section title="Meeting in person">
        <p>
          Meet in a public place the first time, tell a friend where you're going, and trust your
          instincts. Never send money to someone you haven't met, and be careful with reviews of
          expensive gear — inspect before you pay.
        </p>
      </Section>
      <Section title="Reporting">
        <p>
          Use Report on any profile. Reports are reviewed by our team. If someone is in immediate
          danger, contact your local emergency services first.
        </p>
      </Section>
    </>
  );
}

const PAGES = {
  "/terms": { title: "Terms of Service", body: <Terms /> },
  "/privacy": { title: "Privacy Policy", body: <Privacy /> },
  "/guidelines": { title: "Community Guidelines", body: <Guidelines /> },
};

export default function Legal() {
  const { pathname } = useLocation();
  const page = PAGES[pathname] || PAGES["/terms"];

  return (
    <div className="min-h-dvh bg-[var(--jm-bg)]">
      <div className="max-w-2xl mx-auto px-4 py-8 pb-16">
        <Link to="/" className="text-sm text-[var(--jm-jam)]">
          ← Back to Jamminspot
        </Link>
        <h1 className="text-2xl font-bold mt-4 mb-1">{page.title}</h1>
        <p className="text-xs text-[var(--jm-text-dim)] mb-6">Last updated: {TERMS_VERSION}</p>

        <div className="flex gap-4 text-sm mb-8">
          <Link to="/terms" className="text-[var(--jm-jam)]">
            Terms
          </Link>
          <Link to="/privacy" className="text-[var(--jm-jam)]">
            Privacy
          </Link>
          <Link to="/guidelines" className="text-[var(--jm-jam)]">
            Guidelines
          </Link>
        </div>

        {page.body}
      </div>
    </div>
  );
}
