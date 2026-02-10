# Mobile optimization – web (biovera.app)

**Status: Za kasnije** – ovaj dokument opisuje optimizacije za mobilnu verziju web sajta; na stranu dok se fokusira na mobilnu aplikaciju (Expo).

Summary of changes so the site is well optimized for mobile.

---

## 1. Viewport & meta

- **`layout.tsx`**: Exported `viewport` with:
  - `width: "device-width"`, `initialScale: 1`, `maximumScale: 5` (zoom allowed for accessibility)
  - `themeColor: "#2D5A27"` (green) for browser UI
- Ensures correct scaling and no horizontal scroll on phones.

---

## 2. Touch targets (44px minimum)

- **`globals.css`**: `button`, `input`, `select`, `textarea` use `min-height: 44px` so tap targets meet common accessibility guidelines.
- **Navigation (mobile menu)**:
  - Hamburger button: `min-w-[44px] min-h-[44px]`, `aria-label` and `aria-expanded`.
  - Menu links and Dashboard/Logout: `min-h-[44px]` and padding for easy tapping.
- **Footer**: All links use `min-h-[44px] py-2` so they’re easy to tap on mobile.
- **SidebarLayout**: Nav links and Logout use `min-h-[44px]`.

---

## 3. SidebarLayout on mobile (drawer)

- **Desktop (md and up)**: Sidebar stays fixed on the left; content has `pl-64`.
- **Mobile**: Sidebar is hidden by default; content is full width.
  - **Menu button** (hamburger) in the top bar opens the sidebar.
  - Sidebar slides in from the left as a **drawer**; dark overlay behind it.
  - Tapping a nav link or the overlay closes the drawer.
  - Logout also closes the drawer.
- Main content area uses `p-4` on mobile and `p-6` on desktop; title truncates on small screens.

---

## 4. Navigation (public header)

- Mobile menu already existed; touch targets and aria labels were improved.
- No change to desktop layout.

---

## 5. What to test on a real device

- **Homepage**: Hero and CTAs readable and tappable; no horizontal scroll.
- **For Buyers / Growers / Suppliers**: Long text and forms usable on small screens.
- **Login**: Inputs and button at least 44px tall; form fits viewport.
- **Buyer portal (Dashboard, Orders, etc.)**: Open sidebar via hamburger; navigate and close; no content hidden behind sidebar.
- **Footer**: All columns stack; every link easy to tap.
- **Passport / Verify**: Readable and scrollable on narrow viewports.

---

## 6. Optional next steps (not done)

- **PWA**: Add a web app manifest and service worker for "Add to Home Screen" and offline hints (if you want app-like behavior).
- **Images**: Ensure key images use `sizes` and responsive `srcset` (Next.js `Image` helps; verify on heavy pages).
- **Font size**: Consider a single "Large text" control that bumps base font size (e.g. 16px → 18px) for accessibility.

These changes keep your existing design and improve usability and accessibility on phones and small tablets.
