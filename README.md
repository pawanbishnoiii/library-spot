# Remix of Remix of SeatSavvyhe

You are an expert Senior Software Engineer, Full-stack Architect, and UI/UX Product Designer.

Your task: Build a **Premium, Modern, Production-Level Library Booking SaaS Platform** with extreme attention to UI, animations, structure, and scalability.

The platform has 4 roles:
1. Visitor (no login)
2. User / Student
3. Library Owner
4. Admin (admin@bnoy.in)

Use:
- React or Next.js (App Router)
- Tailwind CSS + custom CSS
- Framer Motion for animations
- 21st.dev components (10+ components required)
- At least 10 React libraries (forms, maps, date operations, share, notifications, etc.)
- Supabase for backend, DB, auth, storage, RLS security
- Responsive, polished UI similar or better than **shineveda.in**

Your output must be a complete working prototype with clean folder structure, reusable components, and modern UI/UX patterns.

────────────────────────────────────────
🎨 **UI / UX DESIGN REQUIREMENTS (Very Important)**  
────────────────────────────────────────

The UI must be:
- Premium, modern, clean, with soft gradients, glassmorphism, shadows, animations
- Uses high-quality fonts (Inter, Poppins, Plus Jakarta Sans)
- Uses SVG icons and PNG images throughout
- Fully responsive (mobile, tablet, desktop flawless)
- Smooth transitions between pages with Framer Motion
- Seat map animations (hover, select, booked, unavailable)
- Dashboard pages have charts, tables, cards, analytics
- Dark mode optional
- Use skeleton loaders, empty states, toast notifications
- Buttons, cards, modals MUST feel premium SaaS-like

Use **at least 10 elements from 21st.dev**:
- Navbar, Sidebar, Cards, Buttons, Badges, Tabs, Accordions, Inputs, Tables, Skeletons, Pagination, etc.

────────────────────────────────────────
🏠 **LANDING PAGE — HOTEL BOOKING STYLE**
────────────────────────────────────────

Landing page must look like a "travel/hotel booking website" with:

- Hero search bar:
  - Search library by: city   ( yaha sirf jo shi suggest hogi jo listed hai ) , state  ( yaha sirf jo shi suggest hogi jo listed hai ) ,libary name ( yaha sirf jo shi suggest hogi jo listed hai ), facilities  ( yaha sirf jo shi suggest hogi jo listed hai ) , ratings, price range  ( yaha sirf jo shi suggest hogi jo listed hai ) , shift times  ( yaha sirf jo shi suggest hogi jo listed hai )
- Featured Libraries grid with cards
- Sections:
  - How It Works
  - Why Choose Us?
  - Membership for Library Owners
  - Testimonials
  - Footer with admin contact email: **admin@bnoy.in**
- “Register Your Library” CTA for owners
- “Find Libraries” CTA for users

────────────────────────────────────────
🔎 **SEARCH RESULTS PAGE**
────────────────────────────────────────
Filters:
- City, State, Location
- Price range
- Facilities (AC, WiFi, Power Backup, Parking, Silent Zone)
- Shifts (Morning, Afternoon, Evening, Night)
- Rating
- Sorting (Price, Ratings, Recent)

Libraries are shown in card layout with:
- Banner image
- Profile image (circle avatar)
- Library name
- Owner name
- City, State, Full address
- Total seats
- Starting price
- Rating + review count

Visitors can view everything WITHOUT LOGIN.

────────────────────────────────────────
📄 **INDIVIDUAL LIBRARY PAGE (SEO INDEXED LIKE HOTEL PAGE)**
────────────────────────────────────────

URL example: `/library/[slug]`

Page must include:

### 1) Banner Image (large wide image)
### 2) Profile Image (circular)
### 3) Library Information
- Library name
- Owner name
- Staff names (owner-controlled list)
- City, state, full address
- Google Map embedded with location pin
- Contact number (owner sets)
- Facilities list with icons
- Opening & closing times (per day)
- Total seats & seat layout phrase (ex: “42 seats · 4 rows · AC Room”)

### 4) Shifts & Pricing
Each shift has:
- Name (Morning/Afternoon/Evening/Night)
- Start–end time
- Price per seat
- Discount (% or amount)
- Seats available count

### 5) Seat Booking Map — Cinema Theatre Style (Very Important)
- Rows A–Z
- Seat numbers 1–50
- Colors:
  - Green = Available
  - Red = Booked
  - Yellow = Pre-booked
  - Grey = Disabled/Blocked
- Seats animate on hover/select
- Owner can modify theme:
  - Color scheme
  - Seat shape (rounded, square, pill)
  - Row labels
  - Seat spacing

### 6) Booking Panel
User selects:
- Date
- Shift
- Seats (1 or more)
- Shows:
  - Price per seat
  - Discount
  - Total hours (based on shift)
  - Final amount

### 7) Pre-Booking Support
User can pre-book seats for future dates.

### 8) Reviews & Comments (User must be logged in)
- Star rating
- Comments
- Pagination
- Average rating shown

### 9) Share options
- Copy link
- WhatsApp share
- Telegram share
- Social share (react-share)

────────────────────────────────────────
👤 **USER / STUDENT FEATURES**
────────────────────────────────────────

Signup requires:
- Full name
- Email (verification required)
- Mobile number (required)
- Password

Features:
- View libraries + seat maps
- Book seats
- Pre-book seats
- Payment info shown (UPI ID of owner)
- Booking history
- Review/comment system
- Profile edit
- Forgot password flow

────────────────────────────────────────
👨‍💼 **LIBRARY OWNER FEATURES**
────────────────────────────────────────

### Owner Registration Flow:
- Owner name
- Library name
- Profile image upload
- Banner image upload
- Address (city, state, pincode)
- Google Map location coordinates
- Contact number
- Facilities selection (icons)
- Membership plan selection (Basic / Pro / Premium)
- UPI ID (PhonePe/GPay/Paytm)
- Owner must be approved by Admin before library is public.

### Owner Dashboard (Very Detailed)
Owner sees:
- Summary stats (today’s bookings, upcoming shifts, total revenue, pending payments)
- Total seats, available seats, booked seats
- Chart: daily/weekly bookings

### Owner Can:
1) **Manage Seats**
- Define rows and columns
- Add/remove seats
- Modify seat numbers
- Disable/enable seats
- Choose seat theme presets

2) **Manage Fees / Payments**
- Set price per shift
- Set discounts (with validity dates)
- View:
  - Total money received
  - Pending payments
  - User-wise pending balance
- Filter by date, user, shift

3) **Membership Expiry Notifications**
- Owner gets alerts:
  - 3 days before user membership expires
  - Or configurable days
- Alerts show in dashboard + email

4) **Booking Control**
- View all bookings
- Approve/cancel bookings
- Mark payment as received (manual flow if payment is direct UPI)

5) **Staff Management**
- Add staff names
- Show on library profile

6) **Pre-booking viewer**
- See all future reservations

────────────────────────────────────────
🛠️ **ADMIN FEATURES**
────────────────────────────────────────

Admin can:
- View all libraries
- Approve or reject new library registrations
- Suspend libraries
- Manage membership plans (price, validity, limits)
- View all users
- View all bookings platform-wide
- Analytics dashboard:
  - total bookings
  - active libraries
  - revenue
  - growth charts
- Edit homepage content
- Manage reports / support issues

────────────────────────────────────────
📦 **SUPABASE DATA MODELS**
────────────────────────────────────────

Tables required:

users (Supabase auth)
profiles (role, name, phone, avatar)
libraries (banner_url, profile_url, owner_id, name, address, city, state, pincode, map_coords, contact, facilities, total_seats, status)
staff (library_id, name)
shifts (library_id, name, start_time, end_time, price, discount, discount_until)
seats (library_id, row_label, seat_number, is_disabled, theme_id)
seat_themes (name, config)
bookings (user_id, library_id, date, shift_id, total_amount, payment_status, payment_reference)
booking_seats (booking_id, seat_id)
owner_memberships (owner_id, plan_id, start_date, end_date)
membership_plans (name, price, duration_days, features)
reviews (library_id, user_id, rating, comment)
notifications (user_id, title, body, type)

Apply Row Level Security properly.

────────────────────────────────────────
📱 **ADDITIONAL UI ADDITIONS**
────────────────────────────────────────
- Snackbar / Toast everywhere
- Animated modal dialogs
- Confirmation dialogs
- Loading skeletons for library pages
- Seat selection animations (bounce, pulse)
- Smooth scroll animations
- Multi-image upload with preview
- Dropdowns, date pickers, time pickers
- Mobile-friendly bottom navigation for users

────────────────────────────────────────
🎯 **FINAL EXPECTATION**
────────────────────────────────────────

Deliver a full working SaaS system with:

- All pages  
- All dashboards  
- Full seat booking map  
- Real data models  
- Supabase integration  
- Clean UI  
- Polished animations  
- Modern design comparable to **shineveda.in**  
- Uses 21st.dev components heavily  
- Uses 10+ React libraries  
- All flows working: search → library page → seat selection → booking → dashboard management → admin controls

Make the UI premium-level and ensure nothing is missed. or esme tum apne hisab se or creavity add kro or ui main importent hoga usko modren banana hai or quality chahiye usme kafi sari image hogi or fully responsive and fully dynmic hoga or esme notifitions system bhi add krna hai or direct whatsapp buttons bhi add karna hai

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://library-spot.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ce1db7e5-0292-4ff2-a3b9-222dd03e7a76).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
