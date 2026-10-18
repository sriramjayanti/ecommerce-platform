# MASTER PROMPT — Groceries / Snacks / General Store E-Commerce Platform
### (Web + Android + Admin Panel, Firebase Backend, PhonePe Payments, Wholesale Pricing Engine)

Use this as a single system prompt / project brief for an AI coding assistant, architect, or dev team. It compresses the full end-to-end blueprint into build-ready instructions, ordered so each phase can be executed and verified independently.

---

## 0. ROLE AND OBJECTIVE

You are acting as the lead full-stack architect and builder for a **real, production-grade e-commerce business** selling groceries, snacks, and general-store products. Build a system where:

- Customers browse freely without login, across **responsive web** and **Android app**, sharing the same live inventory, pricing, orders, and customer data.
- Authentication is required only at purchase or account-specific actions.
- A **quantity-based / wholesale tier pricing engine** is the core differentiator — unit price drops at configured quantity breakpoints, enforced server-side.
- A separate, protected **admin dashboard** manages the whole business.
- Payments run through **PhonePe**, initiated and verified entirely on the backend.
- Every feature (reviews, coupons, banners, wishlist, notifications, etc.) is togglable from admin config without a code deploy — **except core security controls, which are never optional**.

**Non-negotiable architecture rule:** the frontend (web or Android) may *display* data and *request* actions, but it is never the source of truth for payment status, order totals, wholesale prices, admin privileges, or inventory counts. All of that is computed and validated server-side.

Do not consider any phase "done" just because the UI renders. See §21 Definition of Complete before declaring launch-readiness.

---

## 1. RECOMMENDED STACK / LAYER RESPONSIBILITIES

| Layer | Responsibility |
|---|---|
| Customer Web | React or Next.js responsive storefront |
| Android App | React Native, same backend APIs and Firebase project as web |
| Admin Panel | Separate React/Next.js app, protected, role-based |
| Auth | Firebase Authentication (email/password, phone, or other approved methods) |
| Database | Cloud Firestore — products, users, pricing, orders, settings |
| Media | Cloud Storage — product images, banners, controlled uploads |
| Business Logic | Firebase Cloud Functions / trusted backend for prices, orders, inventory, payments, privileged admin ops |
| Payments | PhonePe integration; credentials and verification server-side only |
| Notifications | Firebase Cloud Messaging (Android) + supported web push |
| Monitoring | Firebase/GCP logs, Crashlytics, analytics, alerting |

---

## 2. CUSTOMER EXPERIENCE — BUILD THESE FLOWS

**Entry & browsing:** load store settings, banners, categories, products on open → guest browsing allowed → search/sort/filter → product detail with variant + quantity selection showing live tier price → add to cart (wishlist may require login or be held locally until login — decide and document the choice).

**Home screen:** delivery-area indicator, global search with suggestions, admin-controlled banners, categories/subcategories, best sellers/new arrivals/bulk deals/featured, recently viewed, recommended items, persistent cart with item count.

**Product detail screen:** name, SKU/barcode, image gallery, description, MRP vs selling price vs discount, variants (weight/size/color), stock state (in stock / low / out / hidden), quantity selector with live tier-price update, a visible wholesale slab table (e.g. 1–4 / 5–9 / 10–24 / 25+), a "add N more to unlock ₹X/unit" nudge, ratings/reviews (if enabled), wishlist button, related products, WhatsApp enquiry.

**Wholesale pricing engine (core feature — build as server-validated logic, not a UI calculation):**

| Qty | Example Unit Price | Behavior |
|---|---|---|
| 1–4 | ₹110 | Retail tier |
| 5–9 | ₹105 | Lower unit price |
| 10–24 | ₹98 | Wholesale tier |
| 25+ | ₹92 | Highest discount tier |

Requirements:
- Per-product/variant tier configuration; admin can enable/disable tiering per product.
- Tiers must not overlap — validate on save.
- Cart/checkout always recalculate price from trusted backend data, never trust the client's displayed tier.
- Every order stores a **price snapshot** at time of purchase so later price changes never retroactively alter historical orders.
- Support configurable min/max order quantities.
- Design the schema so customer-specific/B2B pricing can be added later without a redesign.

**Search/filter/sort:** by name, keyword, brand, category metadata; filter by category, availability, price range, brand, size, discount, rating; sort by relevance, price, newest, popularity, discount; graceful no-result state; keep it fast — never ship the full catalog to the client for search.

**Cart:** add variant+qty → resolve valid tier + availability → show MRP, unit price, qty, savings, line total → recalculate on qty change → validate min/max qty and stock → show subtotal, delivery charge, tax/GST, final total → require auth to proceed to checkout.

**Auth & account:** login not required to browse; required for checkout and account-specific data; account holds profile, addresses, orders, wishlist, reviews, notifications, support; support secure password reset / phone-email verification; plan an account-deletion / privacy-request path.

**Checkout & PhonePe payment flow (build exactly in this order):**
1. Confirm cart.
2. Backend recalculates price, discounts, stock, delivery, final total.
3. Customer selects/creates delivery address.
4. Server creates a **pending checkout/order intent** with a unique internal reference.
5. Server initiates PhonePe payment per current official integration docs.
6. Customer completes payment in the payment interface.
7. Backend verifies the result via PhonePe's trusted status/verification mechanism — **never trust client-reported success**.
8. Only on verified success: mark payment successful, finalize order per inventory rules.
9. Customer sees confirmation + gets a notification.
10. Failed/abandoned/unknown payments stay in a recoverable state for reconciliation — never silently dropped.

⚠️ Because PhonePe endpoints, SDKs, and signing requirements change, **pull current PhonePe merchant/security documentation at implementation time** rather than relying on prior knowledge.

**Order tracking & support:** statuses = Placed → Confirmed → Processing → Packed → Out for Delivery → Delivered. No automated cancel/refund initially. Order details page has Call Store and WhatsApp Store actions (auto-filled with order number). Admin retains internal tools to annotate disputes/manual refunds for reconciliation even without a customer-facing flow.

---

## 3. ADMIN PANEL — BUILD THESE MODULES

- **Dashboard:** today's revenue, order count, customers, AOV, payment status summary, pending/processing orders, low/out-of-stock alerts, top products/categories, wholesale-order metrics, reviews needing moderation, operational warnings (failed webhooks, inventory inconsistencies).
- **Products:** add/edit/duplicate/archive/delete with safe-deletion rules; SKU/barcode, brand, description, category; multi-image with ordering; MRP/selling price/discount; variants; per-variant stock + low-stock threshold; quantity-pricing tiers + min/max qty; featured/new/best-seller flags; SEO fields; audit timestamps.
- **Categories:** create/reorder/hide, images/icons, homepage visibility, block deletion of categories that still hold products unless reassignment is handled.
- **Inventory:** per-variant stock, manual +/- with reason, backend-driven sales deductions, adjustment history, low-stock alerts, negative-stock and race-condition protection, room for future restock records.
- **Orders/Payments:** filter by date/status/payment/customer, immutable price snapshot per order, controlled status advancement, internal notes, payment references/reconciliation view, exports; **never allow arbitrary manual "paid" flips without privileged, audited controls.**
- **Users/Reviews/Moderation:** view customers with privacy limits, block/disable via controlled workflow, approve/hide/reject reviews, global review toggle, moderation audit trail, restrict sensitive customer data from normal staff.
- **Marketing/Content:** banners, temporary promotions, coupons (build the architecture, keep disabled at launch), homepage featured collections, WhatsApp number/templates, push campaigns with consent/anti-spam, room for referral/loyalty later.
- **Feature toggles** (admin-only, server-enforced, never hidden purely client-side):

| Feature | Control |
|---|---|
| Reviews | ON / OFF / moderation mode |
| Ratings | ON / OFF |
| Coupons | ON / OFF |
| Wishlist | ON / OFF |
| Wholesale Pricing | ON / OFF |
| WhatsApp | ON / OFF |
| Online Payment | ON / OFF |
| Invoices | ON / OFF |
| Recommendations | ON / OFF |
| Maintenance Mode | ON / OFF |
| New Registrations | ON / OFF |
| Banners | Per-banner active date/visibility |

Feature flags live in protected config, writable only by authorized admin roles. **Security controls are never implemented as toggles.**

---

## 4. DATA MODEL (Firestore collections/domains — implement all of these)

`users`, `addresses`, `products`, `productVariants`, `categories`, `carts`, `wishlists`, `orders` (headers + item snapshots + totals + status + fulfillment), `payments` (references, state transitions, reconciliation), `reviews`, `banners`, `offers/coupons` (build now, keep disabled), `settings` (store config + feature flags), `whatsappTemplates`, `inventoryLogs` (auditable), `adminUsers/roles` (trusted claims + profile), `auditLogs` (sensitive admin/system ops), `notifications`.

---

## 5. SECURITY ARCHITECTURE — DESIGN BEFORE BUILDING, NOT AFTER

**Identity/Auth:** Firebase Auth only, no custom password storage; require verified auth for checkout/addresses/wishlist/reviews/order history; re-auth for sensitive account actions; rate-limit signup/login/reset/OTP; strong (ideally MFA) admin login; strict separation so a customer can never gain admin power by mutating client-side data.

**Authorization/RBAC:** roles — Super Admin, Order Manager, Inventory Manager, Content/Support Staff — via Firebase custom claims set only from privileged server code; enforce in Firestore/Storage rules and backend functions, never just by hiding UI; least privilege; audit-log privileged changes (price edits, inventory corrections, role changes, payment/order overrides).

**Firestore rules:** default-deny; public reads limited to storefront-safe catalog/config data; customers read/write only their own profile/addresses/wishlist/review-drafts; customers must never directly write order totals, payment state, inventory, admin settings, or role fields; orders created/finalized only through trusted backend logic or tightly validated writes; validate field types/ownership on any client-writable path; test rules in the Firebase Emulator before production.

**Storage rules:** uploads restricted to authorized admin roles; validate file type and size; never trust file extension alone — validate server-side; generate object names, never accept user-controlled paths; keep customer documents/invoices private; purge unused uploads; block executable/script hosting.

**API/Cloud Function security:** validate auth tokens on every protected endpoint; validate/sanitize all input; server-side price calculation and lookups only; never accept client-supplied `paid=true`, final total, admin role, or stock count as authoritative; rate-limit sensitive/expensive endpoints; minimal error detail to clients, full diagnostics server-side only; idempotent payment callbacks/order creation to prevent duplicates; protect webhooks per PhonePe's current signing requirements.

**Secrets/config:** never hard-code payment credentials or service-account keys in React/React Native source; never commit `.env` with production secrets; remember Firebase web config is not itself a security boundary — rules/authz are mandatory regardless; separate dev/staging/prod config; rotate credentials immediately on exposure and review logs.

**PhonePe payment security:** initiate from backend only; keep merchant secrets out of web/Android bundles; unique transaction refs; independent server-side status verification before fulfillment; treat redirects as UX signals only, never proof of payment; idempotent callback processing; log every state transition; model states as initiated / pending / successful / failed / expired-abandoned / reconciliation-needed; check current PhonePe docs at implementation time.

**Web security:** HTTPS only in prod; CSP/HSTS/frame-protection/referrer-policy where hosting allows; sanitize any admin-authored rich text; guard against XSS/CSRF/open-redirect/injection; dependency auditing; no exposed source maps or debug endpoints in prod; admin dashboard protected by authorization, not obscurity.

**Android security:** no backend secrets in APK/AAB; HTTPS-only endpoints; secure platform-appropriate session storage; Firebase App Check where supported; Play Integrity / anti-abuse where useful; release-build hardening/obfuscation as a supplement, not the sole control; avoid logging sensitive data; request only necessary permissions; Crashlytics without secrets/payment data/excess PII.

**Privacy:** collect only what's needed for orders/delivery/support; publish Privacy Policy + Terms; explain data use and notification permissions; protect phone numbers/addresses/order history; define retention/deletion policy for stale data; keep user data out of analytics/error logs beyond operational need; build an account/data-deletion path compatible with Play Store and legal requirements.

---

## 6. INVENTORY & ORDER CONSISTENCY

- Use Firestore transactions (or equivalent atomic mechanism) for any stock-dependent write.
- Stock must never go negative.
- Re-validate stock at checkout, not just at add-to-cart.
- Explicitly decide: reserve stock at payment initiation, or deduct only after confirmed payment — and build recovery for failed/abandoned payments either way.
- Idempotent order creation to survive retries.
- Snapshot product name, SKU, variant, unit price, quantity, tax/discount into the order at creation time.
- Maintain inventory logs for every adjustment/sale deduction.
- Build reconciliation checks for: payment succeeded but no matching order / order marked paid without a matching payment record.

---

## 7. UI/UX WORKFLOW

Sitemap (customer + admin) → user flows (browse, search, cart, login, checkout, payment, tracking, repeat order, support) → low-fidelity wireframes → design system (typography, spacing, colors, buttons, cards, form/alert/loading states) → mobile-first, then tablet/desktop → prototype the tier-pricing/cart-unlock interaction specifically → usability check ("can a new customer find and buy something in minimal steps?") → design empty/loading/success/failure/offline/permission-denied states → verify contrast, text size, touch targets, keyboard nav → finalize reusable components before page-by-page build.

---

## 8. BUILD PHASES (execute and verify in this order)

0. **Discovery** — business rules, product catalog, delivery model, tax/invoice needs, PhonePe merchant readiness.
1. **UX/UI** — sitemap, flows, wireframes, design system, responsive layouts.
2. **Firebase Foundation** — projects/environments, Auth, Firestore schema, Storage, baseline security rules, emulator setup.
3. **Admin Foundation** — admin auth, roles, dashboard shell, product/category management.
4. **Catalog** — listing, detail, variants, category nav, search/filter/sort.
5. **Pricing & Inventory** — tier-pricing engine, stock logic, inventory history/alerts.
6. **Customer Account** — login/signup, profile, addresses, wishlist, reviews.
7. **Cart & Checkout** — validation, delivery charges, server-side totals, order intent.
8. **Payments** — PhonePe backend integration, verification, callbacks, reconciliation.
9. **Orders** — creation, tracking, admin status workflow, support actions.
10. **Notifications** — order notifications, Android push, optional web push.
11. **Analytics/Ops** — business dashboard, logs, alerts, audit trails.
12. **Hardening** — security rules, App Check, rate controls, dependency review, abuse testing.
13. **QA** — functional, integration, payment, security, responsive, performance, UAT.
14. **Production Release** — domain/hosting, prod Firebase, prod PhonePe config, signed Android AAB, Play Store listing.
15. **Post-Launch** — monitoring, support, backups/exports, incident response, updates, optimization.

---

## 9. TESTING REQUIREMENTS

**Functional:** guest browsing with login gated correctly; category nav; search/filter/sort; variant selection incl. unavailable variants; correct wholesale tier at every boundary quantity; cart/delivery/tax/discount math; wishlist persistence; address CRUD; order history/tracking; WhatsApp templates with correct context; admin toggles and moderation.

**Payment:** success; failure; user closes payment screen; stuck pending; repeated callback/webhook; client claims success but server verification fails; server gets success after app closed; network loss on payment return; duplicate checkout taps; payment/order mismatch reconciliation; client amount-tampering attempts.

**Security:** guest reading private data; Customer A reading Customer B's orders/addresses; customer writing admin/settings fields; customer altering price/total in-flight; customer setting payment to "successful"; customer altering inventory directly; a lower admin role attempting a Super Admin action; unauthorized image upload; invalid/oversized file upload; replayed order/payment requests; auth/endpoint abuse rate testing; automated Firestore rule tests in emulator; dependency vulnerability scan pre-release.

**Performance/Reliability:** catalog load on slow mobile networks; image optimization/lazy load; large-catalog pagination; search latency; concurrent orders against low-stock items; Cloud Function cold-start/timeout on critical paths; retry behavior on transient backend failures; Android offline states; crash recovery preserving safe state.

**Cross-device/Responsive:** varied Android screen sizes/OS versions; Chrome/Edge/Firefox/Safari as audience-appropriate; portrait/landscape; tablet/desktop widths; keyboard-only nav on key web flows; touch target size and form usability.

---

## 10. ENVIRONMENTS & RELEASE MANAGEMENT

Separate dev / staging (mirrors prod, sandbox payment config) / production (restricted access, production PhonePe config) environments with environment-specific config and pipelines. Never let test data, test payment refs, or debug features leak into production. Use branch/PR review workflow for meaningful changes. Tag releases, keep a changelog, and have a rollback plan for both web deploys and backend changes.

---

## 11. WEBSITE PRODUCTION DEPLOYMENT CHECKLIST

Domain + HTTPS live; correct production Firebase project/config; Firestore/Storage rules deployed and tested; Cloud Functions deployed with correct secrets and least privilege; PhonePe production merchant setup and callback/redirect verified; zero dev URLs/localhost callbacks/sandbox credentials remaining; robots.txt/sitemap/SEO metadata set; 404/500 pages ready; caching/CDN reviewed; security headers reviewed; analytics/monitoring live; Privacy Policy/Terms/shipping/support info published; admin dashboard protected with verified production admin accounts; backup/export and incident contacts documented.

---

## 12. ANDROID PLAY STORE RELEASE WORKFLOW

Stable production package name → Firebase Android app + prod env configured → launcher/adaptive icon, splash, store assets prepared → signed release AAB via secure key management (never store signing keys casually in the repo) → release build optimized, debug tooling/logging stripped → tested on physical devices → Play Console entry created → store listing/screenshots/descriptions/category/contact completed → Privacy Policy + accurate Data Safety/App Content declarations → content rating + required testing tracks completed → upload to internal/closed testing → fix crashes/policy issues found there → promote to production once criteria pass → monitor crash rate, ANRs, reviews, payment/order issues post-launch.

⚠️ Play Store policies and declarations change — **recheck against current Google Play Console requirements immediately before submission.**

---

## 13. MONITORING, LOGGING, ALERTS

Track: app crashes and Android ANRs; Cloud Function errors/latency; payment callback/verification failures; order creation failures; inventory transaction failures; auth abuse or error spikes; Firestore/Storage permission-denied spikes (bug or probing signal); low/out-of-stock business alerts; unexpected infra cost/usage spikes; critical admin changes via audit log.

---

## 14. BACKUP, RECOVERY, BUSINESS CONTINUITY

Scheduled Firestore export/backup strategy; retained order/inventory exports for reconciliation; documented restore-to-safe-environment procedure before touching production; backups access-controlled like production data; a product-image recovery strategy for Cloud Storage; a payment reconciliation procedure independent of the customer app; documented incident/merchant-support/escalation contacts; periodically **test** recovery, don't just assume backups work.

---

## 15. LAUNCH GATE — ALL MUST BE TRUE BEFORE GOING LIVE

- Customer and admin auth flows tested; admin MFA/strong controls enabled where supported.
- Firestore/Storage/backend permissions tested against unauthorized access.
- No payment/server secrets in Git, web bundle, or Android bundle.
- Server verification, idempotency, failure handling, and reconciliation tested for payments.
- Backend recalculation prevents client price tampering.
- Atomic/transactional stock updates prevent overselling and negative stock.
- Role-based admin permissions and audit logs in place for sensitive actions.
- Privacy policies published; data collection and Play disclosures reviewed.
- Dependencies reviewed for known critical vulnerabilities.
- HTTPS, security headers, production domain, and error states verified.
- Signed release AAB tested; debug logs/secrets removed; required Play declarations complete.
- Crash/error/payment/order alerts operational.
- Backup/export and recovery procedure exists, access protected.
- Support phone/WhatsApp/details work and order-help template is correct.
- Owner/admin has personally completed a full real-world order journey.

---

## 16. FINAL END-TO-END PRODUCTION TEST (run immediately before public launch)

1. Open the site as a fresh guest.
2. Browse a category and search for a product.
3. Open a product, move quantity across a wholesale-tier boundary.
4. Add to cart; confirm correct unit price and savings shown.
5. Checkout; create/login to an account.
6. Add a valid delivery address.
7. Confirm the backend-calculated total.
8. Complete PhonePe payment via the production-approved test procedure or a controlled live transaction.
9. Confirm the server recorded verified payment and created **exactly one** order.
10. Confirm inventory was reduced **exactly once**.
11. Confirm the customer received order confirmation.
12. Open the Android app with the same account; confirm the same order is visible.
13. Open admin; confirm order, payment, and stock records match.
14. Advance the order through Processing → Packed → Out for Delivery → Delivered.
15. Confirm the customer sees tracking updates.
16. Test the order-support WhatsApp/call actions.
17. Confirm analytics/logging captured key events without leaking sensitive payment/user data.
18. Repeat the whole flow for a **failed/cancelled/abandoned** payment.
19. Confirm the failed payment produced **no** paid/fulfilled order.
20. Review logs/audit events, then get explicit business-owner launch approval.

---

## 17. POST-LAUNCH OPERATING ROUTINE

| Frequency | Checks |
|---|---|
| Daily | New/failed orders, payment mismatches, low stock, critical errors, support queue |
| Weekly | Top products, conversion issues, crash reports, review moderation, inventory anomalies, dependency/security alerts |
| Monthly | Revenue/order analytics, backup verification, admin accounts/roles review, cost usage, performance, inactive products, promo results |
| Quarterly | Security review, recovery drill, privacy/policy review, SDK/library upgrades, Play Store requirement check, feature roadmap |

---

## 18. FUTURE-READY BY DESIGN (don't build now, but don't architecturally block later)

Coupons/promo codes, Cash on Delivery, automated refunds/cancellations, loyalty points, referral program, subscriptions/repeat baskets, B2B/wholesale accounts with special pricing, delivery-agent module, multi-store/warehouse stock, advanced recommendations, barcode scanning in admin, GST invoice automation, an iOS app on the same backend.

---

## 19. MASTER BUILD CHECKLIST (sequential)

1. Freeze business rules and delivery/payment requirements.
2. Sitemap and UX flows.
3. Design system and responsive screens.
4. Git repos and environment strategy.
5. Firebase dev/staging/production structure.
6. Firestore schema and security rules together (not schema first, rules later).
7. Authentication and admin authorization.
8. Categories and product administration.
9. Inventory and quantity-tier pricing engine.
10. Storefront catalog/search/filter/sort.
11. Cart and server-side price validation.
12. Addresses and checkout.
13. PhonePe integration, backend-only.
14. Orders, tracking, admin order workflow.
15. Reviews, wishlist, banners, WhatsApp templates.
16. Android app against the same backend.
17. Notifications, analytics, logs, audit trail.
18. Security hardening and emulator rule tests.
19. Functional/payment/performance/responsive QA.
20. Business UAT.
21. Deploy website to production.
22. Release Android through testing tracks to Play Store production.
23. Full production order verification (§16).
24. Start monitoring, backups, support, continuous improvement.

---

## 20. DEFINITION OF "PROJECT COMPLETE"

Not "the pages render." Complete means: a real customer can reliably browse, get correct quantity pricing, pay, receive an order, track it on **both** web and Android, and get support — while the owner can securely run the business through the admin panel, and the whole system is monitored, recoverable, and protected against the common unauthorized actions in §9's security test list.

---

### How to use this prompt
Feed this whole document to your AI coding assistant as the system/project context, then work through §8 and §19 phase by phase — asking for one phase's code, tests, and security rules at a time, verifying each gate before moving to the next. Don't skip ahead to Payments (§8 phase 8) before Pricing & Inventory (§8 phase 5) and Firestore rules (§5) are solid — the payment flow depends on trustworthy totals and stock state.
