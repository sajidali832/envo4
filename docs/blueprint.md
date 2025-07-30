# **App Name**: ENVO-EARN

## Core Features:

- Hero Section: Landing page with Hero section displaying the investment opportunity with an 'Invest 6000' button, a 'Sign In' option, and a testimonial section featuring user reviews with star ratings and avatars.
- Payment Submission: Payment Proof Section where users submit proof of their 6000 PKR payment via Easypaisa; Includes a copy-to-clipboard feature for the payment number and stores submission data in Supabase. Then redirects to a Timer Page.
- Approval Timer: Timer Interface: Displays a 10-minute animated countdown timer after payment submission. The timer's state is stored and updated in Supabase and is responsive to admin actions (approval/rejection).
- Account Creation: User Registration System allows users to create accounts after admin approval. Utilizes Supabase Auth for authentication and performs real-time validation for username and email uniqueness.
- Mobile Navigation: Circular Navigation System positioned at the bottom for mobile-responsiveness, including Dashboard, Withdrawal, and Referrals sections, with smooth transitions.
- Earnings and Withdrawals: User Dashboard: Displays the total investment and current total earnings which increments daily. Earnings history is stored in Supabase. User Withdrawal: allows the user to request a withdrawal and also saves which platform they are using, stores the values in Supabase.
- Referrals: Referral System includes referral link generation, referral tracking (stored in Supabase), and bonus earnings, along with logic that ties referral counts into withdrawal eligibility.

## Style Guidelines:

- Primary color: A gentle blue (#78A2CC), symbolizing trust and financial security.
- Background color: Light gray (#F0F2F5), providing a neutral and clean backdrop.
- Accent color: A vibrant orange (#FFA500), used for CTAs and to draw attention to key interactive elements.
- Headline font: 'Space Grotesk' (sans-serif), giving a modern and tech-forward appearance.
- Body font: 'Inter' (sans-serif), offering excellent readability and a neutral tone suitable for dashboard content and user instructions.
- Modern, flat icons that clearly represent investment, earnings, and withdrawals. Icons should be easily understandable and visually consistent across the app.
- Mobile-first design approach with a circular navigation bar at the bottom. All sections should be accessible and navigable with one hand.