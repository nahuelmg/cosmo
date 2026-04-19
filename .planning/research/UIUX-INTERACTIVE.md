## UI Pro Max Search Results
**Domain:** ux | **Query:** button sizes padding states link nav filter pill focus ring hover
**Source:** ux-guidelines.csv | **Found:** 5 results

### Result 1
- **Category:** Interaction
- **Issue:** Focus States
- **Platform:** All
- **Description:** Keyboard users need visible focus indicators
- **Do:** Use visible focus rings on interactive elements
- **Don't:** Remove focus outline without replacement
- **Code Example Good:** focus:ring-2 focus:ring-blue-500
- **Code Example Bad:** outline-none without alternative
- **Severity:** High

### Result 2
- **Category:** Interaction
- **Issue:** Hover States
- **Platform:** Web
- **Description:** Visual feedback on interactive elements
- **Do:** Change cursor and add subtle visual change
- **Don't:** No hover feedback on clickable elements
- **Code Example Good:** hover:bg-gray-100 cursor-pointer
- **Code Example Bad:** No hover style
- **Severity:** Medium

### Result 3
- **Category:** Animation
- **Issue:** Hover vs Tap
- **Platform:** All
- **Description:** Hover effects don't work on touch devices
- **Do:** Use click/tap for primary interactions
- **Don't:** Rely only on hover for important actions
- **Code Example Good:** onClick handler
- **Code Example Bad:** onMouseEnter only
- **Severity:** High

### Result 4
- **Category:** Navigation
- **Issue:** Back Button
- **Platform:** Mobile
- **Description:** Users expect back to work predictably
- **Do:** Preserve navigation history properly
- **Don't:** Break browser/app back button behavior
- **Code Example Good:** history.pushState()
- **Code Example Bad:** location.replace()
- **Severity:** High

### Result 5
- **Category:** Responsive
- **Issue:** Breakpoint Testing
- **Platform:** Web
- **Description:** Test at all common screen sizes
- **Do:** Test at 320 375 414 768 1024 1440
- **Don't:** Only test on your device
- **Code Example Good:** Multiple device testing
- **Code Example Bad:** Single device development
- **Severity:** Medium

