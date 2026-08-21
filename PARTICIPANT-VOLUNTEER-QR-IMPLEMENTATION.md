# Participant + Volunteer + Self Registration Frontend

This frontend was updated against the supplied backend ZIP.

## Backend was not changed

No backend files were modified.

## Implemented

### 1. Participant admin

Uses the existing backend:

- `GET /api/v1/participants`
- `GET /api/v1/participants/:id`

Admin participant list now supports:
- search
- registration method filter
- mobile verification status
- registration method
- WhatsApp availability

Participant profile shows:
- name
- mobile
- country code
- mobile verification
- gender
- age
- location
- occupation
- registration method
- WhatsApp availability
- purpose of visit
- interest category
- consent
- active status
- volunteer details when volunteer registered the participant
- registered-by staff information
- registration answers

### 2. Self registration

QR opens:

`/register?questions=<encoded-active-question-snapshot>`

Flow:

1. Enter mobile number
2. Send OTP
3. Verify OTP
4. Enter participant profile
5. Answer active questions
6. Consent
7. Submit to:

`POST /api/v1/participants/registration`

The verified session is sent as:

`X-Registration-Token`

### 3. Volunteer registration

Super Admin creates a unique volunteer token using:

`POST /api/v1/participants/volunteer/link`

The generated registration URL contains:

`volunteerToken=<token>`

and an encoded snapshot of the currently active questions.

Volunteer registration has two methods:

#### With mobile + OTP

1. Volunteer opens unique link
2. Chooses With mobile + OTP
3. Enters participant mobile
4. Send OTP
5. Verify OTP
6. Fill participant details
7. Answer questions
8. Submit to:

`POST /api/v1/participants/volunteer/registration`

Headers:
- `X-Volunteer-Token`
- `X-Registration-Token`

#### Without mobile

1. Volunteer opens unique link
2. Chooses Without mobile
3. No OTP
4. Fill participant details
5. Answer questions
6. Consent
7. Submit to:

`POST /api/v1/participants/volunteer/registration`

Header:
- `X-Volunteer-Token`

The backend records the mobile as null and `mobileVerified` as false.

### 4. QR page

Admin page:

`/admin/qr`

The page:
- loads active participant questions from the protected admin endpoint
- creates a public `/register` URL containing those question definitions
- displays a QR code
- allows copying the registration link
- allows testing the registration
- allows printing the QR

The QR image is generated using the QR Server image endpoint in the browser. No backend change is required.

### 5. Volunteer page

Admin page:

`/admin/volunteers`

The page:
- loads active questions
- creates a volunteer registration token
- creates a complete volunteer registration URL
- shows expiry
- copies link
- opens registration
- explains both mobile and non-mobile methods

## Important design decision

The supplied backend has no public:

`GET /participants/questions`

endpoint.

The only question GET endpoint is the Super Admin protected:

`GET /api/v1/participant-questions`

Therefore the public registration page does NOT call the protected question endpoint.

Instead, the admin QR/volunteer link generator embeds the active question definitions in the registration URL.

This allows the existing backend to remain unchanged.

## Existing backend contracts used

### Self registration

`POST /participants/registration/send-otp`

`POST /participants/registration/verify-otp`

`POST /participants/registration`

### Volunteer

`POST /participants/volunteer/link`

`POST /participants/volunteer/registration`

### Participant admin

`GET /participants`

`GET /participants/:id`

### Questions

`GET /participant-questions`

This is only called from authenticated admin pages.

## Important testing sequence

1. Start backend on port 5000.
2. Start frontend on port 5173.
3. Login as SUPER_ADMIN.
4. Create at least one active participant question.
5. Open Admin -> Registration QR.
6. Scan/test the generated QR.
7. Complete self registration.
8. Open Admin -> Participants and verify the record.
9. Open Admin -> Volunteers.
10. Create a volunteer link.
11. Test With mobile + OTP.
12. Create another volunteer link.
13. Test Without mobile.
14. Verify both participant records and their registration methods.

## Backend compatibility note

The supplied backend validates required question IDs against the current `ParticipantQuestion` collection. The frontend therefore uses the real MongoDB question IDs when creating the QR/volunteer URL.

The URL contains a snapshot of active question definitions. If questions are changed after a QR/link has already been printed or shared, generate a new QR/link so the snapshot matches the current configuration.
