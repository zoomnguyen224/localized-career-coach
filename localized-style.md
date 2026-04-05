Localized.world — Design System Analysis
Here's a complete breakdown of their design system so you can match it precisely in your slide deck and prototype.

🏷️ Brand Identity
Localized is a career platform for international students and global professionals. The visual language is clean, modern, professional yet warm — similar to LinkedIn but with a more youthful, global, and optimistic feel. The logo combines a lightbulb + location pin icon in a gradient blue-to-teal, with "Localized" where the "ed" is in the brand blue.

🎨 Color Palette
Primary Colors
RoleNameHexRGBPrimary BlueBlue 500#4584FFrgb(69, 132, 255)Primary DarkBlue 600#245FD1—Deep NavyGray 800#06123Crgb(6, 18, 60) — main textDark NavyGray 700#1D2A59rgb(29, 42, 89)
Secondary / Accent Colors
RoleNameHexSuccess / CTA GreenGreen 500#03BA82Green DarkGreen 600#009C6CLight Blue TintBlue 100#ECF3FFBlue SoftBlue 200#DCE8FF
Neutral / UI Colors
RoleHexUsagePage Background#F8F9FB (Gray 50)Main canvasCard Background#FFFFFFCards, headerBorder / Divider#DCDFE8 (Gray 300)Lines, separatorsSubtle Gray#F2F3F6 (Gray 200)Chips, pill BGsMuted Text#727998 (Gray 600)Subtitles, metaPlaceholder Text#8D96B4 (Gray 500)Labels, hintsDisabled/Light#BFC5D6 (Gray 400)Inactive states
Semantic Colors
RoleHexError / Invalid#F84E4EWarning#FAA82CInfo (Blue)#4584FFSuccess#03BA82

🔤 Typography
Font Family: Figtree (Google Font) — a modern, rounded geometric sans-serif. Very clean and slightly casual/friendly.
StyleSizeWeightLine HeightUsageDisplay / Hero38px (2.375rem)700 Bold—Hero headlinesH132px (2rem)700 Bold—Page titlesH224px700 Bold28.8pxSection headersH320px (1.25rem)700 Bold—Card titlesBody / Default16px (1rem)400 Regular24pxBody textBody Small14px (0.875rem)400 Regular—Labels, captionsCaption / Micro12px (0.75rem)400 Regular—Tags, timestampsButton14px600 SemiBold—All buttonsNav / Labels14px600 SemiBold—Navigation
Letter Spacing: H2 and H3 headings use +0.02em (0.48px tracking)

📐 Spacing System
Uses a 4px base unit (standard 4pt grid):
TokenValueUsage14pxMicro gaps28pxIcon padding312pxCompact spacing416pxStandard gap520pxMedium gap624pxSection inner padding832pxCard padding1040pxSection gaps1248pxLarge sections

🟦 Border Radius
TokenValueUsagebutton14pxAll CTA buttonscard10pxContent cardsmd6pxInputs, small chipsxl12pxModals, larger panels2xl16pxFeatured bannerslanding30pxLanding page sectionsfull9999pxPills, avatars, tags

🧩 Component Patterns
Header / Navigation Bar

Background: Pure white #FFFFFF
Shadow: Subtle 0px 2px 4px rgba(141, 150, 180, 0.12)
Height: ~56px
Logo: Left-aligned, icon + wordmark
Nav icons: Search, Messages, Bell, Menu — all in #06123C dark navy
Bottom Nav (mobile): White bar, active tab highlighted with filled blue icon + pill

Cards

Background: White #FFFFFF
Border Radius: 10px
Shadow: 0px 5px 60px 0px rgba(151, 155, 192, 0.2) (drop shadow)
Padding: 16–24px
Divider: #DCDFE8 1px border between cards

CTA Buttons (Primary)

Background: #4584FF (Blue 500)
Text: White, 14px, SemiBold (600)
Border Radius: 14px
Padding: 0px 48px (generous horizontal)
Height: ~40px

Secondary/Ghost Buttons

Background: Transparent
Border: 1px solid #BFC5D6
Text: #06123C dark navy

Tags / Chips

Background: #F2F3F6 or #ECF3FF (light blue)
Text: #727998 or #4584FF
Border Radius: 9999px (fully rounded)
Font: 12px, medium weight

Feed Posts / Content Cards

Separated by white card blocks with 10px rounded corners
Author line: Avatar + Name (SemiBold, dark navy) + timestamp (muted gray)
Source label: ALL CAPS, 10px, muted — e.g. NEW SCIENTIST

Event Cards

Thumbnail image with category label on the side (rotated 90°, very small)
Title: Bold 18–20px, dark navy
Date: Calendar icon + text in muted gray
Background: White card, 10px radius


🌟 Visual Style Summary
DimensionStyleOverall feelClean, airy, professional-friendlyLayoutSingle-column feed (mobile-first), card-basedBackgroundOff-white #F8F9FB canvas, white cardsImageryReal photos, colorful event banners with gradient backgrounds (blue-to-green gradients)IconographyLine icons (thin stroke), rounded styleMotionSubtle — hover shadows deepen, no aggressive animationElevationSoft diffuse shadows, no harsh drop shadows

🎯 Quick Reference for Slides/Prototypes
Primary palette to use:

Dark Navy #06123C — headlines, primary text
Blue #4584FF — CTAs, links, accent
Green #03BA82 — success, secondary CTA
Background #F8F9FB — slide/screen canvas
White #FFFFFF — card surfaces
Muted #727998 — secondary text

Font: Figtree (available on Google Fonts — free to download and use in Figma/Slides)
Shapes: Rounded everything — 10px cards, 14px buttons, pill tags
Tone: Optimistic, global, inclusive — use real faces, diverse imagery, clean layouts with generous whitespace