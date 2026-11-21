DESIGN SPECIFICATION - DocuMind (AI Document Intelligence)

I. GLOBAL BACKGROUND & ATMOSPHERE
- Landing page and auth pages (/, /login, /signup): use a video background with this URL: https://cdn.sceneai.art/Hero%20Section%20Video/bea62976-0843-4cfc-9b03-209e2310838b.mp4 (autoplay, muted, loop, playsInline). It is fixed, fills the whole viewport, object-fit: cover. If the video fails to load, fall back to a dark gradient background (near-black to deep purple). Make the video URL a single constant so it is easy to change later.
- Overlay shape: a soft black gradient on the left side (80% opacity at the left edge, fading to transparent at 70% width) so text stays readable while the scene stays visible on the right.
- App pages (/dashboard, /chat/...): NO video. Use a solid dark background with a subtle purple-tinted gradient, for performance and readability.
- Theme: dark mode by default, futuristic, minimal. Font: Inter. A light mode must also exist with a toggle, but dark is the default.

II. TOP NAVIGATION BAR
- Fixed at the top with a glassmorphism effect: blurred translucent background, subtle white border-bottom.
- Left: logo "DocuMind" with a minimal white delta/triangle icon.
- Center: links (Home, How it works, Features, FAQ) in uppercase, small font, wide letter-spacing.
- Right: a square glass icon button (GitHub icon) and a primary button "Get started" with a dark translucent background and rounded corners.
- On app pages, the right side shows the theme toggle and a user avatar menu instead.
- On mobile, the center links collapse into a menu button.

III. HERO SECTION (landing page)
- Pill tag with a glowing purple "live" dot and the text "RAG Engine Now Live".
- Heading: "Ask your documents anything." Large, bold, tight line-height, subtle drop shadow.
- Subtext (2 lines, high contrast): "Upload your PDFs and get instant answers with exact page citations. Powered by AI, grounded only in your documents."
- Primary button: "Upload & Ask" with a border-rotate conic-gradient animation in orange/gold colors, and a circular arrow icon on the right.
- Secondary button: "Watch Demo" - large glassmorphic pill with a subtle white border and blur.
- Stats row, horizontal, with a thin vertical divider: "Documents Indexed" and "Questions Answered". Use clearly placeholder numbers.

IV. FOOTER
- Fixed at the bottom of the viewport on the landing and auth pages only.
- Copyright on the left, links (Privacy, Support) on the right.
- Tiny uppercase text, tracking-widest, low opacity.

V. APP SCREENS STYLE (dashboard, chat, auth cards)
- Cards, sidebars, panels, inputs, dialogs: glassmorphism (translucent dark background, backdrop blur, thin white/10 border, rounded-2xl).
- Primary actions use the same dark translucent button style. Important actions (like Upload and Send) may use the orange/gold conic-gradient border.
- Accent color: purple for highlights, active states, and the live dot. Gold/orange for key calls to action.
- Status badges: processing = animated purple, ready = green, failed = red.
- Citation chips: small glass pills with a purple tint.

VI. TECHNICAL
- Fully responsive for mobile and desktop.
- Hover states on all buttons and smooth transitions, including the conic-gradient animation.
- Tailwind CSS for layout; custom keyframe animations in standard CSS.
- Respect prefers-reduced-motion: pause the video and animations for those users.
