

# Fix: Restore Score Color Classes in CSS

## Problem
The CSS utility classes `match-score-high`, `match-score-medium`, and `match-score-low` were removed during the enterprise redesign. The kanban card code references them but they no longer exist, so scores appear unstyled.

## Solution
Add the three missing CSS classes back to `src/index.css`.

## Technical Details

**File: `src/index.css`** -- Add these utility classes in the `@layer components` or `@layer utilities` section:

```css
.match-score-high {
  background-color: rgb(220, 252, 231);  /* green-100 */
  color: rgb(21, 128, 61);               /* green-700 */
  border: 1px solid rgb(134, 239, 172);  /* green-300 */
  padding: 2px 8px;
  border-radius: 9999px;
  font-weight: 600;
}

.match-score-medium {
  background-color: rgb(254, 249, 195);  /* yellow-100 */
  color: rgb(161, 98, 7);                /* yellow-700 */
  border: 1px solid rgb(253, 224, 71);   /* yellow-300 */
  padding: 2px 8px;
  border-radius: 9999px;
  font-weight: 600;
}

.match-score-low {
  background-color: rgb(254, 226, 226);  /* red-100 */
  color: rgb(185, 28, 28);              /* red-700 */
  border: 1px solid rgb(252, 165, 165); /* red-300 */
  padding: 2px 8px;
  border-radius: 9999px;
  font-weight: 600;
}
```

This is a one-file, CSS-only fix. All the kanban card logic for conditional tech interview/offer status display and internal badges is already working correctly in the component code.
