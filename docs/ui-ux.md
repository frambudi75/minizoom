# UI/UX & Frontend Architecture (Minizoom)

The Minizoom frontend is a single-page-like application powered by **Next.js 14+ (App Router)**. It strictly adheres to modern, dark-themed, glassmorphic design principles using **Tailwind CSS**.

## Key Technologies
- **Framework**: React / Next.js
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Video Components**: LiveKit React Components (`@livekit/components-react`, `@livekit/components-styles`)

## Core Pages & Components

### 1. Landing Page (`app/page.tsx`)
- Contains a sleek hero section with animations.
- Provides immediate entry for **Guests** (Instant Join via Link) and a separate Auth modal for Hosts.
- The Auth system toggles between Login and Register smoothly in a glassmorphism modal.

### 2. Dashboard (`app/dashboard/page.tsx`)
- **Navigation**: Sidebar with dynamic tabs based on role.
- **Overview Tab**: Shows upcoming scheduled meetings and quick-action buttons (Instant Meeting).
- **Schedule Tab**: Form to schedule future meetings.
- **Users Tab (Superadmin)**: Table displaying all registered users, their status, and role management buttons (Make Admin / Demote).
- **Settings Tab (Superadmin)**: Form to configure dynamic system settings (SMTP, Discord).

### 3. Video Room (`app/room/[id]/page.tsx`)
- Fetches a LiveKit token using the provided Guest Name or LocalStorage JWT.
- Renders the `LiveKitRoom` component with standard `VideoConference`.
- **ParticipantSidebar**: A custom UI component injected into the layout. If the current user is a Host, this sidebar displays absolute control buttons (`Kick`, `Mute`, `Stop Vid`) next to each participant's name.

## Design Philosophy
1. **Aesthetics over generic MVPs**: The application utilizes gradients (`bg-gradient-to-r from-blue-600 to-purple-600`), blurred backgrounds (`backdrop-blur-md`), and deep slate colors (`slate-900`) to create a premium feel.
2. **Micro-interactions**: Hover states (`hover:bg-slate-800`), scale animations (`active:scale-95`), and smooth transitions (`transition-all`) are applied to every interactive element.
3. **Responsive**: Layouts transition from grid to flex-column smoothly on mobile devices.
